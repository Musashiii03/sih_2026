/**
 * Fire Stations Model
 * 
 * Stores fire station information for dispatch and routing.
 */

module.exports = (sequelize, DataTypes) => {
  const FireStation = sequelize.define('FireStation', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    station_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    station_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g., MAIN, SATELLITE, VOLUNTEER'
    },
    address_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: {
        model: 'addresses',
        key: 'id'
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    emergency_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of vehicles or personnel'
    },
    operational_hours: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'e.g., 24/7, 8AM-8PM'
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'OPERATIONAL',
      validate: {
        isIn: [['OPERATIONAL', 'MAINTENANCE', 'INACTIVE']]
      }
    }
  }, {
    tableName: 'fire_stations',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['station_code']
      },
      {
        fields: ['status']
      },
      {
        fields: ['address_id']
      }
    ]
  });

  FireStation.associate = (models) => {
    // Fire station has an address
    FireStation.belongsTo(models.Address, {
      foreignKey: 'address_id',
      as: 'address'
    });

    // Fire station can receive notifications
    FireStation.hasMany(models.Notification, {
      foreignKey: 'recipient_station_id',
      as: 'notifications'
    });

    // Fire station has emergency contacts
    FireStation.hasMany(models.EmergencyContact, {
      foreignKey: 'station_id',
      as: 'emergency_contacts'
    });

    // Fire station has dispatches
    FireStation.hasMany(models.Dispatch, {
      foreignKey: 'fire_station_id',
      as: 'dispatches'
    });
  };

  return FireStation;
};

