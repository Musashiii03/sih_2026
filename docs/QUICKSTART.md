# Quick Start Guide - Fire Incident API

## Prerequisites

- PostgreSQL database running
- Node.js installed
- `.env` file configured with database credentials

## Initial Setup (One Time)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Update Database Schema
```bash
npm run migrate
```
This will add the new columns to the `incident_detections` table.

### Step 3: Seed Demo Data
```bash
npm run seed:demo
```
This creates:
- 3 demo buildings (Office complexes and residential)
- 7 demo cameras across the buildings
- Syncs existing fire incidents from `data/fire_incidents/`

### Step 4: Start the Server
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

---

## Daily Workflow

### When You Run the Python AI Detection Script

1. **Run your Python fire detection**:
   ```bash
   cd src/frame_extraction
   python demo_storage.py  # or your AI script
   ```
   
   This creates new incident data in:
   ```
   data/fire_incidents/YYYY-MM-DD/INC-XXXXXX-XXXXXX/
   ├── frames/
   │   ├── frame_000.jpg
   │   ├── frame_001.jpg
   │   └── ...
   ├── metadata/
   │   ├── frame_000.json
   │   ├── frame_001.json
   │   └── ...
   └── summary.json
   ```

2. **Sync to Database**:
   ```bash
   npm run sync:incidents
   ```
   
   This will:
   - Scan for new incidents
   - Skip incidents that already exist
   - Create incident records with building relationships
   - Store detection data (fire count, human count, object count)
   - Link frame images as evidence

3. **View in Frontend**:
   Your frontend can now query:
   - `GET /api/buildings` - List all buildings
   - `GET /api/incidents` - List all incidents
   - `GET /api/incidents/building/:id` - Incidents for a specific building
   - `GET /api/incidents/:id` - Full incident details with all frames

---

## Verify Setup

### Check Buildings
```bash
curl http://localhost:3001/api/buildings
```

Should return 3 demo buildings.

### Check Incidents
```bash
curl http://localhost:3001/api/incidents
```

Should return your synced fire incidents.

### Check Building Statistics
```bash
curl http://localhost:3001/api/buildings/statistics
```

Should show counts of buildings, cameras, and incidents.

---

## API Endpoints Summary

| Endpoint | Description |
|----------|-------------|
| `GET /api/buildings` | List all buildings |
| `GET /api/buildings/:id` | Get building details |
| `GET /api/buildings/statistics` | Get building stats |
| `GET /api/incidents` | List all incidents (with filters) |
| `GET /api/incidents/:id` | Get incident by ID |
| `GET /api/incidents/number/:incident_number` | Get incident by number (e.g., INC-20260830-230331) |
| `GET /api/incidents/building/:building_id` | Get incidents for a building |
| `GET /api/incidents/statistics` | Get incident statistics |
| `PATCH /api/incidents/:id/status` | Update incident status |
| `POST /api/incidents` | Create incident (used by sync script) |

See `API_DOCUMENTATION.md` for full details.

---

## Database Structure

Your incident data is now stored in:

1. **incidents** table:
   - Incident metadata (ID, status, severity, timestamps)
   - Links to building and camera
   - Overall confidence score

2. **incident_detections** table:
   - One record per frame
   - Stores: fire_count, human_count, object_count
   - Stores: image_path, metadata_path
   - Links to incident and camera

3. **evidence** table:
   - One record per frame image
   - Stores file metadata (size, mime type, path)

---

## Troubleshooting

### "Camera not found" warnings during sync
This is normal if your Python script uses a camera ID that doesn't exist in the database. The incident will be assigned to a default building.

**Solution**: Update `demo-buildings-seed.js` to add cameras with IDs matching your Python script (e.g., CAM-01, CAM-02, etc.)

### Incidents not appearing
1. Check if sync ran successfully: `npm run sync:incidents`
2. Check if incidents exist: `curl http://localhost:3001/api/incidents`
3. Check database: `psql -d your_database -c "SELECT * FROM incidents;"`

### Database schema errors
Run migration to update schema:
```bash
npm run migrate
```

---

## Next Steps

1. **Connect your frontend** to the new API endpoints
2. **Display buildings** with incident counts
3. **Show incident details** with all detected frames
4. **Filter incidents** by building, status, severity
5. **Update incident status** when fire department responds

All the backend work is done - just integrate these APIs into your frontend! 🎉
