/**
 * Incident Controller
 * 
 * Handles fire incident operations including creating incidents from AI detection data
 */

const { Incident, IncidentDetection, Building, Camera, Evidence, Address, IncidentTimeline, sequelize } = require('../models');
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
    
    // Generate dashboard URL
    const dashboardUrl = `dispatch/${incidentNumber}`;

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
      confidence_score: statistics?.avg_fire_confidence || 0,
      dashboard_url: dashboardUrl
    });

    console.log(`✅ Created incident ${incidentNumber} with ID ${incident.id}`);

    // Create timeline entries for incident creation and detection
    const timelineEntries = [];
    
    // Timeline entry: Incident Created
    const incidentCreatedEntry = await IncidentTimeline.create({
      incident_id: incident.id,
      event_type: 'INCIDENT_CREATED',
      description: `Incident ${incidentNumber} created by AI detection system`,
      actor_type: 'SYSTEM',
      actor_user_id: null,
      metadata: {
        source: 'sync-fire-incidents',
        incident_type: 'FIRE',
        severity: severity,
        priority: priority
      },
      occurred_at: incident.detected_at
    });
    timelineEntries.push(incidentCreatedEntry);
    
    // Timeline entry: Fire Detected
    const fireDetectedEntry = await IncidentTimeline.create({
      incident_id: incident.id,
      event_type: 'FIRE_DETECTED',
      description: `Fire detected by ${cameraRecord?.camera_code || 'CCTV AI'} with ${(statistics?.avg_fire_confidence * 100 || 0).toFixed(1)}% confidence`,
      actor_type: 'AI',
      actor_user_id: null,
      metadata: {
        camera_code: cameraRecord?.camera_code || camera_id,
        camera_id: cameraRecord?.id,
        confidence_score: statistics?.avg_fire_confidence || 0,
        fire_detections: statistics?.total_fire_detections || 0,
        frames_analyzed: frames?.length || 0
      },
      occurred_at: incident.detected_at
    });
    timelineEntries.push(fireDetectedEntry);
    
    // Timeline entry: Person Detected (if humans found)
    if (statistics?.total_human_detections > 0) {
      const personDetectedEntry = await IncidentTimeline.create({
        incident_id: incident.id,
        event_type: 'PERSON_DETECTED',
        description: `${statistics.total_human_detections} person(s) detected in fire zone - Priority escalated to ${priority}`,
        actor_type: 'AI',
        actor_user_id: null,
        metadata: {
          human_count: statistics.total_human_detections,
          peak_human_count: statistics.peak_human_count || statistics.total_human_detections,
          frames_with_humans: statistics.frames_with_humans || 0
        },
        occurred_at: incident.detected_at
      });
      timelineEntries.push(personDetectedEntry);
    }
    
    console.log(`✅ Created ${timelineEntries.length} timeline entries for incident ${incidentNumber}`);

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
          include: [
            {
              model: Address,
              as: 'address',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'longitude']
                ]
              }
            },
            {
              model: Address,
              as: 'nearestFireStation',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'longitude']
                ]
              }
            }
          ]
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
        },
        {
          model: Evidence,
          as: 'evidence',
          limit: 10,
          order: [['captured_at', 'ASC']],
          attributes: ['id', 'evidence_type', 'file_name', 'file_path', 'captured_at', 'description']
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
 * Get incident history for owner console
 * Returns all incidents regardless of building_id with timeline data
 */
exports.getIncidentHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 100,
      status,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Apply status filter if provided
    if (status && status !== 'ALL') {
      if (status === 'UNACKNOWLEDGED') {
        where.status = 'DETECTED';
      } else if (status === 'ACKNOWLEDGED') {
        where.status = { [Op.in]: ['VERIFIED', 'DISPATCHED', 'RESPONDING', 'ON_SCENE'] };
      } else if (status === 'RESOLVED') {
        where.status = { [Op.in]: ['CONTAINED', 'RESOLVED', 'CLOSED', 'FALSE_ALARM'] };
      }
    }

    // Apply search filter if provided (incident_number or building name)
    if (search && search.trim() !== '') {
      where[Op.or] = [
        { incident_number: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
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
          attributes: ['id', 'name', 'building_code'],
          include: [{
            model: Address,
            as: 'address',
            attributes: ['address_line_1', 'city', 'state']
          }]
        },
        {
          model: Camera,
          as: 'detected_by_camera',
          attributes: ['id', 'camera_code', 'name']
        },
        {
          model: IncidentTimeline,
          as: 'timeline',
          order: [['occurred_at', 'ASC']],
          limit: 10
        },
        {
          model: Evidence,
          as: 'evidence',
          limit: 1,
          order: [['captured_at', 'ASC']],
          attributes: ['id', 'file_path', 'file_name']
        }
      ]
    });

    // Transform data for frontend
    const transformedIncidents = incidents.map(incident => {
      const building = incident.building;
      const address = building?.address;
      
      return {
        id: incident.incident_number,
        incident_id: incident.id,
        incident_number: incident.incident_number,
        type: incident.incident_type,
        location: building ? `${building.name}` : 'Unknown Location',
        building_id: incident.building_id,
        building_name: building?.name,
        building_code: building?.building_code,
        address: address ? `${address.address_line_1}, ${address.city}` : null,
        camera: incident.detected_by_camera?.camera_code || 'Unknown',
        severity: incident.severity,
        confidence: Math.round((incident.confidence_score || 0) * 100),
        status: incident.status === 'DETECTED' ? 'UNACKNOWLEDGED' : 
                incident.status === 'VERIFIED' || incident.status === 'DISPATCHED' ? 'ACKNOWLEDGED' : 
                'RESOLVED',
        created: new Date(incident.detected_at).toLocaleString('en-US', { 
          month: 'short', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        detected_at: incident.detected_at,
        acknowledged_at: incident.acknowledged_at,
        resolved_at: incident.resolved_at,
        description: incident.description,
        timeline: incident.timeline || [],
        image: incident.evidence?.[0]?.file_path || null,
        dashboard_url: incident.dashboard_url
      };
    });

    res.json({
      success: true,
      data: {
        incidents: transformedIncidents,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching incident history:', error);
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
 * Get incident by incident number with full relations
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
          include: [
            {
              model: Address,
              as: 'address',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'longitude']
                ]
              }
            },
            {
              model: Address,
              as: 'nearestFireStation',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'longitude']
                ]
              }
            }
          ]
        },
        {
          model: Camera,
          as: 'detected_by_camera',
          include: [
            {
              model: Building,
              as: 'building',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: IncidentDetection,
          as: 'detections',
          order: [['detected_at', 'ASC']],
          limit: 100
        },
        {
          model: Evidence,
          as: 'evidence',
          order: [['captured_at', 'ASC']],
          attributes: [
            'id', 'evidence_type', 'file_name', 'file_path', 
            'mime_type', 'file_size_bytes', 'captured_at', 
            'source_type', 'description', 'camera_id'
          ]
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

/**
 * Get full incident details for dashboard display
 * Includes all relations: building, address, fire station, cameras, evidence, detections
 */
exports.getIncidentDashboardData = async (req, res, next) => {
  try {
    const { incident_number } = req.params;

    const incident = await Incident.findOne({
      where: { incident_number },
      include: [
        {
          model: Building,
          as: 'building',
          include: [
            {
              model: Address,
              as: 'address',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'longitude']
                ]
              }
            },
            {
              model: Address,
              as: 'nearestFireStation',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'longitude']
                ]
              }
            }
          ]
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
          where: { evidence_type: 'CCTV_FRAME' },
          required: false,
          order: [['captured_at', 'ASC']],
          attributes: [
            'id', 'evidence_type', 'file_name', 'file_path', 
            'mime_type', 'captured_at', 'source_type', 'description'
          ]
        }
      ]
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Format the response with dashboard-specific data
    const dashboardData = {
      incident: {
        id: incident.id,
        incident_number: incident.incident_number,
        incident_type: incident.incident_type,
        status: incident.status,
        severity: incident.severity,
        priority: incident.priority,
        description: incident.description,
        detected_at: incident.detected_at,
        confidence_score: incident.confidence_score,
        dashboard_url: incident.dashboard_url
      },
      building: incident.building ? {
        id: incident.building.id,
        name: incident.building.name,
        building_type: incident.building.building_type,
        number_of_floors: incident.building.number_of_floors,
        total_area: incident.building.total_area,
        height: incident.building.height,
        has_fire_alarm: incident.building.has_fire_alarm,
        has_sprinkler: incident.building.has_sprinkler,
        has_fire_extinguishers: incident.building.has_fire_extinguishers,
        address: incident.building.address ? {
          address_line_1: incident.building.address.address_line_1,
          address_line_2: incident.building.address.address_line_2,
          locality: incident.building.address.locality,
          city: incident.building.address.city,
          district: incident.building.address.district,
          state: incident.building.address.state,
          postal_code: incident.building.address.postal_code,
          latitude: incident.building.address.dataValues.latitude,
          longitude: incident.building.address.dataValues.longitude
        } : null,
        nearest_fire_station: incident.building.nearestFireStation ? {
          fire_station_name: incident.building.nearestFireStation.fire_station_name,
          address_line_1: incident.building.nearestFireStation.address_line_1,
          phone: incident.building.nearestFireStation.fire_station_name ? '101' : null,
          distance_km: incident.building.fire_station_distance_km,
          latitude: incident.building.nearestFireStation.dataValues.latitude,
          longitude: incident.building.nearestFireStation.dataValues.longitude
        } : null
      } : null,
      camera: incident.detected_by_camera ? {
        id: incident.detected_by_camera.id,
        camera_code: incident.detected_by_camera.camera_code,
        name: incident.detected_by_camera.name,
        camera_type: incident.detected_by_camera.camera_type,
        floor_number: incident.detected_by_camera.floor_number,
        room_name: incident.detected_by_camera.room_name,
        location_description: incident.detected_by_camera.location_description
      } : null,
      detections: incident.detections || [],
      evidence_frames: incident.evidence || []
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching incident dashboard data:', error);
    next(error);
  }
};

