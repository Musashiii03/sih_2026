/**
 * User Roles Model (Junction Table)
 * 
 * Many-to-many relationship between users and roles.
 */

module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id'
      }
    }
  }, {
    tableName: 'user_roles',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['role_id']
      }
    ]
  });

  UserRole.associate = (models) => {
    // Associations are defined in User and Role models
  };

  return UserRole;
};
