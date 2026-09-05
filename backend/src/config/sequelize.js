/**
 * Sequelize Instance Configuration
 * 
 * Initializes and exports the Sequelize instance for database operations.
 * Handles connection, authentication, and provides utility functions.
 * 
 * Features:
 * - Automatic connection testing
 * - Model synchronization
 * - Graceful shutdown handling
 * - Connection retry logic
 */

const { Sequelize } = require('sequelize');
const config = require('./database');

// Determine environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Validate required configuration
if (!dbConfig) {
  throw new Error(`Database configuration for environment "${env}" not found`);
}

// Validate production credentials
if (env === 'production') {
  if (!dbConfig.username || !dbConfig.password || !dbConfig.database) {
    throw new Error('Production database credentials are required. Please set DB_USER, DB_PASSWORD, and DB_NAME environment variables.');
  }
}

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    timezone: dbConfig.timezone,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions,
    
    // Retry configuration
    retry: {
      max: 3,
      timeout: 5000
    },
    
    // Query options
    benchmark: env === 'development',
    logQueryParameters: env === 'development'
  }
);

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection success status
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${env} environment)`);
    console.log(`📊 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    
    if (error.original) {
      console.error('📋 Error details:', {
        code: error.original.code,
        errno: error.original.errno,
        sqlMessage: error.original.sqlMessage
      });
    }
    
    // Provide helpful error messages
    if (error.original?.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Hint: Check your database credentials (DB_USER, DB_PASSWORD)');
    } else if (error.original?.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Hint: Database does not exist. Please create it first.');
      console.error(`   Run: CREATE DATABASE ${dbConfig.database};`);
    } else if (error.original?.code === 'ECONNREFUSED') {
      console.error('💡 Hint: Database server is not running or host/port is incorrect');
    }
    
    return false;
  }
};

/**
 * Sync all models with database
 * @param {Object} options - Sequelize sync options
 * @returns {Promise<void>}
 */
const syncDatabase = async (options = {}) => {
  try {
    const defaultOptions = {
      alter: env === 'development', // Auto-alter tables in development (preserves data)
      force: false // Never drop tables by default
    };
    
    const syncOptions = { ...defaultOptions, ...options };
    
    if (syncOptions.force) {
      console.warn('⚠️  WARNING: Using force:true will DROP all tables and DELETE all data!');
    }
    
    await sequelize.sync(syncOptions);
    
    if (env === 'development') {
      console.log('✅ Database synchronized successfully');
      if (syncOptions.alter) {
        console.log('🔄 Mode: ALTER (tables updated, data preserved)');
      }
    }
  } catch (error) {
    console.error('❌ Database synchronization failed:', error.message);
    throw error;
  }
};

/**
 * Close database connection gracefully
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
    throw error;
  }
};

/**
 * Get connection status
 * @returns {Object} Connection status information
 */
const getConnectionStatus = () => {
  return {
    authenticated: sequelize.authenticate.called,
    database: dbConfig.database,
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    environment: env,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      current: sequelize.connectionManager.pool.size
    }
  };
};

// Export Sequelize instance and utilities
module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
  getConnectionStatus
};