/**
 * Get active fire alerts for real-time monitoring
 * Returns unacknowledged fire incidents for building_id = 1 (demo)
 */
exports.getActiveFireAlerts = async (req, res, next) => {
  try {
    // For demo purposes, hardcoded to building_id = 1
    // In production, this would filter by user's owned buildings
    const targetBuildingId = 1;

    const activeAlerts = await Incident.findAll({
      where: {
        building_id: targetBuildingId,
        incident_type: 'FIRE',
        status: 'DETECTED'
      },
      include: [
        {
          model: Building,
          as: 'building',
          attributes: ['id', 'name', 'building_code', 'building_type']
        },
        {
          model: Camera,
          as: 'detected_by_camera',
          attributes: ['id', 'camera_code', 'name', 'floor_number', 'room_name']
        }
      ],
      order: [['detected_at', 'DESC']],
      limit: 10
    });

    // Format simplified response for alerts
    const formattedAlerts = activeAlerts.map(incident => ({
      id: incident.id,
      incident_number: incident.incident_number,
      building_id: incident.building_id,
      building_name: incident.building ? incident.building.name : 'Unknown Building',
      building_code: incident.building ? incident.building.building_code : null,
      severity: incident.severity,
      priority: incident.priority,
      confidence_score: incident.confidence_score,
      detected_at: incident.detected_at,
      camera_code: incident.detected_by_camera ? incident.detected_by_camera.camera_code : null,
      camera_location: incident.detected_by_camera ? 
        `${incident.detected_by_camera.floor_number ? `Floor ${incident.detected_by_camera.floor_number}` : ''} ${incident.detected_by_camera.room_name || ''}`.trim() 
        : null,
      dashboard_url: incident.dashboard_url
    }));

    res.json({
      success: true,
      count: formattedAlerts.length,
      data: formattedAlerts
    });

  } catch (error) {
    console.error('Error fetching active fire alerts:', error);
    next(error);
  }
};

