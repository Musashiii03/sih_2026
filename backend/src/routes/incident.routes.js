/**
 * Incident Routes
 * 
 * API endpoints for fire incident management
 */

const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');

/**
 * @route   POST /api/incidents
 * @desc    Create new fire incident from AI detection data
 * @access  Public (should be protected in production)
 */
router.post('/', incidentController.createIncident);

/**
 * @route   GET /api/incidents
 * @desc    Get all incidents with pagination and filtering
 * @access  Public
 * @query   page, limit, status, severity, building_id, incident_type, start_date, end_date
 */
router.get('/', incidentController.getAllIncidents);

/**
 * @route   GET /api/incidents/history
 * @desc    Get incident history for owner console (all incidents with timeline)
 * @access  Public
 * @query   page, limit, status, search
 */
router.get('/history', incidentController.getIncidentHistory);

/**
 * @route   GET /api/incidents/statistics
 * @desc    Get incident statistics
 * @access  Public
 * @query   building_id, start_date, end_date
 */
router.get('/statistics', incidentController.getIncidentStatistics);

/**
 * @route   GET /api/incidents/active-alerts
 * @desc    Get active fire alerts for real-time monitoring (building_id = 1)
 * @access  Public
 */
router.get('/active-alerts', incidentController.getActiveFireAlerts);

/**
 * @route   GET /api/incidents/number/:incident_number
 * @desc    Get incident by incident number
 * @access  Public
 */
router.get('/number/:incident_number', incidentController.getIncidentByNumber);

/**
 * @route   GET /api/incidents/dashboard/:incident_number
 * @desc    Get full incident dashboard data with all relations
 * @access  Public
 */
router.get('/dashboard/:incident_number', incidentController.getIncidentDashboardData);

/**
 * @route   GET /api/incidents/building/:building_id
 * @desc    Get incidents by building ID
 * @access  Public
 * @query   page, limit, status
 */
router.get('/building/:building_id', incidentController.getIncidentsByBuilding);

/**
 * @route   GET /api/incidents/:id
 * @desc    Get incident by ID
 * @access  Public
 */
router.get('/:id', incidentController.getIncidentById);

/**
 * @route   PATCH /api/incidents/:id/status
 * @desc    Update incident status
 * @access  Public (should be protected in production)
 */
router.patch('/:id/status', incidentController.updateIncidentStatus);

/**
 * @route   POST /api/incidents/:id/acknowledge
 * @desc    Acknowledge incident alert (sends email to fire dept if within 45s)
 * @access  Public (should be protected in production)
 */
router.post('/:id/acknowledge', incidentController.acknowledgeIncident);

/**
 * @route   POST /api/incidents/:id/escalate
 * @desc    Auto-escalate incident (timer expired, sends email to fire dept)
 * @access  Public (should be protected in production)
 */
router.post('/:id/escalate', incidentController.escalateIncident);

module.exports = router;
