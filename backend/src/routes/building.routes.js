/**
 * Building Routes
 * 
 * API endpoints for building management
 */

const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/building.controller');

/**
 * @route   GET /api/buildings
 * @desc    Get all buildings with pagination
 * @access  Public
 * @query   page, limit, status, building_type
 */
router.get('/', buildingController.getAllBuildings);

/**
 * @route   GET /api/buildings/statistics
 * @desc    Get building statistics
 * @access  Public
 */
router.get('/statistics', buildingController.getBuildingStatistics);

/**
 * @route   GET /api/buildings/:id
 * @desc    Get building by ID
 * @access  Public
 */
router.get('/:id', buildingController.getBuildingById);

/**
 * @route   POST /api/buildings
 * @desc    Create new building
 * @access  Public
 */
router.post('/', buildingController.createBuilding);

module.exports = router;
