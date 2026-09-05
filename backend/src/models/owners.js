/**
 * Owners Model
 * 
 * Represents an individual user or organization that owns a building.
 */

module.exports = (sequelize, DataTypes) => {
  const Owner = sequelize.define('Owner', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    owner_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['INDIVIDUAL', 'ORGANIZATION']]
      }
    },
    user_id: {
      type: DataTypes.INTEGER, allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    organization_id: {
      type: DataTypes.INTEGER, allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      }
    }
  }, {
    tableName: 'owners',
    underscored: true,
    timestamps: true,
    validate: {
      hasOneOwnerType() {
        if ((this.user_id && this.organization_id) || (!this.user_id && !this.organization_id)) {
          throw new Error('Owner must have either user_id or organization_id, but not both');
        }
      }
    },
    indexes: [
      {
        fields: ['owner_type']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['organization_id']
      }
    ]
  });

  Owner.associate = (models) => {
    // Owner can be a user
    Owner.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Owner can be an organization
    Owner.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });

    // Owner has many buildings (through ownerships)
    Owner.belongsToMany(models.Building, {
      through: models.Ownership,
      foreignKey: 'owner_id',
      otherKey: 'building_id',
      as: 'buildings'
    });
  };

  return Owner;
};

