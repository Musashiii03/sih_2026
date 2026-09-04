/**
 * Notifications Model
 * 
 * Records emergency notifications sent through configured channels.
 */

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    incident_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'incidents',
        key: 'id'
      }
    },
    notification_type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        isIn: [['INCIDENT_ALERT', 'DISPATCH_ALERT', 'STATUS_UPDATE', 'SYSTEM_ALERT']]
      }
    },
    channel: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['VOICE', 'SMS', 'EMAIL', 'PUSH', 'WEBHOOK']]
      }
    },
    recipient_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recipient_station_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'fire_stations',
        key: 'id'
      }
    },
    recipient_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Phone number, email, or webhook URL'
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'MEDIUM',
      validate: {
        isIn: [['LOW', 'MEDIUM', 'HIGH', 'URGENT']]
      }
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED']]
      }
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['incident_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['channel']
      },
      {
        fields: ['recipient_user_id']
      },
      {
        fields: ['recipient_station_id']
      },
      {
        fields: ['scheduled_at']
      }
    ]
  });

  Notification.associate = (models) => {
    // Notification can belong to an incident
    Notification.belongsTo(models.Incident, {
      foreignKey: 'incident_id',
      as: 'incident'
    });

    // Notification can be sent to a user
    Notification.belongsTo(models.User, {
      foreignKey: 'recipient_user_id',
      as: 'recipient_user'
    });

    // Notification can be sent to a fire station
    Notification.belongsTo(models.FireStation, {
      foreignKey: 'recipient_station_id',
      as: 'recipient_station'
    });
  };

  return Notification;
};
