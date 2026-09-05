/**
 * Evidence Model
 * 
 * Metadata for incident images, videos, reports, floor plans, and 3D files.
 */

module.exports = (sequelize, DataTypes) => {
  const Evidence = sequelize.define('Evidence', {
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
    evidence_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['IMAGE', 'VIDEO', 'CCTV_FRAME', '3D_MODEL', 'FLOOR_PLAN', 'DOCUMENT', 'AI_REPORT']]
      }
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_path: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Local storage path or cloud storage key'
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    file_size_bytes: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    captured_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    source_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['CAMERA', 'AI', 'USER', 'SYSTEM']]
      }
    },
    camera_id: {
      type: DataTypes.INTEGER,
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
    checksum: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: 'SHA-256 hash for integrity verification'
    }
  }, {
    tableName: 'evidence',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['incident_id']
      },
      {
        fields: ['evidence_type']
      },
      {
        fields: ['camera_id']
      },
      {
        fields: ['captured_at']
      }
    ]
  });

  Evidence.associate = (models) => {
    // Evidence belongs to an incident
    Evidence.belongsTo(models.Incident, {
      foreignKey: 'incident_id',
      as: 'incident'
    });

    // Evidence can be from a camera
    Evidence.belongsTo(models.Camera, {
      foreignKey: 'camera_id',
      as: 'camera'
    });
  };

  return Evidence;
};

