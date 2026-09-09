/**
 * Routes Index
 * 
 * Central hub for all API routes.
 * Exports all route modules for easy mounting in server.js
 */

const frameRoutes = require('./frame.routes');
const stationRoutes = require('./station.routes');
const incidentRoutes = require('./incident.routes');
const buildingRoutes = require('./building.routes');
const cameraRoutes = require('./camera.routes');
const organizationRoutes = require('./organization.routes');
const userRoutes = require('./user.routes');

module.exports = {
  frameRoutes,
  stationRoutes,
  incidentRoutes,
  buildingRoutes,
  cameraRoutes,
  organizationRoutes,
  userRoutes
};
