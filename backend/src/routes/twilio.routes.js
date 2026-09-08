/**
 * Twilio Routes
 * 
 * Handles Twilio webhooks and test endpoints
 */

const express = require('express');
const router = express.Router();
const twilioService = require('../services/twilio.service');

/**
 * POST /api/twilio/twiml/fire-alert
 * TwiML endpoint for fire alert voice message
 * This is called by Twilio when the phone call is answered
 */
router.post('/twiml/fire-alert', (req, res) => {
  try {
    // Get the current alert data
    const alertData = twilioService.getCurrentAlertData();

    // Generate TwiML response
    const twiml = twilioService.generateFireAlertTwiML(alertData);

    // Set content type to XML
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Error generating TwiML:', error);
    res.type('text/xml');
    res.send(`
      <Response>
        <Say voice="alice" language="en-US">
          Emergency alert system error. Please check your Aatmarakshak dashboard immediately.
        </Say>
      </Response>
    `);
  }
});

/**
 * POST /api/twilio/call-status
 * Webhook for Twilio call status updates
 */
router.post('/call-status', async (req, res) => {
  try {
    const { CallSid, CallStatus, From, To, Duration } = req.body;

    console.log('📞 Twilio Call Status Update:');
    console.log(`   Call SID: ${CallSid}`);
    console.log(`   Status: ${CallStatus}`);
    console.log(`   From: ${From}`);
    console.log(`   To: ${To}`);
    console.log(`   Duration: ${Duration}s`);

    // Here you can save the call status to database if needed
    // For example: update incident record with call_status and call_sid

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing call status webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * POST /api/twilio/test-call
 * Test endpoint to make a test fire alert call
 */
router.post('/test-call', async (req, res) => {
  try {
    if (!twilioService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and OWNER_PHONE_NUMBER in .env file.'
      });
    }

    const result = await twilioService.makeTestCall();

    if (result.success) {
      res.json({
        success: true,
        message: 'Test call initiated successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to initiate test call',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in test call endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating test call',
      error: error.message
    });
  }
});

/**
 * GET /api/twilio/call-status/:callSid
 * Get the status of a specific call
 */
router.get('/call-status/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;

    if (!twilioService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Twilio is not configured'
      });
    }

    const status = await twilioService.getCallStatus(callSid);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error fetching call status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching call status',
      error: error.message
    });
  }
});

/**
 * GET /api/twilio/config
 * Check Twilio configuration status
 */
router.get('/config', (req, res) => {
  const isConfigured = twilioService.isConfigured();
  
  res.json({
    success: true,
    configured: isConfigured,
    message: isConfigured 
      ? 'Twilio is properly configured' 
      : 'Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and OWNER_PHONE_NUMBER in .env',
    details: {
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      hasOwnerPhone: !!process.env.OWNER_PHONE_NUMBER
    }
  });
});

module.exports = router;
