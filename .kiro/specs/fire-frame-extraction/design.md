# Technical Design Document: Fire Frame Extraction Feature

## Overview

The Fire Frame Extraction Feature is a multi-layer system that captures, filters, stores, and displays representative frames from CCTV footage when fire is detected by the YOLOv8 model. The system operates as an extension to the existing `run_fire_human_only.py` detection pipeline and integrates with the React frontend through a Node.js API layer.

## Architecture

### System Components

The system consists of five primary components organized in a pipeline architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Fire Detection Pipeline                       │
│              (run_fire_human_only.py - existing)                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Fire Detection Event
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frame Extractor Module                        │
│  - Monitors fire detection events                                │
│  - Extracts frames at 2-5 FPS for 30-60 seconds                 │
│  - Creates Frame objects with metadata                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Extracted Frames + Metadata
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frame Selector Module                         │
│  - Computes structural similarity (SSIM) or histogram distance   │
│  - Selects 6-15 diverse representative frames                    │
│  - Filters out visually redundant frames                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Selected Frames
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Storage Manager Module                        │
│  - Writes frame images to disk (JPEG)                            │
│  - Generates per-frame metadata JSON                             │
│  - Creates incident summary JSON                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Persisted Frames + Metadata
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frame API Service (Node.js)                   │
│  - GET /api/incidents - List incident IDs                        │
│  - GET /api/incidents/:id/summary - Get incident metadata        │
│  - GET /api/incidents/:id/frames/:index - Serve frame image      │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP JSON/Image Response
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frame Grid Component (React)                  │
│  - Polls Frame API every 5 seconds                               │
│  - Displays frames in grid with metadata                         │
│  - Handles loading states and errors                             │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Frame Extractor Module

**Location:** `backend/frame_extraction/extractor.py`

**Responsibilities:**
- Monitor fire detection events from the YOLOv8 model
- Extract frames from video stream using OpenCV at configurable sample rate
- Capture frame metadata (timestamp, confidence, bounding boxes)
- Manage extraction window lifecycle

**Key Classes:**

```python
class FrameExtractor:
    """Extracts frames during fire detection events."""
    
    def __init__(self, sample_rate: float = 3.0, window_duration: int = 30):
        """
        Args:
            sample_rate: Frames per second to extract (2.0 - 5.0)
            window_duration: Extraction window in seconds (30 - 60)
        """
        self.sample_rate = sample_rate
        self.window_duration = window_duration
        self.extraction_active = False
        self.extraction_start_time = None
        self.extracted_frames = []
        self.last_extract_time = 0
        
    def on_fire_detected(self, timestamp: float, frame: np.ndarray, 
                        confidence: float, bounding_boxes: List[BBox]) -> None:
        """Triggered when fire is detected. Starts extraction window."""
        
    def should_extract_frame(self, current_time: float) -> bool:
        """Determines if frame should be extracted based on sample rate."""
        
    def extract_frame(self, frame: np.ndarray, timestamp: float,
                     confidence: float, bounding_boxes: List[BBox]) -> Frame:
        """Extracts a single frame with metadata."""
        
    def check_window_complete(self, current_time: float) -> bool:
        """Returns True if extraction window has elapsed."""
        
    def get_extracted_frames(self) -> List[Frame]:
        """Returns all extracted frames and resets state."""


class Frame:
    """Data class representing an extracted frame."""
    
    def __init__(self):
        self.image: np.ndarray          # Frame image data
        self.timestamp: float           # Unix timestamp
        self.confidence: float          # Fire detection confidence
        self.bounding_boxes: List[BBox] # Fire bounding boxes
        self.frame_index: int           # Sequential frame number
```

**Integration with Existing Pipeline:**

The extractor integrates into `run_fire_human_only.py` by:
1. Instantiating `FrameExtractor` at startup
2. Calling `on_fire_detected()` when fire_count > 0
3. Checking `should_extract_frame()` on each frame
4. Extracting frames during active window
5. Processing extracted frames when window completes

**Error Handling:**
- OpenCV read errors: Log and continue to next frame
- Invalid confidence values: Log warning, use default 0.0
- Frame buffer overflow: Drop oldest frames, log warning

### 2. Frame Selector Module

**Location:** `backend/frame_extraction/selector.py`

**Responsibilities:**
- Analyze visual diversity across extracted frames
- Select 6-15 representative frames
- Filter out visually similar/redundant frames
- Maintain chronological ordering

**Key Classes:**

```python
class FrameSelector:
    """Selects diverse representative frames from extraction set."""
    
    def __init__(self, min_frames: int = 6, max_frames: int = 15,
                 similarity_threshold: float = 0.85):
        """
        Args:
            min_frames: Minimum frames to select
            max_frames: Maximum frames to select
            similarity_threshold: SSIM threshold for considering frames similar
        """
        self.min_frames = min_frames
        self.max_frames = max_frames
        self.similarity_threshold = similarity_threshold
        
    def select_frames(self, frames: List[Frame]) -> List[Frame]:
        """
        Selects diverse representative frames.
        
        Algorithm:
        1. Always include first frame (fire onset)
        2. Compute SSIM between candidate and all selected frames
        3. Add frame if SSIM < threshold with all selected
        4. Continue until max_frames or candidates exhausted
        5. If less than min_frames, add frames with lowest SSIM to set
        
        Returns:
            List of selected frames in chronological order
        """
        
    def compute_similarity(self, frame1: Frame, frame2: Frame) -> float:
        """
        Computes structural similarity between two frames.
        
        Uses SSIM (Structural Similarity Index) on grayscale images.
        Falls back to histogram comparison if SSIM fails.
        
        Returns:
            Similarity score [0.0, 1.0] where 1.0 is identical
        """
        
    def compute_histogram_similarity(self, frame1: Frame, frame2: Frame) -> float:
        """Fallback similarity using histogram correlation."""
```

