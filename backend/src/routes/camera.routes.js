/**
 * Camera Routes
 * 
 * API endpoints for camera management
 */

const express = require('express');
const router = express.Router();
const cameraController = require('../controllers/camera.controller');

/**
 * @route   GET /api/cameras
 * @desc    Get all cameras with pagination and filtering
 * @access  Public
 * @query   page, limit, building_id, status
 */
router.get('/', cameraController.getAllCameras);

/**
 * @route   GET /api/cameras/building/:building_id
 * @desc    Get cameras by building ID
 * @access  Public
 */
router.get('/building/:building_id', cameraController.getCamerasByBuilding);

/**
 * @route   GET /api/cameras/code/:camera_code
 * @desc    Get camera by camera code
 * @access  Public
 */
router.get('/code/:camera_code', cameraController.getCameraByCode);

/**
 * @route   GET /api/cameras/:id
 * @desc    Get camera by ID
 * @access  Public
 */
router.get('/:id', cameraController.getCameraById);

module.exports = router;
