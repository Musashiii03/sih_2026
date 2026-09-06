# Fire Incident Database & API - Complete Setup

## What Was Created

### 1. Database Model Updates
- **incident_detections.js**: Added new fields:
  - `frame_index` - Frame position in the video
  - `fire_count` - Number of fire instances detected
  - `human_count` - Number of humans detected
  - `object_count` - Number of objects detected
  - `image_path` - Path to the frame image
  - `metadata_path` - Path to the frame metadata JSON

### 2. Demo Data Seeder
**File**: `src/seeders/demo-buildings-seed.js`

Creates:
- **3 Demo Buildings**:
  - Cyber Heights Office Complex (12 floors, Office)
  - Tech Tower Business Center (18 floors, Office)
  - Green Valley Residency (25 floors, Apartment)

- **7 Demo Cameras**:
  - CAM-01: Cyber Heights - Main Lobby
  - CAM-02: Cyber Heights - Floor 5 Corridor
  - CAM-03: Cyber Heights - Parking B1
  - CAM-04: Tech Tower - Reception
  - CAM-05: Tech Tower - Server Room Floor 10
  - CAM-06: Green Valley - Building Entrance
  - CAM-07: Green Valley - Floor 15 Common Area

### 3. Fire Incident Sync Utility
**File**: `src/utils/sync-fire-incidents.js`

Features:
- Scans `data/fire_incidents/YYYY-MM-DD/INC-XXXXX/` folders
- Reads `summary.json` files
- Creates incident records with proper building/camera links
- Creates detection records for each frame
- Creates evidence records for frame images
- Skips existing incidents (idempotent)
- Auto-calculates severity based on confidence and human detection

### 4. API Controllers

#### Incident Controller (`src/controllers/incident.controller.js`)
- `createIncident` - Create incident from AI data
- `getAllIncidents` - List with filters and pagination
- `getIncidentById` - Get by UUID
- `getIncidentByNumber` - Get by incident number (INC-XXXXX)
- `getIncidentsByBuilding` - Get all incidents for a building
- `updateIncidentStatus` - Update incident status
- `getIncidentStatistics` - Get aggregate stats

#### Building Controller (`src/controllers/building.controller.js`)
- `getAllBuildings` - List with incident counts
- `getBuildingById` - Get with full details
- `getBuildingStatistics` - Get aggregate stats

### 5. API Routes
- `/api/incidents/*` - Incident management
- `/api/buildings/*` - Building management

### 6. Scripts

#### Setup Script (`scripts/setup-demo-data.js`)
Runs complete initial setup:
1. Seeds demo buildings and cameras
2. Syncs existing fire incidents

#### Sync Script (`scripts/sync-incidents.js`)
Run after AI detection to sync new incidents

#### Migration Script (`scripts/migrate-database.js`)
Updates database schema without losing data

### 7. Documentation
- **API_DOCUMENTATION.md** - Complete API reference
- **QUICKSTART.md** - Step-by-step setup guide
- **FIRE_INCIDENT_SETUP.md** - This file

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Python AI Detection Script Runs                          │
│    → Analyzes video for fire/smoke                          │
│    → Extracts key frames                                     │
│    → Saves to: data/fire_incidents/YYYY-MM-DD/INC-XXXXX/   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. File System Structure Created                            │
│    INC-20260830-230331/                                      │
│    ├── frames/                                               │
│    │   ├── frame_000.jpg (fire detected, 2 instances)      │
│    │   ├── frame_013.jpg (fire detected, 2 instances)      │
│    │   └── ...                                               │
│    ├── metadata/                                             │
│    │   ├── frame_000.json (detection details + coords)     │
│    │   ├── frame_013.json (detection details + coords)     │
│    │   └── ...                                               │
│    └── summary.json (aggregate data)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Sync Script Runs: npm run sync:incidents                 │
│    → Reads summary.json                                      │
│    → Finds camera by camera_id → Gets building_id          │
│    → Calculates severity from confidence + human count      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Database Records Created                                  │
│                                                              │
│ ┌────────────────┐                                          │
│ │ incidents      │  (1 record)                              │
│ │ ──────────────│                                           │
│ │ incident_number: INC-20260830-230331                     │
│ │ building_id: → Building (Cyber Heights)                  │
│ │ camera_id: → Camera (CAM-01)                             │
│ │ severity: MEDIUM (auto-calculated)                       │
│ │ confidence: 0.4238 (avg from frames)                     │
│ └────────────────┘                                          │
│         │                                                    │
│         ├──> ┌─────────────────────┐                       │
│         │    │ incident_detections │ (6 records)           │
│         │    │ ──────────────────── │                      │
│         │    │ frame_index: 0                              │
│         │    │ fire_count: 2                               │
│         │    │ human_count: 0                              │
│         │    │ object_count: 2                             │
│         │    │ image_path: S:\...\frame_000.jpg           │
│         │    │ metadata_path: S:\...\frame_000.json       │
│         │    │ confidence: 0.4625                          │
│         │    └─────────────────────┘                       │
│         │                                                    │
│         └──> ┌──────────────┐                              │
│              │ evidence     │ (6 records)                   │
│              │ ──────────── │                               │
│              │ evidence_type: CCTV_FRAME                   │
│              │ file_name: frame_000.jpg                    │
│              │ file_path: S:\...\frame_000.jpg            │
│              │ file_size: 123456                           │
│              │ captured_at: 2026-08-30T23:02:52Z          │
│              └──────────────┘                              │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend Queries API                                      │
│    GET /api/buildings → Shows all buildings                 │
│    GET /api/incidents/building/:id → Shows incidents        │
│    GET /api/incidents/:id → Shows full incident details     │
│                                                              │
│    Displays:                                                 │
│    - Building name & address                                 │
│    - Incident severity & status                              │
│    - Fire count, human count, object count per frame        │
│    - Frame images from file system                           │
│    - Detection confidence scores                             │
└─────────────────────────────────────────────────────────────┘
```

---

## What's NOT Stored in Database

As requested, we **do NOT store**:
- Individual bounding box coordinates
- Specific object/human positions
- Full detection metadata

These remain in the JSON files for reference, but the database only stores the **counts and summary info**.

---

## Setup Commands (In Order)

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Update database schema
npm run migrate

# 3. Seed demo buildings and sync existing incidents
npm run seed:demo

# 4. Start server
npm run dev
```

