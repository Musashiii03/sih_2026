/**
 * Manual Test: Trigger Voice Call for Existing Incident
 * 
 * Usage: node scripts/manual-call-test.js
 */

require('dotenv').config();
const twilioService = require('../src/services/twilio.service');

async function testManualCall() {
  console.log('\n📞 Manual Voice Call Test\n');
  
  // Test alert data
  const alertData = {
    owner_name: 'Property Owner',
    hazard_type: 'fire',
    building_name: 'Test Building',
    floor_number: '2nd Floor',
    area_or_room_name: 'Conference Room',
    camera_name_or_id: 'CAM-001',
    detection_time: new Date().toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    occupant_status: 'Unknown - Verification Required'
  };

  console.log('Alert Data:', alertData);
  console.log('\nConfiguration:');
  console.log('  API_URL:', process.env.API_URL || 'NOT SET');
  console.log('  TWILIO_TWIML_BIN_URL:', process.env.TWILIO_TWIML_BIN_URL ? 'SET' : 'NOT SET');
  console.log('  Twilio Account:', process.env.TWILIO_ACCOUNT_SID || 'NOT SET');
  console.log('  Owner Phone:', process.env.OWNER_PHONE_NUMBER || 'NOT SET');
  console.log('');

  if (!twilioService.isConfigured()) {
    console.error('❌ Twilio is not configured!');
    process.exit(1);
  }

  console.log('🔔 Triggering voice call...\n');
  
  const result = await twilioService.makeFireAlertCall(alertData);
  
  if (result.success) {
    console.log('✅ Voice call initiated successfully!');
    console.log('   Call SID:', result.callSid);
    console.log('   Status:', result.status);
    console.log('   To:', result.to);
    console.log('   From:', result.from);
    console.log('\n📱 You should receive a call shortly!\n');
  } else {
    console.error('❌ Failed to initiate call');
    console.error('   Error:', result.error);
    process.exit(1);
  }
}

testManualCall().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
