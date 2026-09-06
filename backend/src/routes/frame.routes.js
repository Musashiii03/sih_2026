// Frame API Routes
// Provides HTTP endpoints for retrieving fire incident frames and metadata
//
// Endpoints:
//   GET /api/incidents - List all fire incidents
//   GET /api/incidents/:incidentId/summary - Get incident summary JSON
//   GET /api/incidents/:incidentId/frames/:frameIndex - Serve frame image

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { resolveCameraStreamUrl, getAllCameras, resolveCameraDetails } = require('../utils/cameraConfig');

const router = express.Router();

// Base path for fire incidents storage
// Configured relative to backend directory or via environment variable
const INCIDENTS_BASE_PATH = process.env.FRAME_STORAGE_PATH
  ? path.resolve(__dirname, '../..', process.env.FRAME_STORAGE_PATH)
  : path.resolve(__dirname, '../../data/fire_incidents');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Scans the incident directories to find all available incidents
 * 
 * Directory structure:
 *   data/fire_incidents/
 *     2025-01-15/
 *       INC-20250115-143022/
 *         summary.json
 *         frames/
 *         metadata/
 * 
 * @returns {Promise<Array>} Array of incident objects with metadata
 */
async function scanIncidentDirectories() {
  try {
    // Check if base directory exists
    try {
      await fs.access(INCIDENTS_BASE_PATH);
    } catch (error) {
      console.warn('⚠️  Incidents directory does not exist:', INCIDENTS_BASE_PATH);
      return [];
    }

    const incidents = [];

    // Read date directories (e.g., "2025-01-15")
    const dateDirs = await fs.readdir(INCIDENTS_BASE_PATH, { withFileTypes: true });

    for (const dateDir of dateDirs) {
      if (!dateDir.isDirectory()) continue;

      const datePath = path.join(INCIDENTS_BASE_PATH, dateDir.name);

      // Read incident directories within each date directory
      const incidentDirs = await fs.readdir(datePath, { withFileTypes: true });

      for (const incidentDir of incidentDirs) {
        if (!incidentDir.isDirectory()) continue;

        const incidentPath = path.join(datePath, incidentDir.name);
        const summaryPath = path.join(incidentPath, 'summary.json');

        // Check if summary.json exists
        try {
          await fs.access(summaryPath);

          // Read summary to get metadata
          const summaryContent = await fs.readFile(summaryPath, 'utf8');
          const summary = JSON.parse(summaryContent);
          const cameraId = summary.camera_id || 'Unknown';
          const cameraStreamUrl = resolveCameraStreamUrl(cameraId);

          incidents.push({
            incident_id: summary.incident_id || incidentDir.name,
            timestamp: summary.timestamp || 0,
            timestamp_readable: summary.timestamp_readable || '',
            frame_count: summary.frame_count || 0,
            camera_id: cameraId,
            camera_stream_url: cameraStreamUrl,
            location: summary.location || 'Unknown',
            date_directory: dateDir.name,
            incident_directory: incidentDir.name
          });
        } catch (error) {
          console.warn(`⚠️  Could not read summary for incident ${incidentDir.name}:`, error.message);
          // Skip incidents without valid summary.json
          continue;
        }
      }
    }

    // Sort incidents by timestamp (newest first)
    incidents.sort((a, b) => b.timestamp - a.timestamp);

    return incidents;
  } catch (error) {
    console.error('❌ Error scanning incident directories:', error);
    throw error;
  }
}

/**
 * Finds the summary.json path for a given incident ID
 * 
 * @param {string} incidentId - The incident identifier (e.g., "INC-20250115-143022")
 * @returns {Promise<string|null>} Absolute path to summary.json or null if not found
 */
