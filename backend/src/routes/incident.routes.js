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
 * @route   GET /api/incidents/statistics
 * @desc    Get incident statistics
 * @access  Public
 * @query   building_id, start_date, end_date
 */
router.get('/statistics', incidentController.getIncidentStatistics);

/**
 * @route   GET /api/incidents/:id
 * @desc    Get incident by ID
 * @access  Public
 */
router.get('/:id', incidentController.getIncidentById);

/**
 * @route   GET /api/incidents/number/:incident_number
 * @desc    Get incident by incident number
 * @access  Public
 */
router.get('/number/:incident_number', incidentController.getIncidentByNumber);

/**
 * @route   GET /api/incidents/building/:building_id
 * @desc    Get incidents by building ID
 * @access  Public
 * @query   page, limit, status
 */
router.get('/building/:building_id', incidentController.getIncidentsByBuilding);

/**
 * @route   PATCH /api/incidents/:id/status
 * @desc    Update incident status
 * @access  Public (should be protected in production)
 */
router.patch('/:id/status', incidentController.updateIncidentStatus);

module.exports = router;