/**
 * Acknowledge incident alert
 * If acknowledged within 45 seconds, automatically sends email to fire department
 */
exports.acknowledgeIncident = async (req, res, next) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findByPk(id, {
      include: [
        {
          model: Building,
          as: 'building',
          include: [
            {
              model: Address,
              as: 'address',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'longitude']
                ]
              }
            },
            {
              model: Address,
              as: 'nearestFireStation',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'longitude']
                ]
              }
            }
          ]
        }
      ]
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    const acknowledgedAt = new Date();
    const detectedAt = new Date(incident.detected_at);
    const timeDiffSeconds = (acknowledgedAt - detectedAt) / 1000;

    console.log(`📋 Acknowledging incident ${incident.incident_number}`);
    console.log(`⏱️  Time since detection: ${timeDiffSeconds.toFixed(1)} seconds`);

    // Update incident with acknowledgment timestamp
    await incident.update({
      acknowledged_at: acknowledgedAt,
      status: 'VERIFIED' // Change from DETECTED to VERIFIED on acknowledgment
    });

    // Create timeline entry for acknowledgment
    await IncidentTimeline.create({
      incident_id: incident.id,
      event_type: 'INCIDENT_ACKNOWLEDGED',
      description: `Incident acknowledged by building owner after ${timeDiffSeconds.toFixed(0)} seconds`,
      actor_type: 'USER',
      actor_user_id: null, // In production, this would be the logged-in user
      metadata: {
        time_to_acknowledge_seconds: timeDiffSeconds,
        acknowledged_at: acknowledgedAt
      },
      occurred_at: acknowledgedAt
    });

    // Check if acknowledged within 45 seconds - if yes, send email to fire department
    let emailResult = null;
    if (timeDiffSeconds <= 45) {
      console.log(`🚨 Alert acknowledged within 45 seconds - sending email to fire department`);
      
      const emailService = require('../services/email.service');
      
      // Build full dashboard URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const dashboardUrl = `${frontendUrl}/${incident.dashboard_url}`;

      // Prepare building data for email
      const buildingData = {
        name: incident.building?.name || 'Unknown Building',
        building_type: incident.building?.building_type,
        number_of_floors: incident.building?.number_of_floors,
        total_area: incident.building?.total_area,
        height: incident.building?.height,
        has_fire_alarm: incident.building?.has_fire_alarm,
        has_sprinkler: incident.building?.has_sprinkler,
        has_fire_extinguishers: incident.building?.has_fire_extinguishers,
        fire_station_distance_km: incident.building?.fire_station_distance_km,
        address: incident.building?.address ? {
          address_line_1: incident.building.address.address_line_1,
          address_line_2: incident.building.address.address_line_2,
          locality: incident.building.address.locality,
          city: incident.building.address.city,
          district: incident.building.address.district,
          state: incident.building.address.state,
          postal_code: incident.building.address.postal_code
        } : null,
        nearest_fire_station: incident.building?.nearestFireStation ? {
          fire_station_name: incident.building.nearestFireStation.fire_station_name,
          address_line_1: incident.building.nearestFireStation.address_line_1,
          phone: '101'
        } : null
      };

      // Send email
      emailResult = await emailService.sendFireDepartmentAlert(
        {
          incident_number: incident.incident_number,
          severity: incident.severity,
          detected_at: incident.detected_at,
          confidence_score: incident.confidence_score
        },
        buildingData,
        dashboardUrl
      );

      if (emailResult.success) {
        console.log(`✅ Fire department email sent successfully to ${emailResult.recipient}`);
        
        // Create timeline entry for email notification
        await IncidentTimeline.create({
          incident_id: incident.id,
          event_type: 'NOTIFICATION_SENT',
          description: `Fire department notified via email (acknowledged within 45s)`,
          actor_type: 'SYSTEM',
          actor_user_id: null,
          metadata: {
            notification_type: 'EMAIL',
            recipient: emailResult.recipient,
            message_id: emailResult.messageId,
            trigger: 'EARLY_ACKNOWLEDGMENT'
          },
          occurred_at: new Date()
        });
      } else {
        console.error(`❌ Failed to send fire department email: ${emailResult.error}`);
        
        // Create timeline entry for failed notification
        await IncidentTimeline.create({
          incident_id: incident.id,
          event_type: 'NOTIFICATION_FAILED',
          description: `Failed to notify fire department: ${emailResult.error}`,
          actor_type: 'SYSTEM',
          actor_user_id: null,
          metadata: {
            notification_type: 'EMAIL',
            error: emailResult.error,
            trigger: 'EARLY_ACKNOWLEDGMENT'
          },
          occurred_at: new Date()
        });
      }
    } else {
      console.log(`ℹ️  Alert acknowledged after ${timeDiffSeconds.toFixed(1)}s - no automatic email (> 45s threshold)`);
    }

    res.json({
      success: true,
      message: 'Incident acknowledged successfully',
      data: {
        incident: {
          id: incident.id,
          incident_number: incident.incident_number,
          acknowledged_at: acknowledgedAt,
          time_to_acknowledge_seconds: timeDiffSeconds
        },
        email_sent: emailResult ? emailResult.success : false,
        email_recipient: emailResult?.recipient || null,
        within_threshold: timeDiffSeconds <= 45
      }
    });

  } catch (error) {
    console.error('Error acknowledging incident:', error);
    next(error);
  }
};

