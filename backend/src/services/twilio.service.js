/**
 * Twilio Voice Call Service
 * 
 * Handles automated voice call alerts for fire incidents
 */

const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.ownerPhoneNumber = process.env.OWNER_PHONE_NUMBER;

    // Initialize Twilio client
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      console.log('✅ Twilio service initialized');
    } else {
      console.warn('⚠️  Twilio credentials not configured. Voice calls will not be sent.');
    }
  }

  /**
   * Make a voice call to the building owner with fire alert message
   * @param {Object} alertData - Fire incident data
   * @returns {Promise<Object>} Call details
   */
  async makeFireAlertCall(alertData) {
    if (!this.client) {
      console.warn('⚠️  Twilio not configured. Skipping voice call.');
      return { success: false, error: 'Twilio not configured' };
    }

    const {
      owner_name = 'Property Owner',
      hazard_type = 'fire',
      building_name = 'your building',
      floor_number = 'unknown floor',
      area_or_room_name = 'unknown area',
      camera_name_or_id = 'unknown camera',
      detection_time = new Date().toLocaleString(),
      occupant_status = 'Unknown'
    } = alertData;

    try {
      // Priority 1: Use API_URL with our own TwiML endpoint (best for development/production)
      // Priority 2: Use TwiML Bin URL (for trial accounts without ngrok)
      
      let twimlUrl;
      
      if (process.env.API_URL) {
        // Use our own server endpoint (works best with ngrok or production)
        twimlUrl = `${process.env.API_URL}/api/twilio/twiml/fire-alert`;
        console.log('📞 Using server TwiML endpoint (dynamic message)');
      } else if (process.env.TWILIO_TWIML_BIN_URL) {
        // Fallback to TwiML Bin
        twimlUrl = process.env.TWILIO_TWIML_BIN_URL;
        // Add AccountSid parameter if not already present
        if (!twimlUrl.includes('AccountSid')) {
          const separator = twimlUrl.includes('?') ? '&' : '?';
          twimlUrl = `${twimlUrl}${separator}AccountSid=${this.accountSid}`;
        }
        console.log('📞 Using TwiML Bin (static message)');
      } else {
        throw new Error('Neither API_URL nor TWILIO_TWIML_BIN_URL configured. Please set one of them.');
      }

      console.log('📞 TwiML URL:', twimlUrl);

      // Make the call with TwiML URL
      const call = await this.client.calls.create({
        to: this.ownerPhoneNumber,
        from: this.twilioPhoneNumber,
        url: twimlUrl
      });

      console.log(`✅ Fire alert call initiated: ${call.sid}`);
      console.log(`   To: ${this.ownerPhoneNumber}`);
      console.log(`   Status: ${call.status}`);

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: this.ownerPhoneNumber,
        from: this.twilioPhoneNumber,
        timestamp: new Date().toISOString(),
        alertData: alertData
      };

    } catch (error) {
      console.error('❌ Error making Twilio call:', error.message);
      
      // Check for specific errors
      if (error.message.includes('not a verified number')) {
        console.error(`⚠️  Phone number ${this.ownerPhoneNumber} is not verified.`);
        console.error(`   Visit: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate TwiML for fire alert voice message
   * @param {Object} data - Alert data for message template
   * @returns {string} TwiML XML string
   */
  generateFireAlertTwiML(data) {
    const {
      owner_name,
      hazard_type,
      building_name,
      floor_number,
      area_or_room_name,
      camera_name_or_id,
      detection_time,
      occupant_status
    } = data;

    // Format the message with proper pauses for clarity
    const message = `
      <Response>
        <Say voice="alice" language="en-US">
          Here is a message for ${owner_name} from Aatmarakshak.
          <break time="1s"/>
          An active ${hazard_type} has been detected on your property.
          <break time="500ms"/>
          I repeat, An active ${hazard_type} has been detected on your property.
          <break time="1s"/>
          Building: ${building_name}
          <break time="500ms"/>
          Floor and Area: ${floor_number}, ${area_or_room_name}
          <break time="500ms"/>
          Camera Source: ${camera_name_or_id}
          <break time="500ms"/>
          Time Detected: ${detection_time}
          <break time="500ms"/>
          Life Safety Status: ${occupant_status}
          <break time="1s"/>
          Please check your Aatmarakshak dashboard immediately. 
          Review the live visual feed and click the Dispatch button to alert local fire and emergency authorities.
          <break time="1s"/>
          Notice: If no action is taken within 45 seconds, our system will automatically dispatch the emergency alert to the authorities on your behalf.
          <break time="1s"/>
          This message will repeat once.
          <break time="2s"/>
        </Say>
        <Say voice="alice" language="en-US">
          An active ${hazard_type} has been detected at ${building_name}.
          Floor ${floor_number}, ${area_or_room_name}.
          Check your Aatmarakshak dashboard immediately.
          Emergency dispatch will be automatic in 45 seconds if no action is taken.
        </Say>
      </Response>
    `;

    return message.trim();
  }

  /**
   * Check if Twilio is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.client && this.accountSid && this.authToken && this.twilioPhoneNumber && this.ownerPhoneNumber);
  }

  /**
   * Get call status
   * @param {string} callSid - Twilio call SID
   * @returns {Promise<Object>}
   */
  async getCallStatus(callSid) {
    if (!this.client) {
      throw new Error('Twilio not configured');
    }

    try {
      const call = await this.client.calls(callSid).fetch();
      return {
        sid: call.sid,
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        direction: call.direction,
        answeredBy: call.answeredBy
      };
    } catch (error) {
      console.error('Error fetching call status:', error.message);
      throw error;
    }
  }

  /**
   * Make a test call to verify Twilio setup
   * @returns {Promise<Object>}
   */
  async makeTestCall() {
    if (!this.client) {
      throw new Error('Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and OWNER_PHONE_NUMBER in .env');
    }

    const testData = {
      owner_name: 'Test User',
      hazard_type: 'fire',
      building_name: 'Test Building',
      floor_number: '2nd Floor',
      area_or_room_name: 'Conference Room A',
      camera_name_or_id: 'CAM-001',
      detection_time: new Date().toLocaleString(),
      occupant_status: 'Unknown - Verification Required'
    };

    console.log('🔔 Making test fire alert call...');
    
    try {
      // Use the same logic as makeFireAlertCall
      let twimlUrl;
      
      if (process.env.API_URL) {
        // Use our own server endpoint (works with ngrok)
        twimlUrl = `${process.env.API_URL}/api/twilio/twiml/fire-alert`;
        console.log('📞 Using server TwiML endpoint:', twimlUrl);
      } else if (process.env.TWILIO_TWIML_BIN_URL) {
        // Fallback to TwiML Bin
        twimlUrl = process.env.TWILIO_TWIML_BIN_URL;
        // Add AccountSid parameter if not already present
        if (!twimlUrl.includes('AccountSid')) {
          const separator = twimlUrl.includes('?') ? '&' : '?';
          twimlUrl = `${twimlUrl}${separator}AccountSid=${this.accountSid}`;
        }
        console.log('📞 Using TwiML Bin:', twimlUrl);
      } else {
        throw new Error(`
⚠️  Neither API_URL nor TWILIO_TWIML_BIN_URL configured!

For ngrok setup:
1. Run: ngrok http 3001
2. Add to .env: API_URL=https://your-ngrok-url.ngrok.io

For TwiML Bin:
1. Go to: https://console.twilio.com/us1/develop/runtime/twiml-bins
2. Create bin with simple TwiML
3. Add URL to .env
        `);
      }
      
      const call = await this.client.calls.create({
        to: this.ownerPhoneNumber,
        from: this.twilioPhoneNumber,
        url: twimlUrl
      });
      
      console.log(`✅ Test call initiated: ${call.sid}`);
      
      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        to: this.ownerPhoneNumber,
        from: this.twilioPhoneNumber,
        timestamp: new Date().toISOString(),
        mode: 'test'
      };
    } catch (error) {
      console.error('❌ Error making test call:', error.message);
      
      // Check for specific trial account errors
      if (error.message.includes('not a verified number')) {
        throw new Error(`Phone number ${this.ownerPhoneNumber} is not verified. Please verify it in your Twilio Console: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`);
      }
      
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new TwilioService();
