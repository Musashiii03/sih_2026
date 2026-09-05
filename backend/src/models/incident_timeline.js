/**
 * Incident Timeline Model
 * 
 * Chronological history of important incident events.
 */

module.exports = (sequelize, DataTypes) => {
  const IncidentTimeline = sequelize.define('IncidentTimeline', {
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
    event_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'INCIDENT_CREATED', 'FIRE_DETECTED', 'SMOKE_DETECTED', 'PERSON_DETECTED',
          'EVIDENCE_ADDED', 'LOCATION_UPDATED', 'STATION_IDENTIFIED',
          'NOTIFICATION_SENT', 'NOTIFICATION_FAILED', 'DISPATCH_CREATED',
          'DISPATCH_ACKNOWLEDGED', 'UNIT_DISPATCHED', 'UNIT_ARRIVED',
          'INCIDENT_RESOLVED'
        ]]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    actor_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['SYSTEM', 'AI', 'USER', 'DISPATCHER', 'RESPONDER']]
      }
    },
    actor_user_id: {
      type: DataTypes.INTEGER, allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional event-specific data'
    },
    occurred_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'incident_timeline',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['incident_id', 'occurred_at']
      },
      {
        fields: ['event_type']
      },
      {
        fields: ['actor_user_id']
      }
    ]
  });

  IncidentTimeline.associate = (models) => {
    // Timeline event belongs to an incident
    IncidentTimeline.belongsTo(models.Incident, {
      foreignKey: 'incident_id',
      as: 'incident'
    });

    // Timeline event can have an actor user
    IncidentTimeline.belongsTo(models.User, {
      foreignKey: 'actor_user_id',
      as: 'actor'
    });
  };

  return IncidentTimeline;
};

