/**
 * Cameras Model
 * 
 * CCTV cameras installed in a building or specific unit.
 */

module.exports = (sequelize, DataTypes) => {
  const Camera = sequelize.define('Camera', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    building_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
    camera_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    camera_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['FIXED', 'PTZ', 'THERMAL', 'DOME', 'BULLET']]
      }
    },
    floor_number: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    room_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    location_description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    direction: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'e.g., North-facing, pointing at entrance'
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'ONLINE',
      validate: {
        isIn: [['ONLINE', 'OFFLINE', 'MAINTENANCE', 'INACTIVE']]
      }
    },
    installed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_seen_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'cameras',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['camera_code']
      },
      {
        fields: ['building_id']
      },
      {
        fields: ['building_unit_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['camera_type']
      }
    ]
  });

  Camera.associate = (models) => {
    // Camera belongs to a building
    Camera.belongsTo(models.Building, {
      foreignKey: 'building_id',
      as: 'building'
    });

    // Camera can belong to a building unit
    Camera.belongsTo(models.BuildingUnit, {
      foreignKey: 'building_unit_id',
      as: 'building_unit'
    });

    // Camera can detect incidents
    Camera.hasMany(models.Incident, {
      foreignKey: 'detected_by_camera_id',
      as: 'detected_incidents'
    });

    // Camera has many detections
    Camera.hasMany(models.IncidentDetection, {
      foreignKey: 'camera_id',
      as: 'detections'
    });

    // Camera can be source of evidence
    Camera.hasMany(models.Evidence, {
      foreignKey: 'camera_id',
      as: 'evidence'
    });
  };

  return Camera;
};