**Similarity Metrics:**

**Primary: Structural Similarity Index (SSIM)**
- Compares image luminance, contrast, and structure
- More robust to lighting changes than pixel-wise comparison
- Returns value in [0, 1] where 1.0 is identical
- Implemented via `skimage.metrics.structural_similarity`

**Fallback: Histogram Correlation**
- Compares color distribution histograms
- Used if SSIM computation fails
- Returns correlation coefficient [-1, 1], normalized to [0, 1]

**Selection Algorithm Properties:**
- First frame always selected (captures fire onset)
- Last frame always selected if distinct (captures fire progression end)
- Intermediate frames selected by maximum visual diversity
- Guarantees chronological order in output

**Error Handling:**
- Corrupted frame data: Skip frame, log error, continue selection
- SSIM computation failure: Fall back to histogram comparison
- Fewer than min_frames available: Return all available frames

### 3. Storage Manager Module

**Location:** `backend/frame_extraction/storage.py`

**Responsibilities:**
- Write frame images to disk in organized directory structure
- Generate metadata JSON files for each frame
- Create incident summary JSON with all frame metadata
- Ensure filesystem consistency

**Key Classes:**

```python
class StorageManager:
    """Manages persistent storage of frames and metadata."""
    
    def __init__(self, base_path: str = "data/fire_incidents"):
        """
        Args:
            base_path: Root directory for frame storage
        """
        self.base_path = Path(base_path)
        
    def save_incident(self, frames: List[Frame], incident_id: str) -> IncidentSummary:
        """
        Saves all frames and metadata for an incident.
        
        Directory structure:
            data/fire_incidents/
                2025-01-15/
                    INC-20250115-143022/
                        frames/
                            frame_000.jpg
                            frame_001.jpg
                            ...
                        metadata/
                            frame_000.json
                            frame_001.json
                            ...
                        summary.json
        
        Returns:
            IncidentSummary with paths to all saved files
        """
        
    def save_frame_image(self, frame: Frame, file_path: Path) -> bool:
        """Writes frame image to disk as JPEG."""
        
    def save_frame_metadata(self, frame: Frame, file_path: Path) -> bool:
        """Writes frame metadata to JSON file."""
        
    def generate_summary(self, frames: List[Frame], 
                        incident_id: str) -> Dict[str, Any]:
        """Creates incident summary JSON."""
        
    def ensure_directory_exists(self, path: Path) -> None:
        """Creates directory and parents if they don't exist."""


class IncidentSummary:
    """Data class for incident summary."""
    
    def __init__(self):
        self.incident_id: str              # Unique incident identifier
        self.timestamp: float              # Incident start timestamp
        self.frame_count: int              # Number of frames saved
        self.frames: List[FrameMetadata]   # List of frame metadata
        self.incident_path: Path           # Directory path


class FrameMetadata:
    """Metadata for a single frame."""
    
    def __init__(self):
        self.frame_index: int              # Sequential index
        self.timestamp: float              # Frame capture timestamp
        self.confidence: float             # Fire detection confidence
        self.bounding_boxes: List[Dict]    # Fire bounding boxes (x, y, w, h)
        self.image_path: str               # Absolute path to image file
        self.metadata_path: str            # Absolute path to metadata JSON
```

**File Formats:**

**Frame Image:** JPEG with 90% quality
```
frame_000.jpg, frame_001.jpg, ...
```

**Frame Metadata JSON:**
```json
{
  "frame_index": 0,
  "timestamp": 1705330822.543,
  "timestamp_readable": "2025-01-15T14:30:22.543Z",
  "confidence": 0.87,
  "bounding_boxes": [
    {"x": 120, "y": 80, "width": 200, "height": 150, "confidence": 0.87}
  ],
  "image_path": "/absolute/path/to/frame_000.jpg"
}
```

**Incident Summary JSON:**
```json
{
  "incident_id": "INC-20250115-143022",
  "timestamp": 1705330822.0,
  "timestamp_readable": "2025-01-15T14:30:22Z",
  "camera_id": "CAM-03",
  "location": "Warehouse A (Hazard Epicenter)",
  "frame_count": 12,
  "frames": [
    {
      "frame_index": 0,
      "timestamp": 1705330822.543,
      "confidence": 0.87,
      "image_path": "/absolute/path/to/frame_000.jpg",
      "metadata_path": "/absolute/path/to/frame_000.json"
    }
  ]
}
```

