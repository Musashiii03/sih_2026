/**
 * Test Twilio Voice Call Setup
 * 
 * Run this script to verify your Twilio configuration and make a test call
 * 
 * Usage:
 *   node scripts/test-twilio.js
 */

require('dotenv').config();
const twilioService = require('../src/services/twilio.service');

async function testTwilioSetup() {
  console.log('\n🔔 Testing Twilio Voice Call Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check configuration
  console.log('📋 Configuration Status:');
  console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || '❌ Not set'}`);
  console.log(`   Owner Phone: ${process.env.OWNER_PHONE_NUMBER || '❌ Not set'}`);
  console.log('');

  if (!twilioService.isConfigured()) {
    console.error('❌ Twilio is not properly configured!');
    console.log('\n💡 Setup Instructions:');
    console.log('   1. Sign up for Twilio at https://www.twilio.com/try-twilio');
    console.log('   2. Get your Account SID and Auth Token from the Twilio Console');
    console.log('   3. Get a Twilio phone number (with voice capabilities)');
    console.log('   4. Update your .env file with:');
    console.log('      TWILIO_ACCOUNT_SID=your_account_sid');
    console.log('      TWILIO_AUTH_TOKEN=your_auth_token');
    console.log('      TWILIO_PHONE_NUMBER=+1234567890');
    console.log('      OWNER_PHONE_NUMBER=+1234567890');
    console.log('');
    process.exit(1);
  }

  console.log('✅ Twilio is configured!\n');

  // Ask for confirmation before making test call
  console.log('⚠️  This will make a REAL phone call to:', process.env.OWNER_PHONE_NUMBER);
  console.log('   The call will deliver a test fire alert message.');
  console.log('');
  
  // In a real scenario, you'd want user confirmation here
  // For automation, we'll just proceed
  
  try {
    console.log('📞 Initiating test call...\n');
    
    const result = await twilioService.makeTestCall();
    
    if (result.success) {
      console.log('✅ Test call initiated successfully!');
      console.log(`   Call SID: ${result.callSid}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   To: ${result.to}`);
      console.log(`   From: ${result.from}`);
      console.log(`   Timestamp: ${result.timestamp}`);
      console.log('');
      console.log('📱 You should receive a call shortly with the fire alert message.');
      console.log('');
      
      // Wait a moment and check status
      console.log('⏳ Checking call status in 5 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        const status = await twilioService.getCallStatus(result.callSid);
        console.log('📊 Call Status Update:');
        console.log(`   Status: ${status.status}`);
        console.log(`   Duration: ${status.duration || 'N/A'}s`);
        console.log(`   Direction: ${status.direction}`);
        if (status.answeredBy) {
          console.log(`   Answered By: ${status.answeredBy}`);
        }
        console.log('');
      } catch (err) {
        console.log('⚠️  Could not fetch call status:', err.message);
      }
      
    } else {
      console.error('❌ Failed to initiate test call');
      console.error(`   Error: ${result.error}`);
      console.log('');
      console.log('💡 Troubleshooting:');
      console.log('   - Verify your Twilio credentials are correct');
      console.log('   - Ensure your Twilio phone number has voice capabilities');
      console.log('   - Check that your Twilio account is active and funded');
      console.log('   - Verify the owner phone number is in E.164 format (+1234567890)');
      console.log('');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error during test call:', error.message);
    console.log('');
    process.exit(1);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Twilio test complete!\n');
}

// Run the test
testTwilioSetup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
