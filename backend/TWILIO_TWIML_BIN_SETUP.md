# Setting Up Twilio TwiML Bin for Trial Accounts

## Why TwiML Bin?

Trial Twilio accounts have limitations:
- ❌ Cannot use inline `twiml` parameter
- ❌ Cannot use some external URL services (like Twimlets)
- ✅ **CAN use TwiML Bins** (Twilio-hosted TwiML files)

## Setup Steps

### 1. Go to TwiML Bins
Visit: https://console.twilio.com/us1/develop/runtime/twiml-bins

### 2. Create New TwiML Bin
Click the red **"Create new TwiML Bin"** button

### 3. Configure the Bin

**Friendly Name**: `Fire Alert Message`

**TwiML Content**: Paste this code:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    This is an urgent fire alert from Aatmarakshak.
    A fire has been detected on your property.
    Please check your Aatmarakshak dashboard immediately and dispatch emergency services.
    If no action is taken within 45 seconds, automatic dispatch will occur.
  </Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-US">
    Fire alert. Check your dashboard now. Automatic dispatch in 45 seconds.
  </Say>
</Response>
```

### 4. Save and Copy URL
1. Click **"Create"**
2. The bin will be created and you'll see a URL like:
   ```
   https://handler.twilio.com/twiml/EH1234567890abcdef1234567890abcdef
   ```
3. **Copy this URL**

### 5. Add URL to .env
Open `.env` file and add:

```env
TWILIO_TWIML_BIN_URL=https://handler.twilio.com/twiml/EH1234567890abcdef1234567890abcdef
```

Replace with your actual URL!

### 6. Test It
```bash
npm run test:twilio
```

You should now receive a call with the fire alert message!

## Customizing the Message

You can edit the TwiML Bin anytime to change the message:

1. Go to: https://console.twilio.com/us1/develop/runtime/twiml-bins
2. Click on your bin name
3. Edit the `<Say>` content
4. Click "Save"
5. No need to restart your app - changes are immediate!

## TwiML Tips

### Change Voice
```xml
<Say voice="man">Your message</Say>
<Say voice="woman">Your message</Say>
<Say voice="alice">Your message</Say>
<Say voice="Polly.Matthew">Your message</Say>
```

### Add Pauses
```xml
<Pause length="2"/>  <!-- 2 second pause -->
```

### Repeat Message
```xml
<Say voice="alice">First message</Say>
<Say voice="alice">Second message</Say>
```

### Add Emphasis
Use SSML for advanced features:
```xml
<Say voice="alice">
  <emphasis level="strong">URGENT!</emphasis>
  Fire detected.
</Say>
```

## For Production (Paid Account)

When you upgrade to a paid account, you can:
1. Use your own server endpoint (we have `/api/twilio/twiml/fire-alert`)
2. Dynamic messages with incident details
3. Status callbacks and webhooks
4. Call recording

But for now, TwiML Bin works perfectly for trial accounts!

## Troubleshooting

### "Invalid or disallowed parameters"
- Make sure you're using the TwiML Bin URL, not inline TwiML
- Verify the URL is correct and starts with `https://handler.twilio.com/twiml/`

### "Check your URL" message during call
- The TwiML Bin URL might be wrong
- Go to Twilio Console and verify the URL
- Make sure there are no typos in `.env`

### Call doesn't go through
- Verify recipient phone number is verified in Twilio Console
- Check Twilio account has credit
- View call logs at: https://console.twilio.com/us1/monitor/logs/calls

## Example TwiML Bins

### Simple Alert
```xml
<Response>
  <Say>Fire alert. Check dashboard now.</Say>
</Response>
```

### Detailed Alert
```xml
<Response>
  <Say voice="alice">
    Urgent fire alert from Aatmarakshak.
    A fire has been detected on your property.
    Check your dashboard immediately.
    Dispatch emergency services now.
    Automatic dispatch will occur in 45 seconds if no action is taken.
  </Say>
  <Pause length="1"/>
  <Say voice="alice">
    I repeat. Fire detected. Check dashboard. Dispatch now.
  </Say>
</Response>
```

### With Menu (IVR)
```xml
<Response>
  <Say>Fire alert! Press 1 to acknowledge, press 2 to dispatch.</Say>
  <Gather numDigits="1" action="/api/twilio/ivr-response">
    <Say>Press 1 or 2 now.</Say>
  </Gather>
</Response>
```

---

**Quick Link**: https://console.twilio.com/us1/develop/runtime/twiml-bins
