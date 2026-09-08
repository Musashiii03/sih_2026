/**
 * Delete and Re-sync Incident (for testing voice calls)
 * 
 * Usage: node scripts/delete-and-resync-incident.js INC-20260908-184826
 */

require('dotenv').config();
const { Incident, IncidentDetection, Evidence, sequelize } = require('../src/models');
const { syncFireIncidents } = require('../src/utils/sync-fire-incidents');

async function deleteAndResync() {
  const incidentNumber = process.argv[2];

  if (!incidentNumber) {
    console.error('❌ Usage: node scripts/delete-and-resync-incident.js <INCIDENT_NUMBER>');
    console.error('   Example: node scripts/delete-and-resync-incident.js INC-20260908-184826');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log(`\n🗑️  Deleting incident ${incidentNumber} from database...\n`);

    // Find the incident
    const incident = await Incident.findOne({
      where: { incident_number: incidentNumber }
    });

    if (!incident) {
      console.log(`⚠️  Incident ${incidentNumber} not found in database - already deleted or never synced`);
      console.log('   Will sync from filesystem...\n');
    } else {
      // Delete related records first
      await IncidentDetection.destroy({ where: { incident_id: incident.id } });
      await Evidence.destroy({ where: { incident_id: incident.id } });
      await Incident.destroy({ where: { id: incident.id } });
      console.log(`✅ Deleted incident ${incidentNumber} from database\n`);
    }

    console.log('🔄 Re-syncing from filesystem (will trigger voice call)...\n');

    // Now sync - this will create it fresh and trigger voice call
    const result = await syncFireIncidents();

    if (result.success && result.synced > 0) {
      console.log(`\n✅ Successfully re-synced! Voice call should have been triggered.\n`);
      console.log(`📱 Check your phone for the call!\n`);
    } else if (result.skipped > 0) {
      console.log(`\n⚠️  Incident was skipped - it might not exist in filesystem`);
      console.log(`   Check: backend/data/fire_incidents/*/INC-*\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

deleteAndResync();
