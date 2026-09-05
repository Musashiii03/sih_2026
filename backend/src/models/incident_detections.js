/**
 * Incident Detections Model
 * 
 * Stores individual AI detections associated with an incident.
 */

module.exports = (sequelize, DataTypes) => {
  const IncidentDetection = sequelize.define('IncidentDetection', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    incident_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'incidents',
        key: 'id'
      }
    },
    camera_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cameras',
        key: 'id'
      }
    },
    detection_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['FIRE', 'SMOKE', 'PERSON', 'VEHICLE']]
      }
    },
    confidence_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      validate: {
        min: 0,
        max: 1
      }
    },
    detected_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    floor_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    room_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    bounding_box: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'JSON with x, y, width, height coordinates'
    },
    frame_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    frame_index: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fire_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    human_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    object_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    image_path: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Path to the frame image'
    },
    metadata_path: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Path to the detection metadata JSON'
    },
    model_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'AI model used for detection'
    },
    model_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'incident_detections',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['incident_id']
      },
      {
        fields: ['camera_id']
      },
      {
        fields: ['detection_type']
      },
      {
        fields: ['detected_at']
      }
    ]
  });

  IncidentDetection.associate = (models) => {
    // Detection belongs to an incident
    IncidentDetection.belongsTo(models.Incident, {
      foreignKey: 'incident_id',
      as: 'incident'
    });

    // Detection belongs to a camera
    IncidentDetection.belongsTo(models.Camera, {
      foreignKey: 'camera_id',
      as: 'camera'
    });

    // Detection can have people records
    IncidentDetection.hasMany(models.IncidentPeople, {
      foreignKey: 'detection_id',
      as: 'people'
    });
  };

  return IncidentDetection;
};

