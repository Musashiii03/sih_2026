/**
 * Audit Logs Model
 * 
 * Records security-sensitive changes made through the application.
 */

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    actor_user_id: {
      type: DataTypes.INTEGER, allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g., CREATE, UPDATE, DELETE, LOGIN, LOGOUT'
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g., USER, BUILDING, INCIDENT, CAMERA'
    },
    entity_id: {
      type: DataTypes.INTEGER, allowNull: false
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Previous state before change'
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'New state after change'
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['actor_user_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  AuditLog.associate = (models) => {
    // Audit log can have an actor user
    AuditLog.belongsTo(models.User, {
      foreignKey: 'actor_user_id',
      as: 'actor'
    });
  };

  return AuditLog;
};

