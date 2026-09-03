# Fire Detection Frame API Server

Express.js server that provides HTTP endpoints for retrieving fire incident frames and metadata from the YOLOv8 fire detection system.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment (Optional)

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to customize settings. Default values work for local development.

### 3. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on port 3001 by default.

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and uptime information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1705330822543,
  "uptime": 296.209,
  "environment": "development",
  "version": "1.0.0"
}
```

### Root Endpoint
```
GET /
```

Returns API information and available endpoints.

### Frame API Endpoints

*Note: Frame API routes will be available once `api/frame_api.js` is implemented.*

- `GET /api/incidents` - List all fire incidents
- `GET /api/incidents/:incidentId/summary` - Get incident summary with metadata
- `GET /api/incidents/:incidentId/frames/:frameIndex` - Serve frame image

## Configuration

Environment variables can be set in a `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment (development/production) |
| `API_CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin for frontend |

## Features

- ✅ Express.js server with CORS support
- ✅ JSON body parsing
- ✅ Request logging middleware
- ✅ Health check endpoint
- ✅ Graceful shutdown handling
- ✅ Error handling middleware
- ✅ 404 handler for undefined routes

## Error Handling

The server implements comprehensive error handling:

- **404 Not Found**: Returned for undefined routes
- **503 Service Unavailable**: Returned when frame API routes are not yet implemented
- **500 Internal Server Error**: Returned for server errors (with stack trace in development)

All errors are returned as JSON with appropriate HTTP status codes.

## Development

### Request Logging

All requests are logged with timestamp, method, and path:

```
[2025-01-15T14:30:22.543Z] GET /health
[2025-01-15T14:30:25.120Z] GET /api/incidents
```

### Graceful Shutdown

The server handles SIGTERM and SIGINT signals for graceful shutdown:

```bash
# Press Ctrl+C to trigger graceful shutdown
^C
⏸️  SIGINT signal received: closing HTTP server
✅ HTTP server closed
```

## Testing

### Manual Testing

Start the server and test endpoints:

```bash
# Start server
npm start

# In another terminal:
# Test health endpoint
curl http://localhost:3001/health

# Test root endpoint
curl http://localhost:3001/

# Test 404 handling
curl http://localhost:3001/nonexistent
```

### Module Testing

Verify the server module loads correctly:

```bash
node -e "const app = require('./server.js'); console.log('✅ Server loaded');"
```

## Architecture

The server follows this structure:

```
server.js
├── Middleware Configuration
│   ├── CORS
│   ├── JSON body parser
│   └── Request logging
├── Route Mounting
│   ├── Frame API routes (/api)
│   ├── Health check (/health)
│   └── Root endpoint (/)
├── Error Handling
│   ├── 404 handler
│   └── Global error handler
└── Server Startup
    ├── Port binding
    └── Graceful shutdown handlers
```

## Next Steps

After creating the server, the next step is to implement the Frame API routes:

1. Create `api/frame_api.js` with the following endpoints:
   - `GET /incidents` - List all incidents
   - `GET /incidents/:incidentId/summary` - Get incident summary
   - `GET /incidents/:incidentId/frames/:frameIndex` - Serve frame image

See the design document for detailed specifications.

## Troubleshooting

### Port Already in Use

If port 3001 is already in use:

```bash
# Change the port in .env
echo "API_PORT=3002" >> .env

# Or set it temporarily
API_PORT=3002 npm start
```

### CORS Issues

If the frontend cannot access the API due to CORS:

1. Check the `API_CORS_ORIGIN` in `.env` matches your frontend URL
2. Restart the server after changing environment variables
3. Check browser console for specific CORS error messages

### Module Not Found

If you see "Cannot find module" errors:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```
