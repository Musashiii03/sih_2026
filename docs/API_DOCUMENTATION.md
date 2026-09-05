# Fire Detection API Documentation

## Overview

This API provides endpoints for managing fire incidents, buildings, cameras, and related data from the AI-powered fire detection system.

## Setup

### 1. Seed Demo Data

First time setup - creates demo buildings, cameras, and syncs existing fire incidents:

```bash
npm run seed:demo
```

This will:
- Create 3 demo buildings with addresses
- Create 7 demo cameras across the buildings
- Sync all fire incidents from `data/fire_incidents/` to the database

### 2. Sync New Incidents

After running the Python AI detection script, sync new incidents to the database:

```bash
npm run sync:incidents
```

This will:
- Scan the `data/fire_incidents/` folder for new incidents
- Skip incidents that already exist in the database
- Create incident records, detection records, and evidence records

## API Endpoints

### Base URL
```
http://localhost:3001/api
```

---

## Buildings API

### Get All Buildings
```http
GET /api/buildings
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `status` (string) - Filter by status: ACTIVE, INACTIVE, UNDER_CONSTRUCTION, DEMOLISHED
- `building_type` (string) - Filter by type: RESIDENTIAL, APARTMENT, OFFICE, MALL, HOTEL, etc.

**Response:**
```json
{
  "success": true,
  "data": {
    "buildings": [
      {
        "id": "uuid",
        "building_code": "BLD-GGN-001",
        "name": "Cyber Heights Office Complex",
        "building_type": "OFFICE",
        "address": {
          "address_line_1": "Plot No. 123, Sector 15",
          "city": "Gurugram",
          "state": "Haryana",
          "postal_code": "122001"
        },
        "cameras": [...],
        "incident_stats": {
          "total_incidents": 5,
          "active_incidents": 2
        }
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

### Get Building by ID
```http
GET /api/buildings/:id
```

**Response:** Single building with full details and incident statistics

### Get Building Statistics
```http
GET /api/buildings/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_buildings": 3,
    "active_buildings": 3,
    "total_cameras": 7,
    "online_cameras": 7,
    "buildings_with_incidents": 1
  }
}
```

---

## Incidents API

### Create Incident (from AI Detection)
```http
POST /api/incidents
```

**Request Body:**
```json
{
  "incident_id": "INC-20260830-230331",
  "camera_id": "CAM-01",
  "building_id": "uuid (optional)",
  "timestamp": 1788111211.3655643,
  "frames": [
    {
      "frame_index": 0,
      "timestamp": 1788111172.9020095,
      "timestamp_readable": "2026-08-30T23:02:52.902009Z",
      "fire_confidence": 0.4625,
      "fire_count": 2,
      "human_count": 0,
      "object_count": 2,
      "image_path": "S:\\...\\frame_000.jpg",
      "metadata_path": "S:\\...\\frame_000.json"
    }
  ],
  "statistics": {
    "total_fire_detections": 12,
    "total_human_detections": 0,
    "avg_fire_confidence": 0.4238
  }
}
```

**Response:** Created incident with full details

### Get All Incidents
```http
GET /api/incidents
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string) - DETECTED, REPORTED, VERIFIED, DISPATCHED, RESPONDING, ON_SCENE, CONTAINED, RESOLVED, FALSE_ALARM, CLOSED
- `severity` (string) - LOW, MEDIUM, HIGH, CRITICAL
- `building_id` (uuid)
- `incident_type` (string) - FIRE, SMOKE, FALSE_ALARM, FIRE_HAZARD, OTHER
- `start_date` (ISO date)
- `end_date` (ISO date)

**Response:**
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "id": "uuid",
        "incident_number": "INC-20260830-230331",
        "incident_type": "FIRE",
        "status": "DETECTED",
        "severity": "MEDIUM",
        "priority": "MEDIUM",
        "confidence_score": 0.4238,
        "detected_at": "2026-08-30T23:03:31.365Z",
        "building": {...},
        "detected_by_camera": {...},
        "detections": [...]
      }
    ],
    "pagination": {...}
  }
}
```

### Get Incident by ID
```http
GET /api/incidents/:id
```

**Response:** Single incident with full details including all detections and evidence

### Get Incident by Number
```http
GET /api/incidents/number/:incident_number
```

Example: `GET /api/incidents/number/INC-20260830-230331`

### Get Incidents by Building
```http
GET /api/incidents/building/:building_id
```

**Query Parameters:**
- `page`, `limit`, `status` (same as Get All Incidents)

### Update Incident Status
```http
PATCH /api/incidents/:id/status
```

**Request Body:**
```json
{
  "status": "VERIFIED",
  "notes": "Fire confirmed by security team"
}
```

### Get Incident Statistics
```http
GET /api/incidents/statistics
```

**Query Parameters:**
- `building_id` (uuid, optional)
- `start_date` (ISO date, optional)
- `end_date` (ISO date, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_incidents": 5,
    "active_incidents": 2,
    "resolved_incidents": 3,
    "critical_incidents": 1,
    "average_confidence": "0.4238"
  }
}
```

---

## Data Models

### Incident Detection
Each incident contains multiple detection records (one per frame):

```json
{
  "id": "uuid",
  "incident_id": "uuid",
  "camera_id": "uuid",
  "detection_type": "FIRE",
  "confidence_score": 0.4625,
  "detected_at": "2026-08-30T23:02:52.902Z",
  "frame_index": 0,
  "fire_count": 2,
  "human_count": 0,
  "object_count": 2,
  "image_path": "S:\\...\\frame_000.jpg",
  "metadata_path": "S:\\...\\frame_000.json"
}
```

### Evidence
Each frame image is stored as evidence:

```json
{
  "id": "uuid",
  "incident_id": "uuid",
  "evidence_type": "CCTV_FRAME",
  "file_name": "frame_000.jpg",
  "file_path": "S:\\...\\frame_000.jpg",
  "mime_type": "image/jpeg",
  "file_size_bytes": 123456,
  "captured_at": "2026-08-30T23:02:52.902Z",
  "source_type": "AI",
  "camera_id": "uuid"
}
```

---

## Workflow

### 1. Initial Setup
```bash
# Start the backend server
npm run dev

# In another terminal, seed demo data
npm run seed:demo
```

### 2. AI Detection & Sync
```bash
# Run your Python fire detection script
# It will create data in: data/fire_incidents/YYYY-MM-DD/INC-XXXXX/

# Sync the new incidents to database
npm run sync:incidents
```

### 3. Frontend Integration
```javascript
// Fetch all buildings
const buildings = await fetch('http://localhost:3001/api/buildings').then(r => r.json());

// Fetch incidents for a building
const incidents = await fetch(`http://localhost:3001/api/incidents/building/${buildingId}`).then(r => r.json());

// Fetch incident details
const incident = await fetch(`http://localhost:3001/api/incidents/${incidentId}`).then(r => r.json());

// Display frame images (already served via static route)
<img src={`http://localhost:3001${detection.image_path.replace('S:\\Programming\\sih_2026\\backend\\', '/').replace(/\\\\/g, '/')}`} />
```

---

## Notes

- **No Frontend Changes Required**: This is pure backend implementation
- **File System + Database**: Fire incident data is stored both in the file system (for images/metadata) and in the database (for querying and relationships)
- **Auto Sync**: Run `npm run sync:incidents` after each AI detection run
- **Demo Buildings**: The seed script creates 3 demo buildings with 7 cameras that can be connected to incidents
- **Severity Classification**: Incidents are automatically classified by severity based on confidence scores and human detection
- **Building Relationships**: All incidents are linked to buildings via camera relationships

## Error Handling

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `404` - Not Found
- `500` - Internal Server Error
