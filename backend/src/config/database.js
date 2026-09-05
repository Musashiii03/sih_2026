/**
 * Database Configuration
 * 
 * Centralized database configuration for Sequelize ORM.
 * Uses environment variables for credentials and supports multiple environments.
 * 
 * Security Features:
 * - SSL/TLS connection support
 * - Connection pooling with limits
 * - Automatic query logging in development
 * - Prepared statements to prevent SQL injection
 * - Timezone configuration for consistency
 */

require('dotenv').config();

const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'atmarakshak',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    
    // Logging configuration - controlled by DB_LOGGING env var
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    
    // Connection pool configuration
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // Timezone configuration
    timezone: '+00:00',
    
    // Define options
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    
    // Query options
    dialectOptions: {
      // SSL configuration (uncomment for production)
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false
      // }
    }
  },
  
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_TEST_NAME || 'atmarakshak_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    
    // Disable logging in test environment
    logging: false,
    
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    timezone: '+00:00',
    
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    
    // Disable logging in production
    logging: false,
    
    // Production pool configuration - higher limits
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    
    timezone: '+00:00',
    
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    
    // Production SSL configuration
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
      }
    }
  }
};

module.exports = config;
