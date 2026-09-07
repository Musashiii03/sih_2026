/**
 * Buildings Model
 * 
 * Stores registered buildings monitored by the system.
 */

module.exports = (sequelize, DataTypes) => {
  const Building = sequelize.define('Building', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    building_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    building_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'RESIDENTIAL', 'APARTMENT', 'OFFICE', 'MALL', 'HOTEL',
          'HOSPITAL', 'SCHOOL', 'WAREHOUSE', 'FACTORY', 'GOVERNMENT', 'OTHER'
        ]]
      }
    },
    address_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'addresses',
        key: 'id'
      }
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      comment: 'Organization that owns or manages this building'
    },
    number_of_floors: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    number_of_units: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    construction_year: {
      type: DataTypes.SMALLINT,
      allowNull: true
    },
    total_area: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Total area in square meters'
    },
    height: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Height in meters'
    },
    occupancy_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED']]
      }
    },
    has_fire_alarm: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    has_sprinkler: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    has_fire_extinguishers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    has_fire_exit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    has_fire_hydrant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    nearest_fire_station_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id'
      },
      comment: 'Foreign key to addresses table storing nearest fire station location'
    },
    fire_station_distance_km: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Distance to nearest fire station in kilometers'
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'DEMOLISHED']]
      }
    }
  }, {
    tableName: 'buildings',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['building_code']
      },
      {
        fields: ['building_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['address_id']
      }
    ]
  });

  Building.associate = (models) => {
    // Building belongs to an address
    Building.belongsTo(models.Address, {
      foreignKey: 'address_id',
      as: 'address'
    });

    // Building belongs to an organization
    Building.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });

    // Building has nearest fire station (address)
    Building.belongsTo(models.Address, {
      foreignKey: 'nearest_fire_station_id',
      as: 'nearestFireStation'
    });

    // Building has many units
    Building.hasMany(models.BuildingUnit, {
      foreignKey: 'building_id',
      as: 'units'
    });

    // Building has many cameras
    Building.hasMany(models.Camera, {
      foreignKey: 'building_id',
      as: 'cameras'
    });

    // Building has many incidents
    Building.hasMany(models.Incident, {
      foreignKey: 'building_id',
      as: 'incidents'
    });

    // Building has many owners (through ownerships)
    Building.belongsToMany(models.Owner, {
      through: models.Ownership,
      foreignKey: 'building_id',
      otherKey: 'owner_id',
      as: 'owners'
    });
  };

  return Building;
};