/**
 * Auto-escalate incident (timer expired without acknowledgment)
 * Sends email to fire department automatically
 */
exports.escalateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findByPk(id, {
      include: [
        {
          model: Building,
          as: 'building',
          include: [
            {
              model: Address,
              as: 'address',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.address.location'), 'geometry')), 'longitude']
                ]
              }
            },
            {
              model: Address,
              as: 'nearestFireStation',
              attributes: {
                include: [
                  [sequelize.fn('ST_Y', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'latitude'],
                  [sequelize.fn('ST_X', sequelize.cast(sequelize.col('building.nearestFireStation.location'), 'geometry')), 'longitude']
                ]
              }
            }
          ]
        }
      ]
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    const escalatedAt = new Date();
    const detectedAt = new Date(incident.detected_at);
    const timeDiffSeconds = (escalatedAt - detectedAt) / 1000;

    console.log(`🚨 AUTO-ESCALATING incident ${incident.incident_number}`);
    console.log(`⏰ Timer expired - no acknowledgment after ${timeDiffSeconds.toFixed(1)} seconds`);

    // Update incident status to ESCALATED
    await incident.update({
      status: 'ESCALATED',
      // Don't set acknowledged_at since owner never acknowledged
    });

    // Create timeline entry for auto-escalation
    await IncidentTimeline.create({
      incident_id: incident.id,
      event_type: 'INCIDENT_ESCALATED',
      description: `Incident auto-escalated after ${timeDiffSeconds.toFixed(0)} seconds - no owner acknowledgment`,
      actor_type: 'SYSTEM',
      actor_user_id: null,
      metadata: {
        escalation_reason: 'TIMER_EXPIRED',
        time_since_detection_seconds: timeDiffSeconds,
        timer_duration: 45,
        escalated_at: escalatedAt
      },
      occurred_at: escalatedAt
    });

    // Send email to fire department
    console.log(`📧 Sending fire department alert email (auto-escalation)...`);
    
    const emailService = require('../services/email.service');
    
    // Build full dashboard URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const dashboardUrl = `${frontendUrl}/${incident.dashboard_url}`;

    // Prepare building data for email
    const buildingData = {
      name: incident.building?.name || 'Unknown Building',
      building_type: incident.building?.building_type,
      number_of_floors: incident.building?.number_of_floors,
      total_area: incident.building?.total_area,
      height: incident.building?.height,
      has_fire_alarm: incident.building?.has_fire_alarm,
      has_sprinkler: incident.building?.has_sprinkler,
      has_fire_extinguishers: incident.building?.has_fire_extinguishers,
      fire_station_distance_km: incident.building?.fire_station_distance_km,
      address: incident.building?.address ? {
        address_line_1: incident.building.address.address_line_1,
        address_line_2: incident.building.address.address_line_2,
        locality: incident.building.address.locality,
        city: incident.building.address.city,
        district: incident.building.address.district,
        state: incident.building.address.state,
        postal_code: incident.building.address.postal_code
      } : null,
      nearest_fire_station: incident.building?.nearestFireStation ? {
        fire_station_name: incident.building.nearestFireStation.fire_station_name,
        address_line_1: incident.building.nearestFireStation.address_line_1,
        phone: '101'
      } : null
    };

    // Modify incident data to indicate auto-escalation
    const incidentData = {
      incident_number: incident.incident_number,
      severity: incident.severity,
      detected_at: incident.detected_at,
      confidence_score: incident.confidence_score,
      escalation_type: 'AUTO_ESCALATED',
      escalation_reason: 'No owner response within 45 seconds'
    };

    // Send email
    const emailResult = await emailService.sendFireDepartmentAlert(
      incidentData,
      buildingData,
      dashboardUrl
    );

    if (emailResult.success) {
      console.log(`✅ Fire department email sent successfully to ${emailResult.recipient}`);
      
      // Create timeline entry for email notification
      await IncidentTimeline.create({
        incident_id: incident.id,
        event_type: 'NOTIFICATION_SENT',
        description: `Fire department notified via email (auto-escalation - timer expired)`,
        actor_type: 'SYSTEM',
        actor_user_id: null,
        metadata: {
          notification_type: 'EMAIL',
          recipient: emailResult.recipient,
          message_id: emailResult.messageId,
          trigger: 'AUTO_ESCALATION',
          timer_expired: true
        },
        occurred_at: new Date()
      });
    } else {
      console.error(`❌ Failed to send fire department email: ${emailResult.error}`);
      
      // Create timeline entry for failed notification
      await IncidentTimeline.create({
        incident_id: incident.id,
        event_type: 'NOTIFICATION_FAILED',
        description: `Failed to notify fire department: ${emailResult.error}`,
        actor_type: 'SYSTEM',
        actor_user_id: null,
        metadata: {
          notification_type: 'EMAIL',
          error: emailResult.error,
          trigger: 'AUTO_ESCALATION',
          timer_expired: true
        },
        occurred_at: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Incident auto-escalated successfully',
      data: {
        incident: {
          id: incident.id,
          incident_number: incident.incident_number,
          escalated_at: escalatedAt,
          time_since_detection_seconds: timeDiffSeconds
        },
        email_sent: emailResult ? emailResult.success : false,
        email_recipient: emailResult?.recipient || null,
        escalation_reason: 'TIMER_EXPIRED'
      }
    });

  } catch (error) {
    console.error('Error auto-escalating incident:', error);
    next(error);
  }
};
