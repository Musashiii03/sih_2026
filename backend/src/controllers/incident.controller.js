/**
 * Incident Controller
 * 
 * Handles fire incident operations including creating incidents from AI detection data
 */

const { Incident, IncidentDetection, Building, Camera, Evidence, Address, sequelize } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

/**
 * Create a new fire incident from AI detection data
 */
exports.createIncident = async (req, res, next) => {
  try {
    const {
      incident_id,
      camera_id,
      building_id,
      timestamp,
      frames,
      statistics,
      location
    } = req.body;

    // Find camera to get building info if not provided
    let buildingId = building_id;
    let cameraRecord = null;
    
    if (camera_id) {
      cameraRecord = await Camera.findOne({
        where: { camera_code: camera_id }
      });
      
      if (cameraRecord && !buildingId) {
        buildingId = cameraRecord.building_id;
      }
    }

    // Determine severity based on statistics
    let severity = 'LOW';
    let priority = 'MEDIUM';
    
    if (statistics) {
      const avgConfidence = statistics.avg_fire_confidence || 0;
      const humanCount = statistics.total_human_detections || 0;
      
      if (humanCount > 0 || avgConfidence > 0.7) {
        severity = 'CRITICAL';
        priority = 'URGENT';
      } else if (avgConfidence > 0.5) {
        severity = 'HIGH';
        priority = 'HIGH';
      } else if (avgConfidence > 0.3) {
        severity = 'MEDIUM';
        priority = 'MEDIUM';
      }
    }

    // Generate incident number if not provided
    const incidentNumber = incident_id || `INC-${Date.now()}`;

    // Create the incident
    const incident = await Incident.create({
      incident_number: incidentNumber,
      incident_type: 'FIRE',
      source_type: 'CCTV_AI',
      status: 'DETECTED',
      severity: severity,
      priority: priority,
      building_id: buildingId,
      building_unit_id: null,
      reported_by_user_id: null,
      detected_by_camera_id: cameraRecord ? cameraRecord.id : null,
      description: `AI-detected fire incident with ${statistics?.total_fire_detections || 0} fire detections across ${frames?.length || 0} frames`,
      detected_at: timestamp ? new Date(timestamp * 1000) : new Date(),
      reported_at: new Date(),
      acknowledged_at: null,
      resolved_at: null,
      location: location ? sequelize.fn('ST_GeomFromText', location, 4326) : sequelize.fn('ST_GeomFromText', 'POINT(77.0266 28.4595)', 4326),
      confidence_score: statistics?.avg_fire_confidence || 0
    });

    // Create detection records for each frame
    const detections = [];
    const evidenceRecords = [];

    if (frames && Array.isArray(frames)) {
      for (const frame of frames) {
        // Create detection record
        const detection = await IncidentDetection.create({
          incident_id: incident.id,
          camera_id: cameraRecord ? cameraRecord.id : null,
          detection_type: 'FIRE',
          confidence_score: frame.fire_confidence || 0,
          detected_at: frame.timestamp ? new Date(frame.timestamp * 1000) : new Date(),
          floor_number: cameraRecord?.floor_number || null,
          room_name: cameraRecord?.room_name || null,
          bounding_box: null, // Not storing individual boxes as requested
          frame_number: frame.frame_index,
          frame_index: frame.frame_index,
          fire_count: frame.fire_count || 0,
          human_count: frame.human_count || 0,
          object_count: frame.object_count || 0,
          image_path: frame.image_path,
          metadata_path: frame.metadata_path,
          model_name: 'YOLOv8-Fire-Detection',
          model_version: '1.0'
        });

        detections.push(detection);

        // Create evidence record for the frame image
        if (frame.image_path) {
          try {
            const stats = await fs.stat(frame.image_path);
            const fileName = path.basename(frame.image_path);
            
            const evidence = await Evidence.create({
              incident_id: incident.id,
              evidence_type: 'CCTV_FRAME',
              file_name: fileName,
              file_path: frame.image_path,
              mime_type: 'image/jpeg',
              file_size_bytes: stats.size,
              captured_at: frame.timestamp ? new Date(frame.timestamp * 1000) : new Date(),
              uploaded_at: new Date(),
              source_type: 'AI',
              camera_id: cameraRecord ? cameraRecord.id : null,
              description: `Frame ${frame.frame_index} - Fire detected with ${frame.fire_count} fire instances`,
              checksum: null
            });

            evidenceRecords.push(evidence);
          } catch (error) {
            console.warn(`Could not create evidence for frame ${frame.frame_index}:`, error.message);
          }
        }
      }
    }

    // Fetch the complete incident with associations
    const completeIncident = await Incident.findByPk(incident.id, {
      include: [
        {
          model: Building,
          as: 'building',
          include: [{
            model: Address,
            as: 'address'
          }]
        },
        {
          model: Camera,
          as: 'detected_by_camera'
        },
        {
          model: IncidentDetection,
          as: 'detections'
        },
        {
          model: Evidence,
          as: 'evidence'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Fire incident created successfully',
      data: {
        incident: completeIncident,
        detections_count: detections.length,
        evidence_count: evidenceRecords.length
      }
    });

  } catch (error) {
    console.error('Error creating incident:', error);
    next(error);
  }
};

/**
 * Get all incidents with pagination and filtering
 */
exports.getAllIncidents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      severity,
      building_id,
      incident_type,
      start_date,
      end_date
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (building_id) where.building_id = building_id;
    if (incident_type) where.incident_type = incident_type;
    
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }

    const { count, rows: incidents } = await Incident.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['detected_at', 'DESC']],
      include: [
        {
          model: Building,
          as: 'building',
          include: [{
            model: Address,
            as: 'address'
          }]
        },
        {
          model: Camera,
          as: 'detected_by_camera'
        },
        {
          model: IncidentDetection,
          as: 'detections',
          limit: 5,
          order: [['detected_at', 'DESC']]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        incidents,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching incidents:', error);
    next(error);
  }
};

