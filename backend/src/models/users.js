/**
 * Users Model
 * 
 * People who access or operate the platform.
 */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'ACTIVE',
      validate: {
        isIn: [['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']]
      }
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['phone']
      },
      {
        fields: ['status']
      }
    ]
  });

  User.associate = (models) => {
    // User has many roles (through user_roles)
    User.belongsToMany(models.Role, {
      through: 'user_roles',
      foreignKey: 'user_id',
      otherKey: 'role_id',
      as: 'roles'
    });

    // User can report incidents
    User.hasMany(models.Incident, {
      foreignKey: 'reported_by_user_id',
      as: 'reported_incidents'
    });

    // User can be an owner
    User.hasMany(models.Owner, {
      foreignKey: 'user_id',
      as: 'ownerships'
    });

    // User can receive notifications
    User.hasMany(models.Notification, {
      foreignKey: 'recipient_user_id',
      as: 'notifications'
    });

    // User activities in audit logs
    User.hasMany(models.AuditLog, {
      foreignKey: 'actor_user_id',
      as: 'audit_logs'
    });

    // User activities in incident timeline
    User.hasMany(models.IncidentTimeline, {
      foreignKey: 'actor_user_id',
      as: 'timeline_events'
    });
  };

  // Instance method - hide sensitive data
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    return values;
  };

  return User;
};

