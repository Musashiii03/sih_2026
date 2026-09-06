/**
 * Camera Configuration Resolver
 *
 * Loads cameras.yaml and resolves camera stream URLs and configurations
 * for active incidents.
 */

const fs = require('fs');
const path = require('path');
let yaml;
try {
  yaml = require('js-yaml');
} catch (_) {
  yaml = null;
}

// Candidates for cameras.yaml location
const CANDIDATE_PATHS = [
  process.env.CAMERAS_CONFIG_PATH,
  path.resolve(__dirname, '../../cameras.yaml'),
  path.resolve(__dirname, '../../../cameras.yaml'),
  path.resolve(process.cwd(), 'cameras.yaml'),
  path.resolve(process.cwd(), 'backend/cameras.yaml')
].filter(Boolean);

let cachedConfig = null;
let lastMtime = 0;
let configFilePath = null;

/**
 * Locate cameras.yaml on the filesystem
 */
function findConfigPath() {
  for (const candidate of CANDIDATE_PATHS) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Lightweight fallback YAML parser in case js-yaml isn't available
 */
function parseSimpleYaml(content) {
  const lines = content.split(/\r?\n/);
  const cameras = [];
  let currentCam = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- id:')) {
      if (currentCam) cameras.push(currentCam);
      currentCam = { id: trimmed.replace('- id:', '').trim().replace(/['"]/g, '') };
    } else if (currentCam) {
      const match = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (match) {
        const key = match[1];
        let val = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (/^\d+$/.test(val)) val = parseInt(val, 10);
        currentCam[key] = val;
      }
    }
  }
  if (currentCam) cameras.push(currentCam);
  return { cameras };
}

/**
 * Load and cache cameras configuration
 */
function loadCameraConfig(force = false) {
  const targetPath = configFilePath || findConfigPath();
  if (!targetPath) {
    console.warn('⚠️  cameras.yaml not found in candidate paths');
    return { cameras: [] };
  }
  configFilePath = targetPath;

  try {
    const stats = fs.statSync(targetPath);
    if (!force && cachedConfig && stats.mtimeMs <= lastMtime) {
      return cachedConfig;
    }

    const content = fs.readFileSync(targetPath, 'utf8');
    let parsed;
    if (yaml && typeof yaml.load === 'function') {
      parsed = yaml.load(content);
    } else {
      parsed = parseSimpleYaml(content);
    }

    cachedConfig = parsed || { cameras: [] };
    lastMtime = stats.mtimeMs;
    return cachedConfig;
  } catch (err) {
    console.error('❌ Error reading cameras.yaml:', err.message);
    return cachedConfig || { cameras: [] };
  }
}

/**
 * Resolves camera_stream_url for a given camera identifier.
 *
 * @param {string} cameraId - Camera ID (e.g. 'CAM-01', 'CAM-03', 'CAM-04')
 * @returns {string|number|null} The resolved stream source (index 0, HTTP URL, RTSP URL), or null if not found
 */
function resolveCameraStreamUrl(cameraId) {
  if (!cameraId) return null;
  const config = loadCameraConfig();
  const cameras = config.cameras || [];
  
  // Normalize camera ID search (case-insensitive and trimmed)
  const normalizedId = String(cameraId).trim().toUpperCase();
  const camera = cameras.find(c => String(c.id).trim().toUpperCase() === normalizedId);

  if (!camera || camera.source === undefined || camera.source === null) {
    return null;
  }

  return camera.source;
}

/**
 * Resolves full camera metadata including name, stream URL, sector, and enabled status.
 *
 * @param {string} cameraId - Camera ID
 * @returns {Object|null}
 */
function resolveCameraDetails(cameraId) {
  if (!cameraId) return null;
  const config = loadCameraConfig();
  const cameras = config.cameras || [];
  const normalizedId = String(cameraId).trim().toUpperCase();
  const camera = cameras.find(c => String(c.id).trim().toUpperCase() === normalizedId);

  if (!camera) return null;

  return {
    camera_id: camera.id,
    name: camera.name || camera.id,
    source: camera.source,
    camera_stream_url: camera.source !== undefined ? camera.source : null,
    sector: camera.sector || null,
    fps_limit: camera.fps_limit || null,
    enabled: camera.enabled !== false
  };
}

/**
 * Returns all configured cameras
 */
function getAllCameras() {
  const config = loadCameraConfig();
  return (config.cameras || []).map(cam => ({
    ...cam,
    camera_stream_url: cam.source !== undefined ? cam.source : null
  }));
}

module.exports = {
  loadCameraConfig,
  resolveCameraStreamUrl,
  resolveCameraDetails,
  getAllCameras
};
