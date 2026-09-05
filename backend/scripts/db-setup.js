#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * Synchronizes database schema with models
 * Run automatically after npm install or manually with: npm run db:setup
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');

async function setupDatabase() {
  console.log('🔄 Setting up database schema...');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync all models (creates tables if they don't exist, updates if needed)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    
    console.log('✅ Database schema synchronized');
    console.log('📦 All models ready\n');

  } catch (error) {
    // Don't fail if database is not available
    console.warn('⚠️  Database setup skipped:', error.message);
    console.warn('💡 Make sure your database is running and credentials are correct');
    console.warn('💡 You can run "npm run db:setup" manually later\n');
  } finally {
    await sequelize.close();
  }
}

// Run the setup
setupDatabase();
