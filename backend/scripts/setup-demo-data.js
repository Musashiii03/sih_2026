#!/usr/bin/env node

/**
 * Setup Demo Data Script
 * 
 * Seeds the database with demo buildings, cameras, and syncs fire incidents
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');
const { syncFireIncidents } = require('../src/utils/sync-fire-incidents');

// Import seeder
const demoSeed = require('../src/seeders/demo-buildings-seed');

async function setupDemoData() {
  console.log('\n🚀 Setting up demo data...\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Step 1: Run demo buildings seeder
    console.log('📦 Step 1: Seeding demo buildings and cameras...');
    await demoSeed.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('');

    // Step 2: Sync fire incidents from filesystem
    console.log('🔄 Step 2: Syncing fire incidents from filesystem...');
    const syncResult = await syncFireIncidents();
    console.log('');

    if (syncResult.success) {
      console.log('✅ Demo data setup completed successfully!\n');
      console.log('📊 Summary:');
      console.log(`   • Buildings and cameras seeded`);
      console.log(`   • Fire incidents synced: ${syncResult.synced}`);
      console.log(`   • Incidents skipped: ${syncResult.skipped}`);
      if (syncResult.errors > 0) {
        console.log(`   • Errors: ${syncResult.errors}`);
      }
      console.log('');
    } else {
      console.error('❌ Demo data setup failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the setup
setupDemoData();
