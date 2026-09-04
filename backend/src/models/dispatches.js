/**
 * Dispatches Model
 * 
 * Records when fire stations are dispatched to incidents.
 */

module.exports = (sequelize, DataTypes) => {
  const Dispatch = sequelize.define('Dispatch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    incident_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'incidents',
        key: 'id'
      }
    },
    fire_station_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fire_stations',
        key: 'id'
      }
    },
    dispatch_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    units_dispatched: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Number of vehicles/units sent'
    },
    personnel_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of firefighters dispatched'
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'DISPATCHED',
      validate: {
        isIn: [['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'RETURNING', 'COMPLETED', 'CANCELLED']]
      }
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['LOW', 'MEDIUM', 'HIGH', 'URGENT']]
      }
    },
    dispatched_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    arrived_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estimated_arrival: {
      type: DataTypes.DATE,
      allowNull: true
    },
    distance_km: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Distance from station to incident'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'dispatches',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['dispatch_number']
      },
      {
        fields: ['incident_id']
      },
      {
        fields: ['fire_station_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['dispatched_at']
      }
    ]
  });

  Dispatch.associate = (models) => {
    // Dispatch belongs to an incident
    Dispatch.belongsTo(models.Incident, {
      foreignKey: 'incident_id',
      as: 'incident'
    });

    // Dispatch belongs to a fire station
    Dispatch.belongsTo(models.FireStation, {
      foreignKey: 'fire_station_id',
      as: 'fire_station'
    });
  };

  return Dispatch;
};
