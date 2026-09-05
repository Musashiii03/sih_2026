# 🔥 Fire Incident API - Complete Setup Instructions

## 📋 Overview

This setup creates a complete backend system to:
1. Store fire incidents from your AI detection in the database
2. Link incidents to buildings and cameras
3. Provide REST APIs for your frontend
4. Maintain both filesystem (images) and database (metadata) storage

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Install Dependencies
```bash
npm install
```

This installs the new `uuid` package needed for the scripts.

---

### Step 2: Update Database Schema
```bash
npm run migrate
```

This adds the new fields to your `incident_detections` table:
- `frame_index`
- `fire_count`
- `human_count`  
- `object_count`
- `image_path`
- `metadata_path`

**Output:**
```
✅ Database connected
🔄 Syncing models to database...
✅ Database schema updated successfully
```

---

### Step 3: Seed Demo Data
```bash
npm run seed:demo
```

This creates:
- **3 demo buildings** with addresses
- **7 demo cameras** (CAM-01 through CAM-07)
- Syncs **existing fire incidents** from `data/fire_incidents/`

**Output:**
```
✅ Demo buildings and cameras seeded successfully
🔄 Syncing fire incidents from filesystem...
✅ Synced incident: INC-20260830-230331 with 6 frames
📊 Summary:
   ✅ Synced: 1
   ⏩ Skipped: 0
   ❌ Errors: 0
```

---

### Step 4: Start the Server
```bash
npm run dev
```

**Output:**
```
🔥 Fire Detection API Server
🚀 Server running on port 3001
🌐 Environment: development
🔗 API: http://localhost:3001
```

---

### Step 5: Test the API
Open your browser or use curl:

```bash
# Test buildings endpoint
curl http://localhost:3001/api/buildings

# Test incidents endpoint
curl http://localhost:3001/api/incidents

# Test building statistics
curl http://localhost:3001/api/buildings/statistics
```

---

## 📁 What Was Created

### New Files

```
backend/
├── src/
│   ├── controllers/
│   │   ├── incident.controller.js      ← Incident CRUD operations
│   │   └── building.controller.js      ← Building queries
│   ├── routes/
│   │   ├── incident.routes.js          ← /api/incidents/*
│   │   └── building.routes.js          ← /api/buildings/*
│   ├── seeders/
│   │   └── demo-buildings-seed.js      ← Demo data generator
│   └── utils/
│       └── sync-fire-incidents.js      ← Sync script
├── scripts/
│   ├── migrate-database.js             ← Schema updater
│   ├── setup-demo-data.js              ← Complete setup
│   └── sync-incidents.js               ← Incident sync
└── docs/
    ├── API_DOCUMENTATION.md            ← Full API reference
    ├── QUICKSTART.md                   ← Quick start guide
    └── FIRE_INCIDENT_SETUP.md          ← Technical details
```

### Modified Files

- `src/models/incident_detections.js` - Added frame data fields
- `src/routes/index.js` - Exported new routes
- `server.js` - Mounted new routes
- `package.json` - Added scripts and uuid dependency

---

## 🔄 Daily Workflow

### When AI Detection Runs

1. **Your Python script creates:**
   ```
   data/fire_incidents/2026-08-30/INC-20260830-230331/
   ├── frames/frame_000.jpg, frame_001.jpg, ...
   ├── metadata/frame_000.json, frame_001.json, ...
   └── summary.json
   ```

2. **Sync to database:**
   ```bash
   npm run sync:incidents
   ```

3. **Access via API:**
   ```javascript
   // Frontend can now query
   GET /api/incidents
   GET /api/incidents/building/:building_id
   GET /api/incidents/:id
   ```

---

## 🎯 API Endpoints

### Buildings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buildings` | List all buildings with incident stats |
| GET | `/api/buildings/:id` | Get building details |
| GET | `/api/buildings/statistics` | Get aggregate statistics |

### Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List incidents (with filters) |
| GET | `/api/incidents/:id` | Get incident by UUID |
| GET | `/api/incidents/number/:number` | Get incident by number (INC-XXX) |
| GET | `/api/incidents/building/:id` | Get incidents for a building |
| GET | `/api/incidents/statistics` | Get incident statistics |
| PATCH | `/api/incidents/:id/status` | Update incident status |
| POST | `/api/incidents` | Create incident (used internally) |