async function findSummaryPath(incidentId) {
  try {
    // Check if base directory exists
    try {
      await fs.access(INCIDENTS_BASE_PATH);
    } catch (error) {
      console.warn('⚠️  Incidents directory does not exist:', INCIDENTS_BASE_PATH);
      return null;
    }

    // Read date directories
    const dateDirs = await fs.readdir(INCIDENTS_BASE_PATH, { withFileTypes: true });

    for (const dateDir of dateDirs) {
      if (!dateDir.isDirectory()) continue;

      const datePath = path.join(INCIDENTS_BASE_PATH, dateDir.name);

      // Check if incident directory exists under this date
      const incidentPath = path.join(datePath, incidentId);
      const summaryPath = path.join(incidentPath, 'summary.json');

      try {
        await fs.access(summaryPath);
        // Return absolute path
        return path.resolve(summaryPath);
      } catch (error) {
        // Not found in this date directory, continue searching
        continue;
      }
    }

    // Incident not found in any date directory
    return null;
  } catch (error) {
    console.error('❌ Error finding summary path:', error);
    throw error;
  }
}

/**
 * Finds the frame image path for a given incident ID and frame index
 * 
 * @param {string} incidentId - The incident identifier
 * @param {number} frameIndex - The frame index (0-based)
 * @returns {Promise<string|null>} Absolute path to frame image or null if not found
 */
