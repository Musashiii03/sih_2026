/**
 * Incident People Model
 * 
 * Stores estimated people detected during an incident without requiring identity.
 */

module.exports = (sequelize, DataTypes) => {
  const IncidentPeople = sequelize.define('IncidentPeople', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    incident_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: {
        model: 'incidents',
        key: 'id'
      }
    },
    detection_id: {
      type: DataTypes.INTEGER, allowNull: true,
      references: {
        model: 'incident_detections',
        key: 'id'
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
    estimated_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'DETECTED',
      validate: {
        isIn: [['DETECTED', 'POSSIBLY_TRAPPED', 'EVACUATED', 'RESCUED', 'UNKNOWN']]
      }
    },
    confidence_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      }
    },
    first_detected_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    last_detected_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'incident_people',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['incident_id']
      },
      {
        fields: ['detection_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  IncidentPeople.associate = (models) => {
    // People record belongs to an incident
    IncidentPeople.belongsTo(models.Incident, {
      foreignKey: 'incident_id',
      as: 'incident'
    });

    // People record can belong to a detection
    IncidentPeople.belongsTo(models.IncidentDetection, {
      foreignKey: 'detection_id',
      as: 'detection'
    });
  };

  return IncidentPeople;
};

