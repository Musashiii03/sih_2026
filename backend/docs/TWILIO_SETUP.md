# Twilio Voice Call Alert Setup

This document explains how to set up and use Twilio for automated voice call alerts when a fire incident is detected.

## Overview

When a new fire incident is detected by the AI system, the backend will automatically initiate a voice call to the building owner's phone number with a pre-recorded message containing critical incident details.

**The voice call is triggered immediately without any delay or waiting.**

## Features

- ✅ **Instant Voice Alerts**: Calls are initiated immediately when an incident is created
- ✅ **Detailed Information**: Message includes building name, location, camera source, detection time, and occupant status
- ✅ **Clear Communication**: Professional voice message with proper pauses and repetition for clarity
- ✅ **Status Tracking**: Call status updates via webhooks
- ✅ **Timeline Recording**: Call notifications are logged in incident timeline

## Setup Instructions

### 1. Create a Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free trial account (or use an existing account)
3. Complete the verification process

### 2. Get Your Credentials

From the [Twilio Console](https://console.twilio.com/):

1. **Account SID**: Found on the console homepage
2. **Auth Token**: Click "Show" next to Auth Token on the console homepage
3. Keep these secure - they're your API credentials

### 3. Get a Phone Number

1. In the Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country
3. Check the **Voice** capability checkbox
4. Search and purchase a phone number
5. Note: Trial accounts have free credits to get started

### 4. Configure Environment Variables

Update your `.env` file with your Twilio credentials:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
OWNER_PHONE_NUMBER=+15559876543
```

**Important Notes:**
- Phone numbers must be in E.164 format: `+[country code][number]`
- Example US number: `+15551234567`
- Example India number: `+919876543210`
- For trial accounts, you can only call verified phone numbers

### 5. Verify Your Setup

Run the test script to verify everything is working:

```bash
npm run test:twilio
```

This will:
- ✅ Check that all credentials are configured
- ✅ Initiate a test fire alert call
- ✅ Display call status information
- ✅ Verify the phone number receives the call

## Voice Message Template

The system uses the following message structure:

```
Here is a message for [Owner Name] from Aatmarakshak.

An active [fire/smoke] has been detected on your property.

I repeat, An active [fire/smoke] has been detected on your property.

Building: [Building Name]

Floor and Area: [Floor Number], [Room/Area Name]

Camera Source: [Camera Code]

Time Detected: [Detection Timestamp]

Life Safety Status: [Occupant Status]

Please check your Aatmarakshak dashboard immediately. 
Review the live visual feed and click the Dispatch button to alert 
local fire and emergency authorities.

Notice: If no action is taken within 45 seconds, our system will 
automatically dispatch the emergency alert to the authorities on your behalf.
```

The message includes:
- Professional voice (Alice voice, English US)
- Strategic pauses for clarity
- Message repetition for critical information
- Clear call-to-action

## Integration Details

### When Calls Are Made

Voice calls are triggered automatically in `incident.controller.js` when:
1. A new fire incident is created via `POST /api/incidents`
2. The AI detection system reports a fire
3. Twilio is properly configured

### How It Works

```javascript
// In createIncident function (incident.controller.js)

// After incident is created and saved to database...

if (twilioService.isConfigured()) {
  const alertData = {
    owner_name: 'Property Owner',
    hazard_type: 'fire',
    building_name: incident.building?.name,
    floor_number: camera?.floor_number,
    area_or_room_name: camera?.room_name,
    camera_name_or_id: camera?.camera_code,
    detection_time: incident.detected_at.toLocaleString(),
    occupant_status: statistics?.total_human_detections > 0 
      ? `${statistics.total_human_detections} person(s) detected`
      : 'Unknown - Verification Required'
  };

  // Fire and forget - don't wait for call to complete
  twilioService.makeFireAlertCall(alertData);
}
```

### Timeline Entry

When a call is successfully initiated, a timeline entry is automatically created:

```json
{
  "event_type": "OWNER_NOTIFIED",
  "description": "Voice call alert sent to property owner",
  "actor_type": "SYSTEM",
  "metadata": {
    "call_sid": "CAxxxxxxxx",
    "call_status": "queued",
    "notification_type": "VOICE_CALL"
  }
}
```

## API Endpoints

### Test Call
```http
POST /api/twilio/test-call
```
Makes a test call with sample incident data.

**Response:**
```json
{
  "success": true,
  "message": "Test call initiated successfully",
  "data": {
    "callSid": "CAxxxxxxxx",
    "status": "queued",
    "to": "+15559876543",
    "from": "+15551234567"
  }
}
```

### Get Call Status
```http
GET /api/twilio/call-status/:callSid
```
Retrieves the status of a specific call.

**Response:**
```json
{
  "success": true,
  "data": {
    "sid": "CAxxxxxxxx",
    "status": "completed",
    "duration": "45",
    "startTime": "2026-09-08T12:00:00Z",
    "endTime": "2026-09-08T12:00:45Z"
  }
}
```

### Check Configuration
```http
GET /api/twilio/config
```
Checks if Twilio is properly configured.

**Response:**
```json
{
  "success": true,
  "configured": true,
  "message": "Twilio is properly configured",
  "details": {
    "hasAccountSid": true,
    "hasAuthToken": true,
    "hasTwilioPhone": true,
    "hasOwnerPhone": true
  }
}
```

### Call Status Webhook
```http
POST /api/twilio/call-status
```
Receives status updates from Twilio (automatically called by Twilio).

## Testing

### 1. Configuration Test
Check if Twilio is configured:
```bash
curl http://localhost:3001/api/twilio/config
```

### 2. Test Call
Initiate a test call via API:
```bash
curl -X POST http://localhost:3001/api/twilio/test-call
```

### 3. Test Call via Script
Run the comprehensive test script:
```bash
npm run test:twilio
```

### 4. Live Incident Test
Create a test incident to trigger a real alert:
```bash
npm run sync:incidents
```

## Call Statuses

Twilio calls go through several statuses:

- **queued**: Call is queued and waiting to be initiated
- **initiated**: Call has been initiated
- **ringing**: Phone is ringing
- **in-progress**: Call is connected and in progress
- **completed**: Call completed successfully
- **busy**: Recipient's phone was busy
- **no-answer**: No one answered the call
- **failed**: Call failed to complete
- **canceled**: Call was canceled before completion

## Troubleshooting

### Call Not Received

1. **Check Phone Number Format**
   - Must be in E.164 format: `+[country code][number]`
   - No spaces, dashes, or parentheses
   - Example: `+15551234567` not `(555) 123-4567`

2. **Verify Twilio Account Status**
   - Trial accounts can only call verified numbers
   - Verify the owner phone number in Twilio Console
   - Check account balance

3. **Check Call Logs**
   - Go to Twilio Console → Monitor → Logs → Calls
   - Look for error messages

### Configuration Issues

```bash
# Check if configuration is detected
npm run test:twilio

# Verify .env file is loaded
node -e "require('dotenv').config(); console.log(process.env.TWILIO_ACCOUNT_SID)"
```

### Voice Quality Issues

If the voice message is unclear:
- Check network connectivity
- Verify Twilio service status at [status.twilio.com](https://status.twilio.com)
- Try a different voice in `twilio.service.js` (alice, man, woman, Polly voices)

## Cost Information

### Twilio Pricing (approximate)
- **Trial Account**: $15.50 in free credit
- **Voice Calls**: ~$0.013 per minute for US numbers
- **Phone Number**: ~$1.15 per month
- **International Calls**: Vary by country

For production use, consider:
- Upgrading to a paid account
- Monitoring usage and setting alerts
- Reviewing [Twilio Pricing](https://www.twilio.com/voice/pricing)

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate credentials** regularly
4. **Monitor usage** for unexpected activity
5. **Set spending limits** in Twilio Console
6. **Use IP allowlists** for production

## Production Considerations

### Scaling

For high-volume deployments:
- Use Twilio's Queue API for rate limiting
- Implement retry logic for failed calls
- Add database tracking for all calls
- Monitor call completion rates

### Reliability

- Implement fallback notifications (SMS, email)
- Add call recording for compliance
- Log all call attempts and results
- Set up alerting for call failures

### Customization

You can customize the voice message by editing `src/services/twilio.service.js`:

```javascript
generateFireAlertTwiML(data) {
  // Modify the message template here
  // Change voice: alice, man, woman, Polly.Matthew, etc.
  // Adjust pauses: <break time="1s"/>
  // Add emphasis: <emphasis>important text</emphasis>
}
```

## Multi-Owner Support (Future Enhancement)

Currently, the system calls a single owner phone number from `.env`. To support multiple building owners:

1. Add `owner_phone` field to `buildings` table
2. Fetch owner phone from building record in `incident.controller.js`
3. Pass dynamic phone number to `twilioService.makeFireAlertCall()`

Example:
```javascript
const building = await Building.findByPk(buildingId);
const ownerPhone = building.owner_phone || process.env.OWNER_PHONE_NUMBER;

twilioService.makeFireAlertCall(alertData, ownerPhone);
```

## Support

- **Twilio Docs**: [https://www.twilio.com/docs/voice](https://www.twilio.com/docs/voice)
- **Twilio Support**: [https://support.twilio.com](https://support.twilio.com)
- **API Reference**: [https://www.twilio.com/docs/voice/api](https://www.twilio.com/docs/voice/api)

## Related Documentation

- [Email Alerts Setup](./EMAIL_SETUP.md)
- [Incident Management](./INCIDENT_MANAGEMENT.md)
- [Database Setup](./DATABASE_SETUP.md)