**Query Parameters for GET /api/incidents:**
- `page`, `limit` - Pagination
- `status` - DETECTED, VERIFIED, RESOLVED, etc.
- `severity` - LOW, MEDIUM, HIGH, CRITICAL
- `building_id` - Filter by building
- `start_date`, `end_date` - Date range

---

## 📊 Data Structure

### Example Response: GET /api/incidents/:id

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "incident_number": "INC-20260830-230331",
    "incident_type": "FIRE",
    "status": "DETECTED",
    "severity": "MEDIUM",
    "priority": "MEDIUM",
    "confidence_score": 0.4238,
    "detected_at": "2026-08-30T23:03:31.365Z",
    "building": {
      "name": "Cyber Heights Office Complex",
      "building_type": "OFFICE",
      "address": {
        "city": "Gurugram",
        "state": "Haryana"
      }
    },
    "detected_by_camera": {
      "camera_code": "CAM-01",
      "name": "Lobby Main Entrance",
      "floor_number": 0
    },
    "detections": [
      {
        "frame_index": 0,
        "fire_count": 2,
        "human_count": 0,
        "object_count": 2,
        "confidence_score": 0.4625,
        "image_path": "S:\\...\\frame_000.jpg",
        "metadata_path": "S:\\...\\frame_000.json",
        "detected_at": "2026-08-30T23:02:52.902Z"
      },
      // ... more frames
    ],
    "evidence": [
      {
        "file_name": "frame_000.jpg",
        "file_path": "S:\\...\\frame_000.jpg",
        "evidence_type": "CCTV_FRAME",
        "captured_at": "2026-08-30T23:02:52.902Z"
      },
      // ... more evidence
    ]
  }
}
```

---

## 🔧 Troubleshooting

### Issue: "Camera not found" warning during sync
**Cause:** Python script uses camera ID not in database

**Solution:** 
1. Update `src/seeders/demo-buildings-seed.js` to add your camera IDs
2. Re-run: `npm run seed:demo`

### Issue: Incidents not appearing
**Check:**
```bash
# 1. Check if sync ran successfully
npm run sync:incidents

# 2. Query API
curl http://localhost:3001/api/incidents

# 3. Check database directly
# (if you have psql access)
```

### Issue: Schema errors
**Solution:**
```bash
npm run migrate
```

---

## 💡 Key Features

✅ **No Frontend Changes** - Pure backend implementation  
✅ **Dual Storage** - Files stay in filesystem, metadata in DB  
✅ **Auto-Linking** - Incidents automatically linked to buildings via cameras  
✅ **Severity Auto-Calc** - Based on confidence scores and human detection  
✅ **Idempotent Sync** - Safe to run multiple times, skips duplicates  
✅ **Pagination Ready** - All list endpoints support pagination  
✅ **Rich Filtering** - Filter by status, severity, building, date range  
✅ **Statistics APIs** - Get aggregate counts and metrics  

---

## 📚 Documentation

- **API_DOCUMENTATION.md** - Complete API reference with examples
- **QUICKSTART.md** - Step-by-step walkthrough
- **FIRE_INCIDENT_SETUP.md** - Technical architecture and data flow

---

## ✅ Verify Setup

After setup, you should be able to:

```bash
# 1. See 3 buildings
curl http://localhost:3001/api/buildings | jq '.data.buildings | length'
# Output: 3

# 2. See 7 cameras total
curl http://localhost:3001/api/buildings/statistics | jq '.data.total_cameras'
# Output: 7

# 3. See your synced incidents
curl http://localhost:3001/api/incidents | jq '.data.incidents | length'
# Output: 1 (or more if you have multiple incidents)

# 4. Check incident has detections
curl http://localhost:3001/api/incidents/number/INC-20260830-230331 | jq '.data.detections | length'
# Output: 6 (number of frames)
```

---

## 🎉 You're Done!

Your backend is now ready to:
1. ✅ Store AI detection results in database
2. ✅ Link incidents to buildings and cameras
3. ✅ Provide REST APIs for frontend
4. ✅ Auto-sync new incidents after AI runs

**Next Step:** Connect your frontend to these APIs!

---

## 🆘 Need Help?

Check the documentation:
- API details → `API_DOCUMENTATION.md`
- Quick start → `QUICKSTART.md`
- Technical deep dive → `FIRE_INCIDENT_SETUP.md`

Or review the code:
- Controllers → `src/controllers/`
- Routes → `src/routes/`
- Sync utility → `src/utils/sync-fire-incidents.js`