/**
 * Get incident by ID
 */
exports.getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findByPk(id, {
      include: [
        {
          model: Building,
          as: 'building',
          include: [{
            model: Address,
            as: 'address'
          }]
        },
        {
          model: Camera,
          as: 'detected_by_camera'
        },
        {
          model: IncidentDetection,
          as: 'detections',
          order: [['detected_at', 'ASC']]
        },
        {
          model: Evidence,
          as: 'evidence',
          order: [['captured_at', 'ASC']]
        }
      ]
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    res.json({
      success: true,
      data: incident
    });

  } catch (error) {
    console.error('Error fetching incident:', error);
    next(error);
  }
};

/**
 * Get incident by incident number
 */
exports.getIncidentByNumber = async (req, res, next) => {
  try {
    const { incident_number } = req.params;

    const incident = await Incident.findOne({
      where: { incident_number },
      include: [
        {
          model: Building,
          as: 'building',
          include: [{
            model: Address,
            as: 'address'
          }]
        },
        {
          model: Camera,
          as: 'detected_by_camera'
        },
        {
          model: IncidentDetection,
          as: 'detections',
          order: [['detected_at', 'ASC']]
        },
        {
          model: Evidence,
          as: 'evidence',
          order: [['captured_at', 'ASC']]
        }
      ]
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    res.json({
      success: true,
      data: incident
    });

  } catch (error) {
    console.error('Error fetching incident:', error);
    next(error);
  }
};

/**
 * Get incidents by building ID
 */
exports.getIncidentsByBuilding = async (req, res, next) => {
  try {
    const { building_id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const offset = (page - 1) * limit;
    const where = { building_id };

    if (status) where.status = status;

    const { count, rows: incidents } = await Incident.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['detected_at', 'DESC']],
      include: [
        {
          model: Building,
          as: 'building',
          include: [{
            model: Address,
            as: 'address'
          }]
        },
        {
          model: Camera,
          as: 'detected_by_camera'
        },
        {
          model: IncidentDetection,
          as: 'detections',
          limit: 3
        }
      ]
    });

    res.json({
      success: true,
      data: {
        incidents,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching building incidents:', error);
    next(error);
  }
};

/**
 * Update incident status
 */
exports.updateIncidentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const incident = await Incident.findByPk(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    const updateData = { status };

    // Update timestamps based on status
    if (status === 'VERIFIED') {
      updateData.acknowledged_at = new Date();
    } else if (status === 'RESOLVED' || status === 'CLOSED' || status === 'FALSE_ALARM') {
      updateData.resolved_at = new Date();
    }

    await incident.update(updateData);

    res.json({
      success: true,
      message: 'Incident status updated successfully',
      data: incident
    });

  } catch (error) {
    console.error('Error updating incident:', error);
    next(error);
  }
};

/**
 * Get incident statistics
 */
exports.getIncidentStatistics = async (req, res, next) => {
  try {
    const { building_id, start_date, end_date } = req.query;

    const where = {};
    if (building_id) where.building_id = building_id;
    if (start_date || end_date) {
      where.detected_at = {};
      if (start_date) where.detected_at[Op.gte] = new Date(start_date);
      if (end_date) where.detected_at[Op.lte] = new Date(end_date);
    }

    const [
      totalIncidents,
      activeIncidents,
      resolvedIncidents,
      criticalIncidents,
      avgConfidence
    ] = await Promise.all([
      Incident.count({ where }),
      Incident.count({ where: { ...where, status: ['DETECTED', 'REPORTED', 'VERIFIED', 'DISPATCHED', 'RESPONDING', 'ON_SCENE'] } }),
      Incident.count({ where: { ...where, status: ['RESOLVED', 'CLOSED'] } }),
      Incident.count({ where: { ...where, severity: 'CRITICAL' } }),
      Incident.findAll({
        where,
        attributes: [[sequelize.fn('AVG', sequelize.col('confidence_score')), 'avg_confidence']],
        raw: true
      })
    ]);

    res.json({
      success: true,
      data: {
        total_incidents: totalIncidents,
        active_incidents: activeIncidents,
        resolved_incidents: resolvedIncidents,
        critical_incidents: criticalIncidents,
        average_confidence: parseFloat(avgConfidence[0]?.avg_confidence || 0).toFixed(4)
      }
    });

  } catch (error) {
    console.error('Error fetching incident statistics:', error);
    next(error);
  }
};
