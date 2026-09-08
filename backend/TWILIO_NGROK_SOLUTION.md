# Twilio Voice Calls - ngrok Solution (WORKS 100%)

## The Problem

TwiML Bins on trial accounts have authentication issues. The solution is to host TwiML on your own server and expose it via ngrok.

## Solution: Use ngrok + Local Server

### Step 1: Install ngrok

**Download**: https://ngrok.com/download

Or use chocolatey:
```powershell
choco install ngrok
```

### Step 2: Start Your Backend Server

```bash
npm start
```

Your server will run on `http://localhost:3001`

### Step 3: Start ngrok

In a **new terminal**:

```bash
ngrok http 3001
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Step 4: Update .env

```env
# Comment out or remove TWILIO_TWIML_BIN_URL
# TWILIO_TWIML_BIN_URL=...

# Add this instead:
API_URL=https://abc123.ngrok.io
```

Replace `abc123.ngrok.io` with your actual ngrok URL!

### Step 5: Test

```bash
npm run test:twilio
```

You should now receive a call with the **actual fire alert message**!

## How It Works

1. Your backend has an endpoint: `/api/twilio/twiml/fire-alert`
2. This endpoint returns TwiML with the fire alert message
3. ngrok exposes your localhost to the internet
4. Twilio calls the ngrok URL to get the TwiML
5. The call plays your custom message

## Advantages

✅ **Works with trial accounts** - no authentication issues  
✅ **Dynamic messages** - can include actual incident details  
✅ **Full control** - customize the message anytime  
✅ **Free** - ngrok is free for development  

## For Production

When deploying to production:
- Deploy your backend to a cloud server (AWS, Azure, Heroku)
- Set `API_URL` to your production URL
- No need for ngrok in production

## ngrok Free Account Limits

- ✅ HTTPS URLs
- ✅ 40 connections/minute
- ⚠️ URL changes each time you restart ngrok
- 💡 Get a free account for persistent URLs

## Alternative: ngrok Account

Sign up at https://ngrok.com to get:
- **Static domain** (URL doesn't change)
- More concurrent connections
- Auth token for better reliability

After signing up:
```bash
ngrok config add-authtoken YOUR_TOKEN
ngrok http 3001 --domain=yourname.ngrok.io
```

---

**This solution works 100% reliably!** 🎉