**Error Handling:**
- Disk write errors: Log error, continue with next frame
- Insufficient disk space: Log critical error, abort write, return partial results
- Directory creation failure: Log error, attempt write anyway, fail gracefully
- JSON serialization errors: Log error, write partial metadata

### 4. Frame API Service

**Location:** `backend/api/frame_api.js` (Node.js)

**Responsibilities:**
- Provide HTTP endpoints for frame retrieval
- Serve static frame images
- Return incident metadata as JSON
- Handle CORS for frontend access

**API Endpoints:**

**GET /api/incidents**
```javascript
// Returns list of all incident IDs sorted by timestamp (newest first)
Response: {
  "incidents": [
    {
      "incident_id": "INC-20250115-143022",
      "timestamp": 1705330822.0,
      "frame_count": 12,
      "camera_id": "CAM-03"
    }
  ]
}
```

**GET /api/incidents/:incidentId/summary**
```javascript
// Returns complete summary.json for specified incident
Response: {
  "incident_id": "INC-20250115-143022",
  "timestamp": 1705330822.0,
  "camera_id": "CAM-03",
  "frame_count": 12,
  "frames": [...]
}

// 404 if incident not found
// 500 if file read error
```

**GET /api/incidents/:incidentId/frames/:frameIndex**
```javascript
// Serves frame image file
// Content-Type: image/jpeg
// Returns image binary data

// 404 if incident or frame not found
// 500 if file read error
```

**Implementation:**

```javascript
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const INCIDENTS_BASE_PATH = path.join(__dirname, '../../data/fire_incidents');

// List all incidents
router.get('/incidents', async (req, res) => {
  try {
    const incidents = await scanIncidentDirectories();
    res.json({ incidents });
  } catch (error) {
    console.error('Error listing incidents:', error);
    res.status(500).json({ error: 'Failed to list incidents' });
  }
});

// Get incident summary
router.get('/incidents/:incidentId/summary', async (req, res) => {
  try {
    const summaryPath = await findSummaryPath(req.params.incidentId);
    if (!summaryPath) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    const summary = JSON.parse(await fs.readFile(summaryPath, 'utf8'));
    res.json(summary);
  } catch (error) {
    console.error('Error reading summary:', error);
    res.status(500).json({ error: 'Failed to read incident summary' });
  }
});

// Serve frame image
router.get('/incidents/:incidentId/frames/:frameIndex', async (req, res) => {
  try {
    const imagePath = await findFramePath(
      req.params.incidentId,
      parseInt(req.params.frameIndex)
    );
    
    if (!imagePath) {
      return res.status(404).json({ error: 'Frame not found' });
    }
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving frame:', error);
    res.status(500).json({ error: 'Failed to serve frame' });
  }
});

module.exports = router;
```

**Error Handling:**
- File not found: Return 404 with descriptive JSON
- File read errors: Return 500 with error message
- Invalid incident ID format: Return 400 bad request
- CORS errors: Configure express CORS middleware

### 5. Frame Grid Component

**Location:** `frontend/src/components/FireFrameGrid.jsx`

**Responsibilities:**
- Poll Frame API for new incidents
- Display frames in responsive grid layout
- Show frame metadata (timestamp, confidence)
- Handle loading and error states
- Integrate into right sidebar panel

**Component Structure:**

