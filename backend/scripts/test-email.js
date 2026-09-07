/**
 * Test Email Configuration
 * 
 * Simple script to test SMTP configuration and send a test email
 * Usage: node scripts/test-email.js
 */

require('dotenv').config();
const emailService = require('../src/services/email.service');

async function testEmailConfiguration() {
  console.log('🔧 Testing Email Configuration\n');
  
  // Check environment variables
  console.log('📋 Configuration:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
  console.log('  SMTP_USER:', process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET');
  console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
  console.log('  FIRE_DEPARTMENT_EMAIL:', process.env.FIRE_DEPARTMENT_EMAIL || '❌ NOT SET');
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET');
  console.log('');
  
  // Test SMTP connection
  console.log('🔌 Testing SMTP Connection...');
  const connectionResult = await emailService.testConnection();
  
  if (!connectionResult.success) {
    console.error('❌ SMTP connection failed:', connectionResult.error);
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Check SMTP_HOST and SMTP_PORT are correct');
    console.log('  2. Verify SMTP_USER and SMTP_PASSWORD');
    console.log('  3. For Gmail: Enable 2FA and use App Password');
    console.log('  4. Check firewall/network settings');
    process.exit(1);
  }
  
  console.log('✅ SMTP connection successful\n');
  
  // Send test email
  console.log('📧 Sending Test Email...');
  
  const testIncidentData = {
    incident_number: 'TEST-' + Date.now(),
    severity: 'CRITICAL',
    detected_at: new Date(),
    confidence_score: 0.95
  };
  
  const testBuildingData = {
    name: 'Test Building - Email Configuration Test',
    building_type: 'COMMERCIAL',
    number_of_floors: 10,
    total_area: 5000,
    height: 30,
    has_fire_alarm: true,
    has_sprinkler: true,
    has_fire_extinguishers: true,
    fire_station_distance_km: 2.5,
    address: {
      address_line_1: '123 Test Street',
      locality: 'Test Locality',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      postal_code: '400001'
    },
    nearest_fire_station: {
      fire_station_name: 'Test Fire Station',
      address_line_1: '456 Station Road',
      phone: '101'
    }
  };
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const testDashboardUrl = `${frontendUrl}/dispatch/${testIncidentData.incident_number}`;
  
  const emailResult = await emailService.sendFireDepartmentAlert(
    testIncidentData,
    testBuildingData,
    testDashboardUrl
  );
  
  if (!emailResult.success) {
    console.error('❌ Failed to send test email:', emailResult.error);
    process.exit(1);
  }
  
  console.log('✅ Test email sent successfully!');
  console.log('   Message ID:', emailResult.messageId);
  console.log('   Recipient:', emailResult.recipient);
  console.log('\n✨ Email configuration is working correctly!');
  console.log('📬 Check', emailResult.recipient, 'for the test email');
}

// Run test
testEmailConfiguration()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