---

## Daily Usage

```bash
# After running Python AI detection script:
npm run sync:incidents
```

This syncs new incidents without duplicating existing ones.

---

## API Examples

### Get All Buildings
```bash
curl http://localhost:3001/api/buildings
```

### Get Incidents for Building
```bash
curl "http://localhost:3001/api/incidents/building/YOUR_BUILDING_ID?page=1&limit=10"
```

### Get Specific Incident
```bash
curl http://localhost:3001/api/incidents/number/INC-20260830-230331
```

### Get Incident Statistics
```bash
curl http://localhost:3001/api/incidents/statistics
```

---

## Frontend Integration Example

```javascript
// Fetch buildings
const response = await fetch('http://localhost:3001/api/buildings');
const { data } = await response.json();
const buildings = data.buildings;

// Each building has:
buildings[0] = {
  id: "uuid",
  name: "Cyber Heights Office Complex",
  address: { city: "Gurugram", ... },
  cameras: [...],
  incident_stats: {
    total_incidents: 5,
    active_incidents: 2
  }
}

// Fetch incidents for a building
const incidentsRes = await fetch(`http://localhost:3001/api/incidents/building/${buildingId}`);
const incidents = await incidentsRes.json();

// Each incident has:
incidents.data.incidents[0] = {
  incident_number: "INC-20260830-230331",
  severity: "MEDIUM",
  confidence_score: 0.4238,
  building: {...},
  detected_by_camera: {...},
  detections: [
    {
      frame_index: 0,
      fire_count: 2,
      human_count: 0,
      object_count: 2,
      image_path: "S:\\...\\frame_000.jpg",
      confidence_score: 0.4625
    },
    // ... more frames
  ]
}

// Display frame images
<img src={`http://localhost:3001/data/fire_incidents/2026-08-30/INC-20260830-230331/frames/frame_000.jpg`} />
```

---

## Camera ID Mapping

Make sure your Python script uses these camera IDs to get proper building association:
- CAM-01, CAM-02, CAM-03 → Cyber Heights Office Complex
- CAM-04, CAM-05 → Tech Tower Business Center
- CAM-06, CAM-07 → Green Valley Residency

Update `demo-buildings-seed.js` if you need different camera IDs.

---

## Success Indicators

✅ Database has 3 buildings
✅ Database has 7 cameras
✅ Incidents are linked to buildings
✅ Each incident has multiple detection records (one per frame)
✅ Frame counts (fire, human, object) are stored
✅ Image paths are stored for frontend display
✅ File system structure remains intact
✅ API returns building → incidents → frames hierarchy

---

## Summary

You now have:
1. ✅ Demo buildings and cameras in the database
2. ✅ Fire incidents synced from filesystem to database
3. ✅ Full API to query buildings, incidents, and detections
4. ✅ Frame-level data (counts, paths) stored
5. ✅ Building relationships maintained
6. ✅ No duplicate code in frontend - all backend
7. ✅ Minor model changes only (added fields to incident_detections)

**Next step**: Connect your frontend to these new API endpoints! 🚀
