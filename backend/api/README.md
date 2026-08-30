# Frame API

The Frame API provides HTTP endpoints for retrieving fire incident frames and metadata captured by the fire detection system.

## Endpoints

### 1. GET /api/incidents

Lists all fire incidents sorted by timestamp (newest first).

**Response:**
```json
{
  "incidents": [
    {
      "incident_id": "INC-20250115-143022",
      "timestamp": 1705330822.0,
      "timestamp_readable": "2025-01-15T14:30:22Z",
      "frame_count": 12,
      "camera_id": "CAM-03",
      "location": "Warehouse A"
    }
  ],
  "count": 1,
  "timestamp": 1705330822000
}
```

### 2. GET /api/incidents/:incidentId/summary

Returns the complete summary JSON for a specific incident, including all frame metadata.

**Parameters:**
- `incidentId` - The incident identifier (e.g., "INC-20250115-143022")

**Response:**
```json
{
  "incident_id": "INC-20250115-143022",
  "timestamp": 1705330822.0,
  "timestamp_readable": "2025-01-15T14:30:22Z",
  "camera_id": "CAM-03",
  "location": "Warehouse A",
  "frame_count": 12,
  "frames": [
    {
      "frame_index": 0,
      "timestamp": 1705330822.543,
      "timestamp_readable": "2025-01-15T14:30:22.543Z",
      "confidence": 0.87,
      "bounding_boxes": [
        {
          "x": 120,
          "y": 80,
          "width": 200,
          "height": 150,
          "confidence": 0.87
        }
      ],
      "image_path": "/absolute/path/to/frame_000.jpg",
      "metadata_path": "/absolute/path/to/frame_000.json"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - Invalid incident ID
- `404 Not Found` - Incident not found
- `500 Internal Server Error` - File read error or corrupted data

### 3. GET /api/incidents/:incidentId/frames/:frameIndex

Serves the frame image file for a specific incident and frame index.

**Parameters:**
- `incidentId` - The incident identifier
- `frameIndex` - The frame index (0-based integer)

**Response:**
- Content-Type: `image/jpeg`
- Binary image data

**Error Responses:**
- `400 Bad Request` - Invalid incident ID or frame index
- `404 Not Found` - Incident or frame not found
- `500 Internal Server Error` - File read error

## Configuration

The API uses the following environment variables:

- `FRAME_STORAGE_PATH` - Base path for fire incidents storage (default: `data/fire_incidents_demo`)
- `API_PORT` - Server port (default: 3001)
- `API_CORS_ORIGIN` - CORS origin for frontend requests (default: http://localhost:5173)

## Directory Structure

The API expects the following directory structure:

```
data/fire_incidents/
  2025-01-15/
    INC-20250115-143022/
      summary.json
      frames/
        frame_000.jpg
        frame_001.jpg
        ...
      metadata/
        frame_000.json
        frame_001.json
        ...
```

## Testing

Example requests using curl:

```bash
# List all incidents
curl http://localhost:3001/api/incidents

# Get incident summary
curl http://localhost:3001/api/incidents/INC-20250115-143022/summary

# Get frame image
curl http://localhost:3001/api/incidents/INC-20250115-143022/frames/0 --output frame.jpg
```

Example requests using PowerShell:

```powershell
# List all incidents
Invoke-RestMethod -Uri "http://localhost:3001/api/incidents"

# Get incident summary
Invoke-RestMethod -Uri "http://localhost:3001/api/incidents/INC-20250115-143022/summary"

# Download frame image
Invoke-WebRequest -Uri "http://localhost:3001/api/incidents/INC-20250115-143022/frames/0" -OutFile "frame.jpg"
```

## Error Handling

The API implements robust error handling:

- **File System Errors**: Returns 500 with descriptive error message
- **Missing Resources**: Returns 404 with specific error details
- **Invalid Parameters**: Returns 400 with validation error message
- **Corrupted Data**: Returns 500 with parsing error details

All errors are logged to the console with timestamps for debugging.

## Implementation Notes

### Helper Functions

The API uses three main helper functions:

1. **scanIncidentDirectories()** - Recursively scans date directories to find all incidents
2. **findSummaryPath()** - Locates the summary.json file for a given incident ID
3. **findFramePath()** - Locates the frame image file for a given incident and frame index

### Performance Considerations

- File system operations are asynchronous (using fs.promises)
- Incident scanning caches results per request
- Frame images are served using Express's efficient sendFile method
- Directory traversal is optimized to skip non-directory entries early

### Security Considerations

- Path traversal attacks are prevented by using path.join() and checking file existence
- Input validation ensures incident IDs and frame indices are properly formatted
- CORS is configured to only allow requests from the configured frontend origin
- No authentication is currently implemented (suitable for internal network only)
