// Fire Detection Frame API Server
// Provides HTTP endpoints for retrieving fire incident frames and metadata

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database utilities
const { testConnection, syncDatabase, closeConnection } = require('./src/config/sequelize');
const db = require('./src/models');

// Import API routes
const { frameRoutes, stationRoutes, incidentRoutes, buildingRoutes } = require('./src/routes');


const app = express();
const PORT = process.env.API_PORT || 3001;
const CORS_ORIGIN = process.env.API_CORS_ORIGIN || 'http://localhost:5173';

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Enable CORS for frontend requests
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// API ROUTES
// ============================================================================

// Serve static frame images and hologram files directly from data directory
// GET /data/fire_incidents/... → data/ folder
const DATA_PATH = path.join(__dirname, '..', 'data');
app.use('/data', express.static(DATA_PATH, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

// Also expose hologram endpoint that serves the hologram JSON data for a given incident
app.get('/api/incidents/:incidentId/hologram', async (req, res) => {
  const fs = require('fs').promises;
  const { incidentId } = req.params;
  const incidentBasePath = path.join(DATA_PATH, 'fire_incidents');
  try {
    const dateDirs = await fs.readdir(incidentBasePath, { withFileTypes: true });
    for (const dateDir of dateDirs) {
      if (!dateDir.isDirectory()) continue;
      const hPath = path.join(incidentBasePath, dateDir.name, incidentId, `hologram_data_${incidentId}.json`);
      try {
        await fs.access(hPath);
        const content = await fs.readFile(hPath, 'utf8');
        return res.json(JSON.parse(content));
      } catch (_) { continue; }
    }
    return res.status(404).json({ error: 'NotFound', message: `Hologram not found for ${incidentId}` });
  } catch (err) {
    return res.status(500).json({ error: 'InternalServerError', message: err.message });
  }
});

// Mount frame API routes at /api
app.use('/api', frameRoutes);

// Mount nearest station API routes at /api
app.use('/api', stationRoutes);

// Mount incident API routes at /api
app.use('/api/incidents', incidentRoutes);

// Mount building API routes at /api
app.use('/api/buildings', buildingRoutes);

// Health check endpoint (includes database status)
app.get('/health', async (req, res) => {
  const { checkDatabaseHealth } = require('./src/utils/database');
  
  try {
    const dbHealth = await checkDatabaseHealth();
    
    res.json({
      status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: dbHealth
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Fire Detection Frame API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      incidents: '/api/incidents',
      incidentSummary: '/api/incidents/:incidentId/summary',
      frameImage: '/api/incidents/:incidentId/frames/:frameIndex'
    }
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: Date.now()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: err.name || 'ServerError',
    message: message,
    timestamp: Date.now(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Initialize database and start server
 */
const startServer = async () => {
  try {
    // Test database connection only
    const connected = await testConnection();
    
    if (!connected) {
      console.warn('⚠️  Database connection failed. Server will start but database operations will not work.');
      console.warn('💡 Run "npm run db:setup" to initialize the database.');
    } else {
      console.log('✅ Database connected');
      
      // Log registered models count
      const modelCount = db.getModelCount();
      if (modelCount > 0) {
        console.log(`📦 ${modelCount} models registered`);
      }
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log('\n🔥 Fire Detection API Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
let server;
startServer().then(s => { server = s; });

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n⏸️  ${signal} signal received: closing server gracefully`);
  
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');
      
      // Close database connection
      await closeConnection();
      
      console.log('👋 Shutdown complete');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    await closeConnection();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