async function findFramePath(incidentId, frameIndex) {
  try {
    // First find the incident directory using summary
    const summaryPath = await findSummaryPath(incidentId);

    if (!summaryPath) {
      return null;
    }

    // Read summary to get frame information
    const summaryContent = await fs.readFile(summaryPath, 'utf8');
    const summary = JSON.parse(summaryContent);

    // Find the frame metadata for the requested index
    const frameMetadata = summary.frames.find(f => f.frame_index === frameIndex);

    if (!frameMetadata) {
      console.warn(`⚠️  Frame index ${frameIndex} not found in incident ${incidentId}`);
      return null;
    }

    // Construct frame path
    const incidentDir = path.dirname(summaryPath);
    const framePath = path.join(incidentDir, 'frames', `frame_${String(frameIndex).padStart(3, '0')}.jpg`);

    // Verify frame file exists
    try {
      await fs.access(framePath);
      return path.resolve(framePath);
    } catch (error) {
      console.warn(`⚠️  Frame file not found: ${framePath}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error finding frame path:', error);
    throw error;
  }
}

/**
 * Reads all per-frame metadata JSON files for an incident and
 * aggregates human-count statistics from the rich bounding-box data.
 *
 * Each metadata/frame_NNN.json has the shape:
 *   { frame_index, humans: { detected, count, bounding_boxes }, fire: {...}, objects: {...} }
 *
 * @param {string} incidentId
 * @returns {Promise<object|null>} Aggregated metadata stats, or null if not found
 */
async function aggregateMetadataHumans(incidentId) {
  const summaryPath = await findSummaryPath(incidentId);
  if (!summaryPath) return null;

  const incidentDir = path.dirname(summaryPath);
  const metadataDir = path.join(incidentDir, 'metadata');

  let metaFiles;
  try {
    metaFiles = await fs.readdir(metadataDir);
  } catch (_) {
    return null; // no metadata directory
  }

  const jsonFiles = metaFiles.filter(f => f.endsWith('.json'));

  let totalHumans = 0;
  let peakHumans  = 0;
  const perFrame  = [];

  for (const file of jsonFiles) {
    try {
      const content  = await fs.readFile(path.join(metadataDir, file), 'utf8');
      const meta     = JSON.parse(content);
      const hCount   = meta.humans?.count ?? 0;
      totalHumans   += hCount;
      if (hCount > peakHumans) peakHumans = hCount;
      perFrame.push({
        frame_index:    meta.frame_index,
        timestamp_readable: meta.timestamp_readable,
        human_count:    hCount,
        humans_detected: meta.humans?.detected ?? false,
        bounding_boxes: meta.humans?.bounding_boxes ?? [],
        fire_count:     meta.fire?.count ?? 0,
        fire_confidence: meta.fire?.confidence ?? 0,
      });
    } catch (_) {
      // skip malformed file
    }
  }

  // Sort by frame_index for consistent ordering
  perFrame.sort((a, b) => a.frame_index - b.frame_index);

  return {
    total_human_detections: totalHumans,
    peak_human_count:       peakHumans,
    frames_with_humans:     perFrame.filter(f => f.human_count > 0).length,
    per_frame:              perFrame,
  };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/incidents
 * 
 * Returns list of all incidents sorted by timestamp (newest first)
 * 
 * Response:
 * {
 *   "incidents": [
 *     {
 *       "incident_id": "INC-20250115-143022",
 *       "timestamp": 1705330822.0,
 *       "timestamp_readable": "2025-01-15T14:30:22Z",
 *       "frame_count": 12,
 *       "camera_id": "CAM-03",
 *       "location": "Warehouse A"
 *     }
 *   ]
 * }
 */
router.get('/incidents', async (req, res) => {
  try {
    const incidents = await scanIncidentDirectories();

    res.json({
      incidents: incidents,
      count: incidents.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Error listing incidents:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to list incidents',
      details: error.message
    });
  }
});

/**
 * GET /api/incidents/:incidentId/summary
 * 
 * Returns complete summary.json for the specified incident
 * 
 * Parameters:
 *   - incidentId: The incident identifier (e.g., "INC-20250115-143022")
 * 
 * Response:
 * {
 *   "incident_id": "INC-20250115-143022",
 *   "timestamp": 1705330822.0,
 *   "timestamp_readable": "2025-01-15T14:30:22Z",
 *   "camera_id": "CAM-03",
 *   "location": "Warehouse A",
 *   "frame_count": 12,
 *   "frames": [...]
 * }
 * 
 * Error Responses:
 *   - 404: Incident not found
 *   - 500: File read error
 */
router.get('/incidents/:incidentId/summary', async (req, res) => {
  try {
    const { incidentId } = req.params;

    // Validate incident ID format (basic validation)
    if (!incidentId || incidentId.trim() === '') {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid incident ID provided'
      });
    }

    // Find summary path
    const summaryPath = await findSummaryPath(incidentId);

    if (!summaryPath) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Incident '${incidentId}' not found`
      });
    }

    // Read and parse summary JSON
    const summaryContent = await fs.readFile(summaryPath, 'utf8');
    const summary = JSON.parse(summaryContent);

    // Enrich statistics with human counts sourced from per-frame metadata JSON files.
    // The summary.json may have stale/zero human counts if the detection pipeline
    // didn't write them correctly — the per-frame metadata files are the authoritative source.
    try {
      const metaStats = await aggregateMetadataHumans(incidentId);
      if (metaStats) {
        summary.statistics = {
          ...summary.statistics,
          total_human_detections:      metaStats.total_human_detections,
          peak_human_count:            metaStats.peak_human_count,
          frames_with_humans:          metaStats.frames_with_humans,
        };
        // Also enrich per-frame rows with metadata-sourced human_count
        if (Array.isArray(summary.frames)) {
          summary.frames = summary.frames.map(f => {
            const meta = metaStats.per_frame.find(m => m.frame_index === f.frame_index);
            return meta ? { ...f, human_count: meta.human_count, human_bboxes: meta.bounding_boxes } : f;
          });
        }
        summary._metadata_enriched = true;
      }
    } catch (enrichErr) {
      // Non-fatal — return summary as-is if enrichment fails
      console.warn('⚠️  Metadata enrichment failed:', enrichErr.message);
    }

    // Resolve camera_stream_url dynamically against cameras.yaml
    summary.camera_stream_url = resolveCameraStreamUrl(summary.camera_id);

    res.json(summary);
  } catch (error) {
    console.error('❌ Error reading incident summary:', error);

    // Check if it's a JSON parse error
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to parse incident summary (corrupted data)',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to read incident summary',
      details: error.message
    });
  }
});

