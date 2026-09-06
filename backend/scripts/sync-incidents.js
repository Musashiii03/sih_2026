#!/usr/bin/env node

/**
 * Sync Incidents Script
 * 
 * Syncs fire incidents from filesystem to database
 * Run this after generating new incidents with the Python AI model
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize } = require('../src/models');
const { syncFireIncidents } = require('../src/utils/sync-fire-incidents');

async function syncIncidents() {
  console.log('\n🔄 Syncing fire incidents...\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Sync fire incidents from filesystem
    const syncResult = await syncFireIncidents();

    if (syncResult.success) {
      console.log('\n✅ Incident sync completed!\n');
      console.log('📊 Summary:');
      console.log(`   • New incidents synced: ${syncResult.synced}`);
      console.log(`   • Incidents skipped (already exist): ${syncResult.skipped}`);
      if (syncResult.errors > 0) {
        console.log(`   • Errors: ${syncResult.errors}`);
      }
      console.log('');
      process.exit(0);
    } else {
      console.error('\n❌ Incident sync failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the sync
syncIncidents();
