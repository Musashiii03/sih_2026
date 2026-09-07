/**
 * Database Utility Functions
 * 
 * Helper functions for common database operations, transactions,
 * error handling, and database health checks.
 * 
 * Features:
 * - Transaction helpers
 * - Query builders
 * - Error handling utilities
 * - Database health monitoring
 */

const { sequelize } = require('../config/sequelize');
const { Sequelize } = require('sequelize');

/**
 * Execute function within a transaction
 * Automatically commits on success and rolls back on error
 * 
 * @param {Function} callback - Async function to execute within transaction
 * @returns {Promise<any>} Result of the callback function
 * 
 * @example
 * await withTransaction(async (transaction) => {
 *   await User.create({ name: 'John' }, { transaction });
 *   await Profile.create({ userId: user.id }, { transaction });
 * });
 */
const withTransaction = async (callback) => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Execute raw SQL query safely
 * Uses prepared statements to prevent SQL injection
 * 
 * @param {string} sql - SQL query with placeholders
 * @param {Object} options - Query options
 * @returns {Promise<any>} Query results
 * 
 * @example
 * const users = await executeQuery(
 *   'SELECT * FROM users WHERE status = :status',
 *   { replacements: { status: 'active' } }
 * );
 */
const executeQuery = async (sql, options = {}) => {
  try {
    const [results, metadata] = await sequelize.query(sql, {
      type: Sequelize.QueryTypes.SELECT,
      ...options
    });
    return results;
  } catch (error) {
    console.error('Query execution error:', error.message);
    throw error;
  }
};

/**
 * Check database health and connectivity
 * Works with both MySQL and PostgreSQL
 * 
 * @returns {Promise<Object>} Health status object
 */
const checkDatabaseHealth = async () => {
  const health = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    database: null,
    dialect: null,
    version: null,
    uptime: null,
    connections: null,
    responseTime: null
  };
  
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    await sequelize.authenticate();
    
    health.dialect = sequelize.getDialect();
    health.database = sequelize.config.database;
    
    // Get database version
    const versionResult = await sequelize.query('SELECT VERSION() as version', {
      type: Sequelize.QueryTypes.SELECT
    });
    health.version = versionResult[0]?.version;
    
    // Get connection count and uptime (dialect-specific)
    if (health.dialect === 'postgres') {
      // PostgreSQL specific queries
      try {
        const connections = await sequelize.query(
          "SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()",
          { type: Sequelize.QueryTypes.SELECT }
        );
        health.connections = parseInt(connections[0]?.count || 0);
      } catch (err) {
        health.connections = 'unavailable';
      }
      
      try {
        const uptime = await sequelize.query(
          "SELECT EXTRACT(EPOCH FROM (now() - pg_postmaster_start_time())) as uptime",
          { type: Sequelize.QueryTypes.SELECT }
        );
        health.uptime = Math.floor(parseFloat(uptime[0]?.uptime || 0));
      } catch (err) {
        health.uptime = 'unavailable';
      }
    } else if (health.dialect === 'mysql') {
      // MySQL specific queries
      try {
        const connections = await sequelize.query(
          'SHOW STATUS WHERE Variable_name = "Threads_connected"',
          { type: Sequelize.QueryTypes.SELECT }
        );
        health.connections = parseInt(connections[0]?.Value || 0);
      } catch (err) {
        health.connections = 'unavailable';
      }
      
      try {
        const uptime = await sequelize.query(
          'SHOW STATUS WHERE Variable_name = "Uptime"',
          { type: Sequelize.QueryTypes.SELECT }
        );
        health.uptime = parseInt(uptime[0]?.Value || 0);
      } catch (err) {
        health.uptime = 'unavailable';
      }
    }
    
    health.responseTime = Date.now() - startTime;
    health.status = 'healthy';
    
    return health;
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    health.responseTime = Date.now() - startTime;
    return health;
  }
};

/**
 * Parse Sequelize validation errors into user-friendly format
 * 
 * @param {Error} error - Sequelize validation error
 * @returns {Object} Formatted error object
 */
