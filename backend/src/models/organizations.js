/**
 * Organizations Model
 * 
 * Represents companies, government bodies, or institutions (referenced in owners and emergency_contacts).
 */

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    organization_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g., CORPORATE, GOVERNMENT, NGO, EDUCATIONAL'
    },
    registration_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address_id: {
      type: DataTypes.INTEGER, allowNull: true,
      references: {
        model: 'addresses',
        key: 'id'
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
    tableName: 'organizations',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        unique: true,
        fields: ['registration_number'],
        where: {
          registration_number: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['status']
      }
    ]
  });

  Organization.associate = (models) => {
    // Organization can have an address
    Organization.belongsTo(models.Address, {
      foreignKey: 'address_id',
      as: 'address'
    });

    // Organization can be an owner
    Organization.hasMany(models.Owner, {
      foreignKey: 'organization_id',
      as: 'ownerships'
    });

    // Organization has emergency contacts
    Organization.hasMany(models.EmergencyContact, {
      foreignKey: 'organization_id',
      as: 'emergency_contacts'
    });
  };

  return Organization;
};

