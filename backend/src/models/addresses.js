/**
 * Addresses Model
 * 
 * Reusable physical address and geographic information.
 */

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    address_line_1: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    address_line_2: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    landmark: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    locality: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'India'
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    location: {
      type: DataTypes.GEOGRAPHY('POINT', 4326),
      allowNull: false,
      comment: 'PostGIS geography point (latitude, longitude)'
    },
    address_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['BUILDING', 'FIRE_STATION', 'ORGANIZATION', 'OTHER']]
      },
      comment: 'Type of address: BUILDING, FIRE_STATION, ORGANIZATION, OTHER'
    },
    fire_station_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Name of fire station (if address_type is FIRE_STATION)'
    }
  }, {
    tableName: 'addresses',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        type: 'GIST',
        fields: ['location']
      },
      {
        fields: ['city', 'district']
      },
      {
        fields: ['postal_code']
      }
    ]
  });

  Address.associate = (models) => {
    // Address is used by buildings
    Address.hasMany(models.Building, {
      foreignKey: 'address_id',
      as: 'buildings'
    });

    // Address can be used by fire stations
    Address.hasMany(models.FireStation, {
      foreignKey: 'address_id',
      as: 'fire_stations'
    });

    // Address can be used by organizations
    Address.hasMany(models.Organization, {
      foreignKey: 'address_id',
      as: 'organizations'
    });
  };

  return Address;
};

