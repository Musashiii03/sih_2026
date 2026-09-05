/**
 * Roles Model
 * 
 * Defines user roles and permissions in the system.
 */

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'JSON array of permission strings'
    },
    is_system_role: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'System roles cannot be deleted'
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'INACTIVE']]
      }
    }
  }, {
    tableName: 'roles',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['status']
      }
    ]
  });

  Role.associate = (models) => {
    // Role has many users (through user_roles)
    Role.belongsToMany(models.User, {
      through: 'user_roles',
      foreignKey: 'role_id',
      otherKey: 'user_id',
      as: 'users'
    });
  };

  return Role;
};