const parseValidationError = (error) => {
  if (error.name === 'SequelizeValidationError') {
    return {
      type: 'ValidationError',
      message: 'Validation failed',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message,
        type: err.type,
        value: err.value
      }))
    };
  }
  
  if (error.name === 'SequelizeUniqueConstraintError') {
    return {
      type: 'UniqueConstraintError',
      message: 'Unique constraint violation',
      errors: error.errors.map(err => ({
        field: err.path,
        message: `${err.path} must be unique`,
        value: err.value
      }))
    };
  }
  
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return {
      type: 'ForeignKeyConstraintError',
      message: 'Foreign key constraint violation',
      field: error.fields,
      table: error.table
    };
  }
  
  return {
    type: 'DatabaseError',
    message: error.message
  };
};

/**
 * Paginate query results
 * 
 * @param {Object} model - Sequelize model
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @returns {Promise<Object>} Paginated results
 */
const paginate = async (model, options = {}) => {
  const {
    page = 1,
    pageSize = 10,
    where = {},
    include = [],
    order = [['created_at', 'DESC']],
    attributes
  } = options;
  
  const limit = parseInt(pageSize);
  const offset = (parseInt(page) - 1) * limit;
  
  const { count, rows } = await model.findAndCountAll({
    where,
    include,
    order,
    limit,
    offset,
    attributes,
    distinct: true
  });
  
  return {
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      pageSize: limit,
      totalPages: Math.ceil(count / limit),
      hasNext: offset + limit < count,
      hasPrev: page > 1
    }
  };
};

/**
 * Safely drop all tables (USE WITH CAUTION)
 * Only works in development environment
 * 
 * @returns {Promise<void>}
 */
const dropAllTables = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot drop tables in production environment');
  }
  
  console.warn('⚠️  Dropping all tables...');
  await sequelize.drop();
  console.log('✅ All tables dropped');
};

/**
 * Get database statistics
 * Works with both MySQL and PostgreSQL
 * 
 * @returns {Promise<Object>} Database statistics
 */
const getDatabaseStats = async () => {
  try {
    const dialect = sequelize.getDialect();
    let tables = [];
    
    if (dialect === 'postgres') {
      // PostgreSQL query
      tables = await sequelize.query(
        `SELECT 
          table_name as "tableName",
          (SELECT reltuples::bigint FROM pg_class WHERE relname = table_name) as "rows",
          pg_total_relation_size(quote_ident(table_name))::bigint as "totalSize",
          pg_relation_size(quote_ident(table_name))::bigint as "dataSize",
          (pg_total_relation_size(quote_ident(table_name)) - pg_relation_size(quote_ident(table_name)))::bigint as "indexSize"
         FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'`,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      );
    } else if (dialect === 'mysql') {
      // MySQL query
      tables = await sequelize.query(
        `SELECT 
          TABLE_NAME as tableName,
          TABLE_ROWS as rows,
          DATA_LENGTH as dataSize,
          INDEX_LENGTH as indexSize,
          (DATA_LENGTH + INDEX_LENGTH) as totalSize
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = :database`,
        {
          replacements: { database: sequelize.config.database },
          type: Sequelize.QueryTypes.SELECT
        }
      );
    }
    
    return {
      database: sequelize.config.database,
      dialect: dialect,
      tables: tables.map(t => ({
        name: t.tableName,
        rows: parseInt(t.rows) || 0,
        dataSize: parseInt(t.dataSize) || 0,
        indexSize: parseInt(t.indexSize) || 0,
        totalSize: parseInt(t.totalSize) || 0
      })),
      totalTables: tables.length
    };
  } catch (error) {
    console.error('Error getting database stats:', error.message);
    throw error;
  }
};

module.exports = {
  withTransaction,
  executeQuery,
  checkDatabaseHealth,
  parseValidationError,
  paginate,
  dropAllTables,
  getDatabaseStats
};
