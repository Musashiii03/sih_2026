/**
 * Building Units Model
 * 
 * Represents apartments, rooms, offices, shops, classrooms, etc.
 */

module.exports = (sequelize, DataTypes) => {
  const BuildingUnit = sequelize.define('BuildingUnit', {
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
    unit_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    floor_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['APARTMENT', 'OFFICE', 'SHOP', 'ROOM', 'WAREHOUSE', 'CLASSROOM']]
      }
    },
    area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Area in square meters'
    },
    occupancy_capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum number of people'
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'VACANT',
      validate: {
        isIn: [['OCCUPIED', 'VACANT', 'UNDER_MAINTENANCE', 'INACTIVE']]
      }
    }
  }, {
    tableName: 'building_units',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['building_id']
      },
      {
        fields: ['unit_number', 'building_id']
      },
      {
        fields: ['floor_number']
      },
      {
        fields: ['status']
      }
    ]
  });

  BuildingUnit.associate = (models) => {
    // Building unit belongs to a building
    BuildingUnit.belongsTo(models.Building, {
      foreignKey: 'building_id',
      as: 'building'
    });

    // Building unit can have cameras
    BuildingUnit.hasMany(models.Camera, {
      foreignKey: 'building_unit_id',
      as: 'cameras'
    });

    // Building unit can have incidents
    BuildingUnit.hasMany(models.Incident, {
      foreignKey: 'building_unit_id',
      as: 'incidents'
    });
  };

  return BuildingUnit;
};