```javascript
import React, { useState, useEffect } from 'react';
import { AlertCircle, Flame, Clock } from 'lucide-react';

export default function FireFrameGrid({ currentIncidentId = null }) {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(currentIncidentId);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Poll for incidents every 5 seconds
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/incidents');
        const data = await response.json();
        setIncidents(data.incidents);
        
        // Auto-select newest incident if none selected
        if (!selectedIncidentId && data.incidents.length > 0) {
          setSelectedIncidentId(data.incidents[0].incident_id);
        }
      } catch (err) {
        console.error('Failed to fetch incidents:', err);
        setError('Failed to load incidents');
      }
    };
    
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, [selectedIncidentId]);
  
  // Fetch frames when incident selected
  useEffect(() => {
    if (!selectedIncidentId) return;
    
    const fetchFrames = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/incidents/${selectedIncidentId}/summary`);
        const summary = await response.json();
        setFrames(summary.frames);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch frames:', err);
        setError('Failed to load frames');
        setLoading(false);
      }
    };
    
    fetchFrames();
  }, [selectedIncidentId]);
  
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };
  
  if (error) {
    return (
      <div className="frame-grid-error">
        <AlertCircle size={24} />
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="fire-frame-grid-container">
      <div className="frame-grid-header">
        <div className="header-title">
          <Flame size={18} />
          <span>Fire Incident Frames</span>
        </div>
        {incidents.length > 0 && (
          <select 
            value={selectedIncidentId || ''} 
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="incident-selector"
          >
            {incidents.map(inc => (
              <option key={inc.incident_id} value={inc.incident_id}>
                {inc.incident_id} ({inc.frame_count} frames)
              </option>
            ))}
          </select>
        )}
      </div>
      
      {loading ? (
        <div className="frame-grid-loading">Loading frames...</div>
      ) : (
        <div className="frame-grid">
          {frames.map((frame, idx) => (
            <FrameCard 
              key={idx}
              frame={frame}
              incidentId={selectedIncidentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FrameCard({ frame, incidentId }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = `/api/incidents/${incidentId}/frames/${frame.frame_index}`;
  
  return (
    <div className="frame-card">
      {imageError ? (
        <div className="frame-error-placeholder">
          <AlertCircle size={20} />
          <span>Failed to load</span>
        </div>
      ) : (
        <img 
          src={imageUrl}
          alt={`Frame ${frame.frame_index}`}
          onError={() => setImageError(true)}
          className="frame-image"
        />
      )}
      <div className="frame-metadata">
        <div className="frame-meta-row">
          <Clock size={12} />
          <span>{new Date(frame.timestamp * 1000).toLocaleTimeString()}</span>
        </div>
        <div className="frame-meta-row">
          <Flame size={12} />
          <span>{(frame.confidence * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
```

**Styling (CSS):**

```css
.fire-frame-grid-container {
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.frame-grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-default);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-fire);
  font-weight: 600;
  font-size: 14px;
}

.incident-selector {
  background: var(--bg-darker);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--text-main);
  font-size: 12px;
}

.frame-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
}

.frame-card {
  background: var(--bg-darker);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.frame-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 42, 95, 0.2);
}

.frame-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}

.frame-error-placeholder {
  width: 100%;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-dim);
  font-size: 11px;
}

.frame-metadata {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.frame-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.frame-grid-loading,
.frame-grid-error {
  text-align: center;
  padding: 32px;
  color: var(--text-dim);
}

.frame-grid-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-fire);
}
```

**Integration with App.jsx:**

Add FireFrameGrid to the right panel below EntityBreakdown:

```javascript
// In App.jsx, inside the right-panel div:
<div className="right-panel">
  <SpatialRadar camera={activeCamera} />
  <EntityBreakdown camera={activeCamera} />
  <FireFrameGrid currentIncidentId={activeCamera.latestIncidentId} />
</div>
```

**Error Handling:**
- Failed image loads: Display placeholder with error icon
- Failed API requests: Show error message, retry on next poll
- Empty incident list: Display "No incidents recorded" message
- Network timeouts: Log error, continue polling

## Data Flow

### Fire Detection to Frame Storage

```
1. YOLOv8 detects fire (fire_count > 0)
   └─> Frame_Extractor.on_fire_detected(timestamp, frame, confidence, bboxes)

2. Frame_Extractor starts 30-60 second extraction window
   └─> Extracts frames at 2-5 FPS
   └─> Creates Frame objects with metadata

3. Extraction window completes or video ends
   └─> Frame_Extractor.get_extracted_frames() returns List[Frame]

4. Frame_Selector.select_frames(extracted_frames)
   └─> Computes SSIM between frames
   └─> Selects 6-15 diverse representative frames
   └─> Returns List[Frame] in chronological order

5. Storage_Manager.save_incident(selected_frames, incident_id)
   └─> Creates directory structure: data/fire_incidents/YYYY-MM-DD/INCIDENT_ID/
   └─> Writes frame images as JPEG
   └─> Writes frame metadata as JSON
   └─> Writes summary.json with all metadata

6. Returns IncidentSummary with file paths
```

### Frontend Display Flow

```
1. FireFrameGrid component mounts
   └─> Polls GET /api/incidents every 5 seconds

2. Frame_API reads incident directories
   └─> Returns list of incidents with metadata

3. User selects incident (or auto-select newest)
   └─> GET /api/incidents/:id/summary

4. Frame_API reads summary.json from disk
   └─> Returns complete incident metadata

5. FireFrameGrid renders frame cards
   └─> Each card loads image via GET /api/incidents/:id/frames/:index
   └─> Frame_API serves JPEG file

6. Frames displayed in grid with metadata (timestamp, confidence)
```

## Integration Points

### 1. Integration with run_fire_human_only.py

**Modification approach:** Minimal invasive changes to existing detection script

**Integration code:**

```python
# At top of run_fire_human_only.py
from frame_extraction.extractor import FrameExtractor
from frame_extraction.selector import FrameSelector
from frame_extraction.storage import StorageManager

# After model initialization
frame_extractor = FrameExtractor(sample_rate=3.0, window_duration=30)
frame_selector = FrameSelector(min_frames=6, max_frames=15)
storage_manager = StorageManager(base_path="data/fire_incidents")

# Inside main detection loop, after drawing bounding boxes
if fire_count > 0:
    # Fire detected - start/continue extraction
    if not frame_extractor.extraction_active:
        fire_bboxes = [
            {'x': int(box.xyxy[0][0]), 'y': int(box.xyxy[0][1]),
             'width': int(box.xyxy[0][2] - box.xyxy[0][0]),
             'height': int(box.xyxy[0][3] - box.xyxy[0][1]),
             'confidence': float(box.conf[0])}
            for box in fire_results.boxes if 'fire' in fire_results.names[int(box.cls[0])].lower()
        ]
        frame_extractor.on_fire_detected(time.time(), frame, fire_bboxes[0]['confidence'] if fire_bboxes else 0.0, fire_bboxes)
    
    # Extract frame if sample interval elapsed
    if frame_extractor.should_extract_frame(time.time()):
        fire_bboxes = [...]  # Same as above
        frame_extractor.extract_frame(frame, time.time(), fire_bboxes[0]['confidence'] if fire_bboxes else 0.0, fire_bboxes)

# Check if extraction window complete
if frame_extractor.extraction_active and frame_extractor.check_window_complete(time.time()):
    try:
        extracted_frames = frame_extractor.get_extracted_frames()
        selected_frames = frame_selector.select_frames(extracted_frames)
        
        incident_id = f"INC-{time.strftime('%Y%m%d-%H%M%S')}"
        summary = storage_manager.save_incident(selected_frames, incident_id)
        
        print(f"✅ Saved fire incident: {incident_id} ({len(selected_frames)} frames)")
    except Exception as e:
        print(f"⚠️ Frame extraction error: {e}")
        # Continue detection pipeline - don't crash on extraction errors
```

**Key principles:**
- Extraction runs asynchronously - does not block detection
- Errors in extraction do not terminate detection pipeline
- Minimal performance impact on real-time detection

### 2. Integration with Node.js Backend

**Assumption:** Express.js server exists or needs to be created

**Server setup:**

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const frameRouter = require('./api/frame_api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', frameRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Frame API server running on port ${PORT}`);
});
```

### 3. Integration with React Frontend

**Steps:**
1. Add FireFrameGrid component to `frontend/src/components/`
2. Import FireFrameGrid in `App.jsx`
3. Add to right-panel section below EntityBreakdown
4. Update CSS variables if needed for consistent theming

**No breaking changes** to existing components required.

## Error Handling Strategy

### Principle: Fail Gracefully Without Breaking Detection

All components implement **defensive error handling** to ensure extraction failures do not compromise the core fire detection functionality.

### Error Handling by Component

**Frame Extractor:**
- OpenCV read errors → Log, skip frame, continue
- Invalid timestamps → Use system time, log warning
- Memory overflow → Drop oldest frames, log warning
- Extraction never throws exceptions to detection pipeline

**Frame Selector:**
- SSIM computation failure → Fall back to histogram comparison
- Corrupted frame data → Skip frame, log error
- Insufficient frames → Return what's available (may be < min_frames)
- Selection never throws exceptions

**Storage Manager:**
- Disk write errors → Log error, continue with next frame
- Insufficient disk space → Log critical, return partial results
- Directory creation failure → Attempt write anyway, fail gracefully
- JSON serialization error → Write partial metadata, log error

**Frame API:**
- File not found → 404 with JSON error message
- File read error → 500 with error message
- Invalid parameters → 400 bad request
- All errors logged with timestamp and context

**Frame Grid:**
- Failed image load → Display placeholder with error icon
- Failed API request → Show error message, retry on next poll
- Network timeout → Log, continue polling
- Never crash the React application

### Logging Strategy

All components log to Python standard logging:

```python
import logging

logger = logging.getLogger('frame_extraction')
logger.setLevel(logging.INFO)

# Log levels:
# - INFO: Normal operations (extraction started, frames saved)
# - WARNING: Recoverable issues (frame skipped, using fallback)
# - ERROR: Component failures (write error, selection failure)
# - CRITICAL: System-level failures (disk full, directory access denied)
```

## Performance Considerations

### Frame Extraction Impact

**Computational cost:**
- Frame copying: ~2ms per frame (1920x1080)
- Metadata creation: <1ms per frame
- Total overhead: <5ms per extracted frame at 3 FPS = 15ms/second

**Memory footprint:**
- Extracted frames buffer: ~10MB for 30 frames (640x480 JPEG quality)
- Selected frames buffer: ~5MB for 15 frames
- Peak memory: <20MB additional during extraction

**Mitigation:**
- Frames resized to 640x480 before storage (reduce from detection resolution)
- Buffer cleared immediately after selection
- Extraction runs in same process (no IPC overhead)

### Frame Selection Performance

**SSIM computation:**
- Single comparison: ~15-30ms (640x480 grayscale)
- Worst case: 15 frames × 14 comparisons = 210 comparisons × 25ms = ~5.25 seconds
- Acceptable latency as selection runs after extraction completes

**Optimization opportunities:**
- Downsample images to 320x240 for similarity comparison only
- Parallelize comparisons (not implemented in v1)
- Cache SSIM results in matrix

### Storage I/O Performance

**Write performance:**
- JPEG encoding: ~10-20ms per frame
- File write: ~5-10ms per frame
- Metadata JSON: <5ms per frame
- Total per frame: ~30-40ms
- 15 frames: ~600ms total write time

**Read performance (API):**
- Summary JSON read: <10ms
- Frame image serve: <50ms (static file serve)
- Acceptable for polling-based UI

### API Polling Impact

**Frontend polling at 5-second interval:**
- GET /api/incidents: Returns cached directory listing, <10ms
- Minimal server load for typical deployment (<10 concurrent users)

**Optimization if needed:**
- Implement WebSocket for push updates
- Add Redis cache for incident listings
- Not required for v1

## Configuration

### Environment Variables

```bash
# Frame Extraction Configuration
FRAME_SAMPLE_RATE=3.0           # Frames per second (2.0 - 5.0)
FRAME_WINDOW_DURATION=30        # Extraction window in seconds (30 - 60)
FRAME_MIN_SELECTION=6           # Minimum frames to select
FRAME_MAX_SELECTION=15          # Maximum frames to select
FRAME_SIMILARITY_THRESHOLD=0.85 # SSIM threshold for similarity

# Storage Configuration
FRAME_STORAGE_PATH=data/fire_incidents
FRAME_IMAGE_QUALITY=90          # JPEG quality (1-100)

# API Configuration
API_PORT=3001
API_CORS_ORIGIN=http://localhost:5173
```

### Python Configuration File

**Location:** `backend/frame_extraction/config.py`

```python
import os
from pathlib import Path

class FrameExtractionConfig:
    # Extraction settings
    SAMPLE_RATE = float(os.getenv('FRAME_SAMPLE_RATE', '3.0'))
    WINDOW_DURATION = int(os.getenv('FRAME_WINDOW_DURATION', '30'))
    
    # Selection settings
    MIN_FRAMES = int(os.getenv('FRAME_MIN_SELECTION', '6'))
    MAX_FRAMES = int(os.getenv('FRAME_MAX_SELECTION', '15'))
    SIMILARITY_THRESHOLD = float(os.getenv('FRAME_SIMILARITY_THRESHOLD', '0.85'))
    
    # Storage settings
    STORAGE_PATH = Path(os.getenv('FRAME_STORAGE_PATH', 'data/fire_incidents'))
    IMAGE_QUALITY = int(os.getenv('FRAME_IMAGE_QUALITY', '90'))
    
    # Validation
    @classmethod
    def validate(cls):
        assert 2.0 <= cls.SAMPLE_RATE <= 5.0, "Sample rate must be 2-5 FPS"
        assert 30 <= cls.WINDOW_DURATION <= 60, "Window duration must be 30-60 seconds"
        assert 6 <= cls.MIN_FRAMES <= cls.MAX_FRAMES <= 15, "Frame selection range must be 6-15"
        assert 0.0 <= cls.SIMILARITY_THRESHOLD <= 1.0, "Similarity threshold must be 0-1"
        assert 1 <= cls.IMAGE_QUALITY <= 100, "Image quality must be 1-100"

# Validate configuration on import
FrameExtractionConfig.validate()
```

## Dependencies

### Python Dependencies

**File:** `backend/requirements.txt`

```
# Fire Detection (existing)
ultralytics>=8.0.0
torch>=2.0.0
torchvision>=0.15.0

# Frame Extraction (new)
opencv-python>=4.5.0
numpy>=1.21.0
scikit-image>=0.19.0
Pillow>=9.0.0

# Utilities
python-dotenv>=0.19.0
```

### Node.js Dependencies

**File:** `backend/package.json`

```json
{
  "name": "fire-detection-api",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Frontend Dependencies

**File:** `frontend/package.json` (additions)

```json
{
  "dependencies": {
    "lucide-react": "^0.294.0"
  }
}
```

## Testing Strategy

### Unit Testing

**Frame Extractor Tests:**
- Test extraction starts on fire detection
- Test sample rate timing accuracy
- Test window duration enforcement
- Test metadata capture completeness
- Test error handling (read failures, invalid data)

**Frame Selector Tests:**
- Test diverse frame selection algorithm
- Test SSIM computation accuracy
- Test similarity threshold enforcement
- Test min/max frame constraints
- Test chronological ordering preservation
- Test histogram fallback mechanism

**Storage Manager Tests:**
- Test directory structure creation
- Test frame image writing (JPEG format validation)
- Test metadata JSON writing
- Test summary JSON generation
- Test error handling (write failures, disk full simulation)

### Integration Testing

**End-to-End Pipeline Tests:**
- Simulate fire detection with test video
- Verify frames extracted, selected, and stored
- Verify all files created with correct structure
- Verify metadata accuracy

**API Integration Tests:**
- Test all endpoints with real data
- Test error responses (404, 500)
- Test CORS headers
- Test image serving

**Frontend Integration Tests:**
- Test polling behavior
- Test frame loading
- Test error state rendering
- Test incident selection

### Property-Based Testing

Property-based tests will be added in the tasks phase based on correctness properties defined below.

## Deployment

### Initial Deployment Steps

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Install Node.js dependencies:**
```bash
cd backend
npm install
```

3. **Create storage directory:**
```bash
mkdir -p data/fire_incidents
```

4. **Start API server:**
```bash
cd backend
npm run dev
```

5. **Update frontend API endpoint:**
```javascript
// frontend/vite.config.js - add proxy
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

6. **Run detection with extraction:**
```bash
cd backend/models
python run_fire_human_only.py
```

### Production Considerations

- **Storage management:** Implement cleanup policy for old incidents
- **API authentication:** Add JWT authentication for production
- **Rate limiting:** Add rate limiting to API endpoints
- **Monitoring:** Add Prometheus metrics for extraction performance
- **CDN:** Serve frame images from CDN in production
- **Database:** Consider migrating from filesystem to database for metadata

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Extraction Trigger Reliability

*For any* fire detection event with confidence above threshold, the Frame_Extractor SHALL begin extracting frames within one frame interval of the detection.

**Validates: Requirements 1.1**

### Property 2: Sample Rate Accuracy

*For any* configured sample rate between 2-5 FPS, the actual time interval between extracted frames SHALL be within ±10% of the configured interval (1/sample_rate seconds).

**Validates: Requirements 1.2**

### Property 3: Timestamp Recording Accuracy

*For any* fire detection event, the recorded extraction start timestamp SHALL match the detection event timestamp within 100ms.

**Validates: Requirements 1.3**

### Property 4: Window Duration Enforcement

*For any* configured extraction window duration between 30-60 seconds, extraction SHALL stop within ±1 second of the configured duration after the detection event.

**Validates: Requirements 1.5**

### Property 5: Metadata Completeness

*For any* extracted frame, the Frame_Metadata record SHALL include non-null values for timestamp, confidence score, and bounding boxes.

**Validates: Requirements 1.6**

### Property 6: Frame Analysis Completeness

*For any* set of extracted frames provided to Frame_Selector, all frames SHALL be analyzed for similarity before selection completes.

**Validates: Requirements 2.1**

### Property 7: Diversity Selection

*For any* two frames selected by Frame_Selector, their structural similarity score SHALL be less than the configured similarity_threshold.

**Validates: Requirements 2.2, 2.3**

### Property 8: Selection Count Bounds

*For any* fire incident with sufficient extracted frames, Frame_Selector SHALL return between 6 and 15 frames inclusive.

**Validates: Requirements 2.5**

### Property 9: Storage Frame Retention

*For any* fire incident, the number of frame image files written to disk SHALL equal the number of frames returned by Frame_Selector.

**Validates: Requirements 2.6**

### Property 10: Image File Format Validity

*For any* frame image file written by Storage_Manager, the file SHALL be a valid JPEG or PNG image that can be decoded by OpenCV without errors.

**Validates: Requirements 3.1**

### Property 11: Directory Structure Consistency

*For any* fire incident, the storage directory path SHALL follow the format `{base_path}/{YYYY-MM-DD}/{incident_id}/` where YYYY-MM-DD matches the incident date.

**Validates: Requirements 3.2**

### Property 12: Metadata File Correspondence

*For any* frame image file written to disk, a corresponding metadata JSON file SHALL exist with the same base filename in the metadata subdirectory.

**Validates: Requirements 3.3**

### Property 13: Metadata Field Completeness

*For any* Frame_Metadata JSON file, it SHALL contain all required fields: frame_index, timestamp, confidence, bounding_boxes, and image_path.

**Validates: Requirements 3.4**

### Property 14: Summary Metadata Completeness

*For any* fire incident, the summary.json file SHALL contain metadata entries for all frames saved in that incident.

**Validates: Requirements 3.5**

### Property 15: Directory Creation Guarantee

*For any* storage path that does not exist, Storage_Manager SHALL create all parent directories before writing files.

**Validates: Requirements 3.6**

### Property 16: Extraction Error Resilience

*For any* OpenCV read error during extraction, Frame_Extractor SHALL continue processing subsequent frames and SHALL NOT raise an exception to the caller.

**Validates: Requirements 4.1**

### Property 17: Storage Error Resilience

*For any* disk write error for a single frame, Storage_Manager SHALL attempt to write all remaining frames in the incident.

**Validates: Requirements 4.2**

### Property 18: Selection Error Resilience

*For any* frame that causes a processing error in Frame_Selector, the selector SHALL exclude that frame and continue processing the remaining frames.

**Validates: Requirements 4.3**

### Property 19: Error Logging Completeness

*For any* error that occurs in Frame_Extractor, Frame_Selector, or Storage_Manager, an error log entry SHALL be written containing a timestamp and error details.

**Validates: Requirements 4.6**

### Property 20: API Incident Summary Retrieval

*For any* incident ID that exists on disk, the Frame_API endpoint `/api/incidents/:id/summary` SHALL return the summary JSON with HTTP 200 status.

**Validates: Requirements 5.2**

### Property 21: API Frame Data Consistency

*For any* requested frame metadata, the data returned by Frame_API SHALL match the content of the corresponding JSON file on disk.

**Validates: Requirements 5.3**

### Property 22: API Frame Image Serving

*For any* valid incident ID and frame index combination that exists on disk, the Frame_API endpoint `/api/incidents/:id/frames/:index` SHALL serve the correct image file.

**Validates: Requirements 5.4**

### Property 23: API HTTP Status Code Correctness

*For any* API request, the returned HTTP status code SHALL be 200 for success, 404 for not found resources, 400 for invalid requests, or 500 for server errors.

**Validates: Requirements 5.5**

### Property 24: API Polling Frequency

*For any* mounted FireFrameGrid component, API requests to `/api/incidents` SHALL occur at intervals of 5 seconds (±500ms).

**Validates: Requirements 6.2**

### Property 25: Frame Metadata Display Completeness

*For any* frame displayed in FireFrameGrid, the frame card SHALL render both the timestamp and the fire confidence score.

**Validates: Requirements 6.3**

### Property 26: Frame Chronological Ordering

*For any* set of frames displayed in FireFrameGrid, the frames SHALL be ordered by timestamp from earliest to latest.

**Validates: Requirements 6.4**

### Property 27: Frame Load Error Handling

*For any* frame image that fails to load in FireFrameGrid, an error placeholder or indicator SHALL be displayed in that frame's position.

**Validates: Requirements 6.6**

## Security Considerations

### API Security

**Current state:** No authentication (suitable for internal network deployment)

**Production recommendations:**
- Implement JWT authentication for API endpoints
- Add rate limiting to prevent abuse
- Sanitize incident ID parameters to prevent path traversal
- Validate file paths before serving images
- Add HTTPS for encrypted communication

### Data Privacy

- Frame images may contain identifiable individuals
- Implement retention policy for automatic deletion after N days
- Consider anonymization/blurring of faces if privacy required
- Restrict API access to authorized personnel only

### File System Security

- Storage directory should have restricted permissions (750)
- Validate all file paths to prevent directory traversal
- Limit file sizes to prevent disk exhaustion attacks
- Monitor disk usage and alert on low space

## Future Enhancements

### Phase 2 Features (Not in Current Scope)

1. **Real-time WebSocket Updates**
   - Push frame updates to frontend without polling
   - Reduce API load and improve responsiveness

2. **Advanced Frame Selection Algorithms**
   - Machine learning-based frame importance scoring
   - Prioritize frames showing fire spread or personnel in danger
   - Adaptive selection based on fire severity

3. **Video Clip Generation**
   - Generate short video clips (5-10 seconds) instead of stills
   - Provide better context for incident review
   - H.264 encoding for efficient storage

4. **Database Integration**
   - Replace filesystem storage with PostgreSQL
   - Enable complex queries (search by location, date range, severity)
   - Improve scalability for multi-camera deployments

5. **Frame Annotation**
   - Allow operators to add notes to frames
   - Tag frames with incident classification
   - Build training dataset for model improvement

6. **Automated Reporting**
   - Generate PDF incident reports with selected frames
   - Email notifications to security team
   - Integration with incident management systems

7. **Performance Optimization**
   - GPU acceleration for SSIM computation
   - Parallel frame processing
   - CDN integration for frame serving

8. **Mobile App Integration**
   - Native mobile app for frame review
   - Push notifications for new incidents
   - Offline viewing capability

## Appendix

### A. File Structure Summary

```
backend/
├── requirements.txt                    # Python dependencies
├── package.json                        # Node.js dependencies
├── server.js                           # Express API server
├── api/
│   └── frame_api.js                   # Frame API routes
├── frame_extraction/
│   ├── __init__.py
│   ├── config.py                      # Configuration
│   ├── extractor.py                   # Frame extraction logic
│   ├── selector.py                    # Frame selection logic
│   └── storage.py                     # Storage management
├── models/
│   └── run_fire_human_only.py         # Modified detection script
└── data/
    └── fire_incidents/
        └── YYYY-MM-DD/
            └── INC-YYYYMMDD-HHMMSS/
                ├── frames/
                │   ├── frame_000.jpg
                │   └── ...
                ├── metadata/
                │   ├── frame_000.json
                │   └── ...
                └── summary.json

frontend/
└── src/
    └── components/
        └── FireFrameGrid.jsx          # Frame display component
```

### B. API Response Examples

**GET /api/incidents**
```json
{
  "incidents": [
    {
      "incident_id": "INC-20250115-143022",
      "timestamp": 1705330822.0,
      "frame_count": 12,
      "camera_id": "CAM-03",
      "location": "Warehouse A"
    }
  ]
}
```

**GET /api/incidents/INC-20250115-143022/summary**
```json
{
  "incident_id": "INC-20250115-143022",
  "timestamp": 1705330822.0,
  "timestamp_readable": "2025-01-15T14:30:22Z",
  "camera_id": "CAM-03",
  "location": "Warehouse A (Hazard Epicenter)",
  "frame_count": 12,
  "frames": [
    {
      "frame_index": 0,
      "timestamp": 1705330822.543,
      "confidence": 0.87,
      "image_path": "/absolute/path/to/frame_000.jpg",
      "metadata_path": "/absolute/path/to/frame_000.json"
    }
  ]
}
```

### C. Common Troubleshooting

**Problem:** Frames not being extracted
- Check fire detection threshold (confidence > 0.30)
- Verify Frame_Extractor instantiation in detection script
- Check extraction window duration hasn't elapsed
- Review logs for OpenCV errors

**Problem:** API returns 404 for existing incidents
- Verify INCIDENTS_BASE_PATH in frame_api.js
- Check directory permissions (readable by Node.js process)
- Ensure summary.json exists in incident directory

**Problem:** Frontend not displaying frames
- Check API server is running (port 3001)
- Verify Vite proxy configuration
- Check browser console for CORS errors
- Verify image paths in summary.json are absolute

**Problem:** Too many/too few frames selected
- Adjust similarity_threshold (lower = more diverse frames)
- Adjust min_frames/max_frames configuration
- Review SSIM computation results in logs

**Problem:** High memory usage during extraction
- Reduce FRAME_WINDOW_DURATION
- Reduce FRAME_SAMPLE_RATE
- Implement frame buffer size limit
- Resize frames to smaller dimensions before storage