/**
 * GET /api/incidents/:incidentId/metadata
 *
 * Returns aggregated human-count statistics sourced directly from the
 * per-frame metadata JSON files (the most authoritative human-detection data).
 *
 * Response:
 * {
 *   "incident_id": "INC-...",
 *   "total_human_detections": 3,
 *   "peak_human_count": 2,
 *   "frames_with_humans": 2,
 *   "per_frame": [
 *     { frame_index, human_count, humans_detected, bounding_boxes, fire_count, ... }
 *   ]
 * }
 */
router.get('/incidents/:incidentId/metadata', async (req, res) => {
  try {
    const { incidentId } = req.params;

    if (!incidentId || incidentId.trim() === '') {
      return res.status(400).json({ error: 'BadRequest', message: 'Invalid incident ID' });
    }

    const metaStats = await aggregateMetadataHumans(incidentId);

    if (!metaStats) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Metadata not found for incident '${incidentId}'`
      });
    }

    res.json({ incident_id: incidentId, ...metaStats });
  } catch (error) {
    console.error('❌ Error reading incident metadata:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to read incident metadata',
      details: error.message
    });
  }
});

/**
 * GET /api/incidents/:incidentId/frames/:frameIndex
 * 
 * Serves the frame image file for the specified incident and frame index
 * 
 * Parameters:
 *   - incidentId: The incident identifier
 *   - frameIndex: The frame index (0-based integer)
 * 
 * Response:
 *   - Content-Type: image/jpeg
 *   - Binary image data
 * 
 * Error Responses:
 *   - 400: Invalid parameters
 *   - 404: Incident or frame not found
 *   - 500: File read error
 */
router.get('/incidents/:incidentId/frames/:frameIndex', async (req, res) => {
  try {
    const { incidentId, frameIndex } = req.params;

    // Validate incident ID
    if (!incidentId || incidentId.trim() === '') {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid incident ID provided'
      });
    }

    // Validate and parse frame index
    const frameIndexNum = parseInt(frameIndex, 10);
    if (isNaN(frameIndexNum) || frameIndexNum < 0) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid frame index (must be non-negative integer)'
      });
    }

    // Find frame path
    const framePath = await findFramePath(incidentId, frameIndexNum);

    if (!framePath) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Frame ${frameIndexNum} not found for incident '${incidentId}'`
      });
    }

    // Serve the image file
    res.sendFile(framePath, (error) => {
      if (error) {
        console.error('❌ Error sending frame file:', error);

        // Only send response if headers haven't been sent
        if (!res.headersSent) {
          res.status(500).json({
            error: 'InternalServerError',
            message: 'Failed to serve frame image',
            details: error.message
          });
        }
      }
    });
  } catch (error) {
    console.error('❌ Error serving frame:', error);

    // Only send response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Failed to serve frame image',
        details: error.message
      });
    }
  }
});

// ============================================================================
// CAMERA STREAM CONFIGURATION ENDPOINTS
// ============================================================================

/**
 * GET /api/cameras
 * Returns all configured cameras with their dynamic stream URLs
 */
router.get('/cameras', (req, res) => {
  try {
    const cameras = getAllCameras();
    res.json({
      cameras,
      count: cameras.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('❌ Error retrieving cameras:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve cameras',
      details: error.message
    });
  }
});

/**
 * GET /api/cameras/:cameraId/stream
 * Resolves camera stream URL for a specific camera ID
 */
router.get('/cameras/:cameraId/stream', (req, res) => {
  const { cameraId } = req.params;
  const camera = resolveCameraDetails(cameraId);
  if (!camera) {
    return res.status(404).json({
      error: 'NotFound',
      message: `Camera '${cameraId}' not found in cameras.yaml`
    });
  }
  res.json(camera);
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
