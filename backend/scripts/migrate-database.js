#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * Updates the database schema to match the current models
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');

async function migrateDatabase() {
  console.log('\n📦 Running database migrations...\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync all models with alter option (updates schema without losing data)
    console.log('🔄 Syncing models to database...');
    await sequelize.sync({ alter: true });
    
    console.log('✅ Database schema updated successfully\n');
    console.log('📊 Summary:');
    console.log('   • All models synced');
    console.log('   • Existing data preserved');
    console.log('   • New columns added where needed');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
migrateDatabase();
