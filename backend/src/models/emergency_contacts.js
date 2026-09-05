/**
 * Emergency Contacts Model
 * 
 * Stores authorized emergency communication endpoints for organizations or fire stations.
 */

module.exports = (sequelize, DataTypes) => {
  const EmergencyContact = sequelize.define('EmergencyContact', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    organization_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    station_id: {
      type: DataTypes.INTEGER, allowNull: true,
      references: {
        model: 'fire_stations',
        key: 'id'
      }
    },
    contact_type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        isIn: [['EMERGENCY_DISPATCH', 'FIRE_CONTROL_ROOM', 'FIRE_STATION']]
      }
    },
    channel: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['VOICE', 'SMS', 'EMAIL', 'WEBHOOK', 'API']]
      }
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    endpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Phone, email, URL, etc.'
    },
    is_authorized: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'INACTIVE', 'SUSPENDED']]
      }
    }
  }, {
    tableName: 'emergency_contacts',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['organization_id']
      },
      {
        fields: ['station_id']
      },
      {
        fields: ['contact_type']
      },
      {
        fields: ['channel']
      },
      {
        fields: ['status']
      },
      {
        fields: ['is_authorized']
      }
    ]
  });

  EmergencyContact.associate = (models) => {
    // Emergency contact belongs to an organization
    EmergencyContact.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });

    // Emergency contact can belong to a fire station
    EmergencyContact.belongsTo(models.FireStation, {
      foreignKey: 'station_id',
      as: 'station'
    });
  };

  return EmergencyContact;
};

