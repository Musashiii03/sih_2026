/**
 * Camera Controller
 * 
 * Handles camera operations including fetching cameras by building
 */

const { Camera, Building } = require('../models');

/**
 * Get all cameras with optional filtering
 */
exports.getAllCameras = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      building_id,
      status
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (building_id) where.building_id = building_id;
    if (status) where.status = status;

    const { count, rows: cameras } = await Camera.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['camera_code', 'ASC']],
      include: [
        {
          model: Building,
          as: 'building',
          attributes: ['id', 'name', 'building_type']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        cameras,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching cameras:', error);
    next(error);
  }
};

/**
 * Get cameras by building ID
 */
exports.getCamerasByBuilding = async (req, res, next) => {
  try {
    const { building_id } = req.params;

    const cameras = await Camera.findAll({
      where: { building_id },
      order: [['camera_code', 'ASC']],
      include: [
        {
          model: Building,
          as: 'building',
          attributes: ['id', 'name', 'building_type']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        cameras,
        count: cameras.length
      }
    });

  } catch (error) {
    console.error('Error fetching cameras by building:', error);
    next(error);
  }
};

/**
 * Get camera by ID
 */
exports.getCameraById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const camera = await Camera.findByPk(id, {
      include: [
        {
          model: Building,
          as: 'building'
        }
      ]
    });

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }

    res.json({
      success: true,
      data: camera
    });

  } catch (error) {
    console.error('Error fetching camera:', error);
    next(error);
  }
};

/**
 * Get camera by camera code
 */
exports.getCameraByCode = async (req, res, next) => {
  try {
    const { camera_code } = req.params;

    const camera = await Camera.findOne({
      where: { camera_code },
      include: [
        {
          model: Building,
          as: 'building'
        }
      ]
    });

    if (!camera) {
      return res.status(404).json({
        success: false,
        message: 'Camera not found'
      });
    }

    res.json({
      success: true,
      data: camera
    });

  } catch (error) {
    console.error('Error fetching camera by code:', error);
    next(error);
  }
};
