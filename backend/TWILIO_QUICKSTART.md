# Twilio Voice Alert - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Twilio Credentials
1. Sign up at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Get your **Account SID** and **Auth Token** from the console
3. Buy a phone number with **Voice** capability

### Step 2: Configure .env
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
OWNER_PHONE_NUMBER=+15559876543
```

**Important**: Phone numbers must be in E.164 format (`+1234567890`)

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Test It
```bash
npm run test:twilio
```

You should receive a test call within seconds! ☎️

---

## 📞 How It Works

When a fire is detected:
1. AI creates incident in database
2. Backend **immediately** triggers voice call (no delay)
3. Owner receives call with incident details
4. Owner checks dashboard and dispatches emergency services
5. If no action in 45 seconds → automatic dispatch

---

## 🔍 Testing

### Quick Config Check
```bash
curl http://localhost:3001/api/twilio/config
```

### Make Test Call
```bash
curl -X POST http://localhost:3001/api/twilio/test-call
```

### Trigger Real Alert
```bash
npm run sync:incidents
```

---

## 📝 Voice Message Format

```
"Here is a message for [Owner Name] from Aatmarakshak.

An active fire has been detected on your property.

Building: [Name]
Floor and Area: [Floor], [Room]
Camera Source: [Camera ID]
Time Detected: [Timestamp]
Life Safety Status: [Occupant Count]

Please check your Aatmarakshak dashboard immediately.
Review the live visual feed and click Dispatch to alert authorities.

Notice: If no action is taken within 45 seconds, 
our system will automatically dispatch the alert."
```

---

## ⚠️ Trial Account Limits

- ✅ $15.50 free credit
- ⚠️ Can only call **verified** phone numbers
- ⚠️ Must verify recipient numbers in Twilio Console

**To verify a number:**
1. Go to Twilio Console → Phone Numbers → Verified Caller IDs
2. Click "+" to add new number
3. Enter number and verify via SMS/call

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Call not received | Verify phone number is in E.164 format |
| "Not configured" error | Check all 4 env vars are set |
| "Access denied" | Verify number in Twilio Console (trial accounts) |
| Call failed | Check Twilio Console → Logs → Calls for details |

---

## 📚 Full Documentation

For detailed information, see: [docs/TWILIO_SETUP.md](./docs/TWILIO_SETUP.md)

---

## 💰 Pricing

- **Voice Calls**: ~$0.013/minute (US)
- **Phone Number**: ~$1.15/month
- **Trial Credit**: $15.50 free

[View Pricing](https://www.twilio.com/voice/pricing)

---

## 🔐 Security

- ✅ Never commit credentials to git
- ✅ Use .env for sensitive data
- ✅ Rotate credentials regularly
- ✅ Monitor usage in Twilio Console

---

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm install

# Test Twilio setup
npm run test:twilio

# Start server (calls work automatically)
npm start

# Check configuration
curl http://localhost:3001/api/twilio/config

# Make test call
curl -X POST http://localhost:3001/api/twilio/test-call

# Create test incident (triggers real call)
npm run sync:incidents
```

---

## 🔄 Integration Flow

```
AI Detection → Create Incident → Trigger Call → Owner Receives Alert
                     ↓
              Timeline Entry Created
                     ↓
              Call Status Logged
```

All automatic. No manual intervention required. 🎉

---

## ✨ Ready to Go!

Once configured, voice alerts work automatically whenever:
- A new fire incident is detected
- AI creates an incident via API
- `POST /api/incidents` is called

No additional code needed! 🔥
