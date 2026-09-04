/**
 * Routes Index
 * 
 * Central hub for all API routes.
 * Exports all route modules for easy mounting in server.js
 */

const frameRoutes = require('./frame.routes');
const stationRoutes = require('./station.routes');

module.exports = {
  frameRoutes,
  stationRoutes
};
