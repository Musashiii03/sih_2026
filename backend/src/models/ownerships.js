/**
 * Ownerships Model
 * 
 * Many-to-many relationship between buildings and owners, including ownership history.
 */

module.exports = (sequelize, DataTypes) => {
  const Ownership = sequelize.define('Ownership', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    building_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: {
        model: 'buildings',
        key: 'id'
      }
    },
    owner_id: {
      type: DataTypes.INTEGER, allowNull: false,
      references: {
        model: 'owners',
        key: 'id'
      }
    },
    ownership_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['FULL', 'PARTIAL', 'JOINT']]
      }
    },
    ownership_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'ownerships',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['building_id']
      },
      {
        fields: ['owner_id']
      },
      {
        fields: ['start_date', 'end_date']
      },
      {
        fields: ['is_primary']
      }
    ]
  });

  Ownership.associate = (models) => {
    // Ownership belongs to a building
    Ownership.belongsTo(models.Building, {
      foreignKey: 'building_id',
      as: 'building'
    });

    // Ownership belongs to an owner
    Ownership.belongsTo(models.Owner, {
      foreignKey: 'owner_id',
      as: 'owner'
    });
  };

  return Ownership;
};

