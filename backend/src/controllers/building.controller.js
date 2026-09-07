/**
 * Building Controller
 * 
 * Handles building-related operations
 */

const { Building, Address, Camera, Incident, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all buildings with pagination
 */
exports.getAllBuildings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      building_type
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (building_type) where.building_type = building_type;

    const { count, rows: buildings } = await Building.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Address,
          as: 'address'
        },
        {
          model: Camera,
          as: 'cameras',
          attributes: ['id', 'camera_code', 'name', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Get incident counts for each building
    const buildingsWithStats = await Promise.all(
      buildings.map(async (building) => {
        const incidentCount = await Incident.count({
          where: { building_id: building.id }
        });

        const activeIncidentCount = await Incident.count({
          where: {
            building_id: building.id,
            status: {
              [Op.in]: ['DETECTED', 'REPORTED', 'VERIFIED', 'DISPATCHED', 'RESPONDING', 'ON_SCENE']
            }
          }
        });

        return {
          ...building.toJSON(),
          incident_stats: {
            total_incidents: incidentCount,
            active_incidents: activeIncidentCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        buildings: buildingsWithStats,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching buildings:', error);
    next(error);
  }
};

/**
 * Get building by ID
 */
exports.getBuildingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const building = await Building.findByPk(id, {
      include: [
        {
          model: Address,
          as: 'address'
        },
        {
          model: Camera,
          as: 'cameras'
        }
      ]
    });

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    // Get incident statistics
    const [totalIncidents, activeIncidents, criticalIncidents] = await Promise.all([
      Incident.count({ where: { building_id: id } }),
      Incident.count({
        where: {
          building_id: id,
          status: {
            [Op.in]: ['DETECTED', 'REPORTED', 'VERIFIED', 'DISPATCHED', 'RESPONDING', 'ON_SCENE']
          }
        }
      }),
      Incident.count({
        where: {
          building_id: id,
          severity: 'CRITICAL'
        }
      })
    ]);

    const buildingData = {
      ...building.toJSON(),
      incident_stats: {
        total_incidents: totalIncidents,
        active_incidents: activeIncidents,
        critical_incidents: criticalIncidents
      }
    };

    res.json({
      success: true,
      data: buildingData
    });

  } catch (error) {
    console.error('Error fetching building:', error);
    next(error);
  }
};

/**
 * Get building statistics
 */
exports.getBuildingStatistics = async (req, res, next) => {
  try {
    const totalBuildings = await Building.count();
    const activeBuildings = await Building.count({ where: { status: 'ACTIVE' } });
    const totalCameras = await Camera.count();
    const onlineCameras = await Camera.count({ where: { status: 'ONLINE' } });

    // Buildings with incidents
    const buildingsWithIncidents = await sequelize.query(`
      SELECT COUNT(DISTINCT building_id) as count
      FROM incidents
      WHERE building_id IS NOT NULL
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        total_buildings: totalBuildings,
        active_buildings: activeBuildings,
        total_cameras: totalCameras,
        online_cameras: onlineCameras,
        buildings_with_incidents: parseInt(buildingsWithIncidents[0]?.count || 0)
      }
    });

  } catch (error) {
    console.error('Error fetching building statistics:', error);
    next(error);
  }
};

/**
 * Create new building
 */
exports.createBuilding = async (req, res, next) => {
  try {
    const buildingData = req.body;

    // Validate required fields
    if (!buildingData.building_code || !buildingData.name || !buildingData.building_type) {
      return res.status(400).json({
        success: false,
        message: 'Building code, name, and type are required'
      });
    }

    // Check if building code already exists
    const existing = await Building.findOne({
      where: { building_code: buildingData.building_code }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Building code already exists'
      });
    }

    // Create building
    const building = await Building.create(buildingData);

    res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: building
    });

  } catch (error) {
    console.error('Error creating building:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    next(error);
  }
};
