# Dashboard Data Loading Implementation

## Overview
This document describes how the Fire Dispatch Dashboard and Owner Console load data from the `data/fire_incidents` folder structure.

## Data Structure

The application loads fire incident data from the following directory structure:

```
data/fire_incidents/
  └── {date_folder}/              # e.g., 2026-08-30
      └── {incident_id}/          # e.g., INC-20260830-163044
          ├── summary.json        # Incident metadata
          ├── hologram_data_{incident_id}.json  # 3D hologram data
          ├── frames/             # Frame images
          │   ├── frame_000.jpg
          │   ├── frame_007.jpg
          │   └── ...
          └── metadata/           # Per-frame detection metadata
              ├── frame_000.json
              ├── frame_007.json
              └── ...
```

## Implementation Details

### 1. Backend API (`backend/api/frame_api.js`)

The backend provides the following endpoints:

- **GET /api/incidents** - Lists all available incidents
- **GET /api/incidents/:incidentId/summary** - Returns summary.json with enriched human count data
- **GET /api/incidents/:incidentId/metadata** - Returns aggregated per-frame metadata statistics
- **GET /api/incidents/:incidentId/hologram** - Returns hologram JSON data
- **GET /api/incidents/:incidentId/frames/:frameIndex** - Serves frame images

The backend automatically:
- Scans the `data/fire_incidents` folder for all incidents
- Supports any folder name structure (as long as only one folder exists in fire_incidents)
- Enriches summary data with authoritative human counts from per-frame metadata JSON files

### 2. Frontend Hook (`frontend/src/hooks/useIncidentData.js`)

The `useIncidentData` hook:
- Fetches all incidents from the backend
- Auto-selects the first (most recent) incident
- Loads summary, hologram, and metadata for the selected incident
- Returns aggregated statistics with authoritative human counts

### 3. Fire Dispatch Dashboard (`frontend/src/components/DispatchConsole.jsx`)

**Left Sidebar - Incident Queue:**
- Shows 5 demo entries (repeating the same incident for demo purposes)
- Each entry displays:
  - Thumbnail of the first frame from the `frames` folder
  - Camera ID (from `summary.json`)
  - Number of frames
  - Status indicator

**Center Panel - Incident Detail:**
- Shows the first frame as the main CCTV feed
- Displays camera number below the feed
- **Victims Count**: Loaded from `summary.json` → `statistics.peak_human_count` (sourced from per-frame metadata)
- **Fire Detections**: Loaded from `summary.json` → `statistics.total_fire_detections`

**Evidence Section:**
- Shows ALL images from the `frames` folder
- Clicking any image opens it in a full-screen modal
- Modal displays:
  - Full-resolution image
  - Frame index
  - Fire confidence percentage
  - Detection counts (fire, humans, objects)

### 4. Owner Console (`frontend/src/components/OwnerConsole.jsx`)

Implements the same data loading as the Fire Dispatch Dashboard:
- **4-Camera Grid**: Shows multiple frames from the incident
- **Victims Count**: From `summary.json` → `statistics.peak_human_count`
- **Fire Detections**: From `summary.json` → `statistics.total_fire_detections`
- **Evidence Frames**: All images from `frames` folder with modal support

## Data Sources Priority

### Human Count (Most Authoritative First):
1. `metadataStats.peak_human_count` - From per-frame `metadata/frame_NNN.json` files
2. `summary.statistics.peak_human_count` - If backend enriched the summary
3. `summary.statistics.total_human_detections` - Raw fallback

### Fire Detections:
- `summary.statistics.total_fire_detections` - Total fire detections across all frames

### Frame Data:
- `summary.frames[]` - Array of frame metadata including:
  - `frame_index` - Frame number
  - `fire_confidence` - Detection confidence
  - `fire_count` - Number of fire bounding boxes
  - `human_count` - Number of humans detected
  - `object_count` - Total objects detected
  - `image_path` - Path to the frame image
  - `metadata_path` - Path to the metadata JSON

## Modal Implementation

The image modal component:
- Opens when any evidence frame is clicked
- Displays full-resolution image
- Shows frame metadata (index, confidence, counts)
- Closes on background click or X button
- Styled with dark overlay for focus

## Key Features

1. **Dynamic Data Loading**: No hardcoded paths - loads from whatever folder structure exists
2. **Automatic Discovery**: Backend scans and finds all incidents automatically
3. **Authoritative Human Counts**: Uses per-frame metadata JSON files as the primary source
4. **Demo Mode**: Creates 5 queue entries for demonstration purposes
5. **Modal Image Viewer**: Full-screen evidence viewing with metadata
6. **Real-time Updates**: Can refresh data without page reload

## Configuration

### Backend Environment Variables
- `FRAME_STORAGE_PATH` - Custom path to fire incidents folder (default: `data/fire_incidents`)
- `API_PORT` - Backend server port (default: 3001)
- `API_CORS_ORIGIN` - CORS origin (default: http://localhost:5173)

### Frontend Proxy Configuration
Configured in `frontend/vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
  '/data': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

## Usage

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   node server.js
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Dashboards**:
   - Navigate to the Fire Dispatch Dashboard or Owner Console
   - Data will load automatically from the `data/fire_incidents` folder
   - Click on any evidence frame to view full-screen

## Notes

- The system expects only ONE folder in `data/fire_incidents` (as per your requirement)
- If multiple date folders exist, the backend will scan all of them
- Frame indices are automatically extracted from the summary.json file
- All image paths are proxied through the backend to avoid CORS issues
- Human counts are enriched from per-frame metadata for maximum accuracy
