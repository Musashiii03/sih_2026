/**
 * Trigger Voice Call for Specific Incident
 * 
 * Usage: node scripts/trigger-call-for-incident.js INC-20260908-184242
 */

require('dotenv').config();
const { Incident, Camera, Building } = require('../src/models');
const twilioService = require('../src/services/twilio.service');

async function triggerCallForIncident() {
  const incidentNumber = process.argv[2];

  if (!incidentNumber) {
    console.error('❌ Usage: node scripts/trigger-call-for-incident.js <INCIDENT_NUMBER>');
    console.error('   Example: node scripts/trigger-call-for-incident.js INC-20260908-184242');
    process.exit(1);
  }

  try {
    console.log(`\n📞 Triggering voice call for incident: ${incidentNumber}\n`);

    // Find the incident
    const incident = await Incident.findOne({
      where: { incident_number: incidentNumber },
      include: [
        {
          model: Building,
          as: 'building'
        },
        {
          model: Camera,
          as: 'detected_by_camera'
        }
      ]
    });

    if (!incident) {
      console.error(`❌ Incident not found: ${incidentNumber}`);
      process.exit(1);
    }

    console.log(`✅ Found incident: ${incidentNumber}`);
    console.log(`   Building: ${incident.building?.name || 'Unknown'}`);
    console.log(`   Camera: ${incident.detected_by_camera?.camera_code || 'Unknown'}`);
    console.log(`   Detected: ${incident.detected_at}`);
    console.log('');

    if (!twilioService.isConfigured()) {
      console.error('❌ Twilio not configured!');
      process.exit(1);
    }

    // Prepare alert data
    const alertData = {
      owner_name: 'Property Owner',
      hazard_type: 'fire',
      building_name: incident.building?.name || 'Unknown Building',
      floor_number: incident.detected_by_camera?.floor_number || 'Unknown Floor',
      area_or_room_name: incident.detected_by_camera?.room_name || 'Unknown Area',
      camera_name_or_id: incident.detected_by_camera?.camera_code || 'Unknown Camera',
      detection_time: incident.detected_at.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      occupant_status: 'Unknown - Verification Required'
    };

    console.log('🔔 Initiating voice call...\n');

    const result = await twilioService.makeFireAlertCall(alertData);

    if (result.success) {
      console.log('✅ Voice call initiated successfully!');
      console.log(`   Call SID: ${result.callSid}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   To: ${result.to}`);
      console.log('\n📱 You should receive a call shortly!\n');
    } else {
      console.error('❌ Failed to initiate call');
      console.error(`   Error: ${result.error}\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

triggerCallForIncident();
