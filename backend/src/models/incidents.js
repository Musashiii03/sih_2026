/**
 * Incidents Model
 * 
 * Central record for every detected or reported fire-related incident.
 */

module.exports = (sequelize, DataTypes) => {
  const Incident = sequelize.define('Incident', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    incident_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    incident_type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        isIn: [['FIRE', 'SMOKE', 'FALSE_ALARM', 'FIRE_HAZARD', 'OTHER']]
      }
    },
    source_type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        isIn: [['CCTV_AI', 'CITIZEN', 'SECURITY_GUARD', 'FIRE_DEPARTMENT', 'MANUAL', 'SENSOR']]
      }
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'DETECTED',
      validate: {
        isIn: [[
          'DETECTED', 'REPORTED', 'VERIFIED', 'DISPATCHED', 'RESPONDING',
          'ON_SCENE', 'CONTAINED', 'RESOLVED', 'FALSE_ALARM', 'CLOSED'
        ]]
      }
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']]
      }
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['LOW', 'MEDIUM', 'HIGH', 'URGENT']]
      }
    },
    building_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'buildings',
        key: 'id'
      }
    },
    building_unit_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'building_units',
        key: 'id'
      }
    },
    reported_by_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    detected_by_camera_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'cameras',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    detected_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    reported_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: false,
      comment: 'Geographic location of the incident'
    },
    confidence_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      }
    }
  }, {
    tableName: 'incidents',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['incident_number']
      },
      {
        fields: ['status']
      },
      {
        fields: ['severity']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['incident_type']
      },
      {
        fields: ['building_id']
      },
      {
        fields: ['detected_at']
      },
      {
        type: 'GIST',
        fields: ['location']
      }
    ]
  });

  Incident.associate = (models) => {
    // Incident belongs to a building
    Incident.belongsTo(models.Building, {
      foreignKey: 'building_id',
      as: 'building'
    });

    // Incident can belong to a building unit
    Incident.belongsTo(models.BuildingUnit, {
      foreignKey: 'building_unit_id',
      as: 'building_unit'
    });

    // Incident can be reported by a user
    Incident.belongsTo(models.User, {
      foreignKey: 'reported_by_user_id',
      as: 'reported_by'
    });

    // Incident can be detected by a camera
    Incident.belongsTo(models.Camera, {
      foreignKey: 'detected_by_camera_id',
      as: 'detected_by_camera'
    });

    // Incident has many detections
    Incident.hasMany(models.IncidentDetection, {
      foreignKey: 'incident_id',
      as: 'detections'
    });

    // Incident has people detected
    Incident.hasMany(models.IncidentPeople, {
      foreignKey: 'incident_id',
      as: 'people'
    });

    // Incident has evidence
    Incident.hasMany(models.Evidence, {
      foreignKey: 'incident_id',
      as: 'evidence'
    });

    // Incident has timeline
    Incident.hasMany(models.IncidentTimeline, {
      foreignKey: 'incident_id',
      as: 'timeline'
    });

    // Incident has notifications
    Incident.hasMany(models.Notification, {
      foreignKey: 'incident_id',
      as: 'notifications'
    });

    // Incident has dispatches
    Incident.hasMany(models.Dispatch, {
      foreignKey: 'incident_id',
      as: 'dispatches'
    });
  };

  return Incident;
};
