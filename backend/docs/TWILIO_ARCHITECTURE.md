# Twilio Voice Alert Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FIRE DETECTION SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI DETECTION (Python/YOLOv8)                        │
│  • Analyzes CCTV feed                                                    │
│  • Detects fire, smoke, humans                                           │
│  • Generates incident data                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/incidents
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  INCIDENT CONTROLLER (incident.controller.js)            │
│                                                                           │
│  1. Create incident record in database                                   │
│  2. Save detection data and evidence frames                              │
│  3. Create timeline entries                                              │
│  4. ⚡ TRIGGER VOICE CALL (immediate, non-blocking)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ twilioService.makeFireAlertCall()
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   TWILIO SERVICE (twilio.service.js)                     │
│                                                                           │
│  • Validate configuration                                                │
│  • Generate TwiML voice message                                          │
│  • Initiate call via Twilio API                                          │
│  • Return call SID for tracking                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP POST (Twilio API)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           TWILIO CLOUD                                   │
│                                                                           │
│  • Queue voice call                                                      │
│  • Initiate phone connection                                             │
│  • Play TTS (Text-to-Speech) message                                     │
│  • Track call status                                                     │
│  • Send webhooks on status changes                                       │
└─────────────────────────────────────────────────────────────────────────┘
                     │                              │
                     │ Voice Call                   │ Status Webhooks
                     ▼                              ▼
┌──────────────────────────────┐   ┌──────────────────────────────────────┐
│    BUILDING OWNER PHONE      │   │  WEBHOOK: POST /api/twilio/call-     │
│                              │   │  status                               │
│  • Receives call             │   │                                       │
│  • Hears fire alert message  │   │  • Logs call status changes          │
│  • Gets incident details     │   │  • Updates incident timeline         │
│  • Instructed to check       │   │  • Records call duration             │
│    dashboard                 │   │                                       │
└──────────────────────────────┘   └──────────────────────────────────────┘
                     │
                     │ Opens browser
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       DASHBOARD (Frontend)                               │
│                                                                           │
│  • View incident details                                                 │
│  • See live camera feed                                                  │
│  • Review evidence frames                                                │
│  • Click "Dispatch" button                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Incident Creation
```javascript
POST /api/incidents
{
  incident_id: "INC-20260908-123456",
  camera_id: "CAM-301",
  building_id: 1,
  frames: [...],
  statistics: {
    avg_fire_confidence: 0.85,
    total_human_detections: 2
  }
}
```

### 2. Voice Call Trigger
```javascript
// In incident.controller.js (automatic)
const alertData = {
  owner_name: "Property Owner",
  hazard_type: "fire",
  building_name: "Main Office",
  floor_number: "3rd Floor",
  area_or_room_name: "Conference Room A",
  camera_name_or_id: "CAM-301",
  detection_time: "Sep 08, 2026, 02:35 PM",
  occupant_status: "2 person(s) detected - URGENT"
};

twilioService.makeFireAlertCall(alertData); // Non-blocking
```

### 3. Twilio API Call
```javascript
// Generated TwiML
<Response>
  <Say voice="alice" language="en-US">
    Here is a message for Property Owner from Aatmarakshak.
    <break time="1s"/>
    An active fire has been detected on your property.
    <break time="500ms"/>
    I repeat, An active fire has been detected on your property.
    ...
  </Say>
</Response>
```

### 4. Timeline Entry
```javascript
{
  event_type: "OWNER_NOTIFIED",
  description: "Voice call alert sent to property owner",
  actor_type: "SYSTEM",
  metadata: {
    call_sid: "CAxxxxxxxx",
    call_status: "queued",
    notification_type: "VOICE_CALL"
  }
}
```

## Component Interaction

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Database   │────▶│  Incident    │────▶│   Twilio     │
│  (Postgres)  │     │  Controller  │     │   Service    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │
       │ Store               │ Log                 │ Make Call
       │ Incident            │ Timeline            │
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Incidents   │     │   Timeline   │     │ Twilio Cloud │
│    Table     │     │    Table     │     │   (External) │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Sequence Diagram

```
AI System    →  Backend API    →  Incident Controller  →  Twilio Service  →  Twilio Cloud  →  Owner Phone
    │                 │                    │                      │                 │              │
    │ POST incident   │                    │                      │                 │              │
    │────────────────▶│                    │                      │                 │              │
    │                 │ createIncident()   │                      │                 │              │
    │                 │───────────────────▶│                      │                 │              │
    │                 │                    │ Save to DB           │                 │              │
    │                 │                    │──────────┐           │                 │              │
    │                 │                    │          │           │                 │              │
    │                 │                    │◀─────────┘           │                 │              │
    │                 │                    │ makeFireAlertCall()  │                 │              │
    │                 │                    │─────────────────────▶│                 │              │
    │                 │                    │                      │ Twilio API Call │              │
    │                 │                    │                      │────────────────▶│              │
    │                 │                    │                      │                 │ Initiate Call│
    │                 │                    │                      │                 │─────────────▶│
    │                 │                    │                      │ Return Call SID │              │
    │                 │                    │                      │◀────────────────│              │
    │                 │                    │ Return success       │                 │              │
    │                 │                    │◀─────────────────────│                 │     RING!    │
    │                 │ Response 201       │                      │                 │◀─────────────│
    │                 │◀───────────────────│                      │                 │              │
    │ Success         │                    │                      │                 │  Play Voice  │
    │◀────────────────│                    │                      │                 │─────────────▶│
    │                 │                    │                      │                 │              │
    │                 │                    │ (Later...)           │                 │              │
    │                 │ Webhook:           │                      │  Status Update  │              │
    │                 │ call-status        │                      │◀────────────────│              │
    │                 │◀───────────────────────────────────────────────────────────│              │
    │                 │ Log status         │                      │                 │              │
    │                 │──────────┐         │                      │                 │              │
    │                 │          │         │                      │                 │              │
    │                 │◀─────────┘         │                      │                 │              │
```

## Configuration Flow

```
.env File
    │
    │ TWILIO_ACCOUNT_SID
    │ TWILIO_AUTH_TOKEN
    │ TWILIO_PHONE_NUMBER
    │ OWNER_PHONE_NUMBER
    │
    ▼
TwilioService Constructor
    │
    │ new twilio(accountSid, authToken)
    │
    ▼
Twilio Client (Singleton)
    │
    ├─▶ makeFireAlertCall()
    ├─▶ getCallStatus()
    ├─▶ makeTestCall()
    └─▶ isConfigured()
```

## Error Handling Flow

```
makeFireAlertCall()
    │
    ├─▶ Configuration Check
    │      │
    │      ├─▶ Valid ──▶ Continue
    │      └─▶ Invalid ──▶ Return { success: false, error: "Not configured" }
    │
    ├─▶ Generate TwiML
    │      │
    │      └─▶ Template with incident data
    │
    ├─▶ Call Twilio API
    │      │
    │      ├─▶ Success ──▶ Return { success: true, callSid, status }
    │      └─▶ Error ──▶ Catch ──▶ Log ──▶ Return { success: false, error }
    │
    └─▶ Timeline Logging (async)
           │
           ├─▶ Success ──▶ Timeline entry created
           └─▶ Error ──▶ Log warning (don't fail incident creation)
```

## Integration Points

### 1. Database Schema
```sql
-- incidents table
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  incident_number VARCHAR(50) UNIQUE,
  building_id INTEGER,
  detected_at TIMESTAMP,
  status VARCHAR(50),
  ...
);

-- incident_timeline table
CREATE TABLE incident_timeline (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES incidents(id),
  event_type VARCHAR(50), -- "OWNER_NOTIFIED"
  description TEXT,
  actor_type VARCHAR(50), -- "SYSTEM"
  metadata JSONB, -- { call_sid, call_status, notification_type }
  occurred_at TIMESTAMP
);
```

### 2. Environment Variables
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Must have voice capability
OWNER_PHONE_NUMBER=+15559876543   # E.164 format required
```

### 3. Server Initialization
```javascript
// server.js
const twilioRoutes = require('./src/routes/twilio.routes');
app.use('/api/twilio', twilioRoutes);
```

### 4. API Endpoints
```
GET  /api/twilio/config              # Check configuration
POST /api/twilio/test-call           # Make test call
GET  /api/twilio/call-status/:sid    # Get call status
POST /api/twilio/call-status         # Webhook (Twilio -> Backend)
```

## Call States

```
QUEUED ──▶ INITIATED ──▶ RINGING ──▶ IN-PROGRESS ──▶ COMPLETED
   │           │              │             │              │
   │           │              │             │              ▼
   │           │              │             │         ✅ Success
   │           │              │             │
   ├───────────┼──────────────┼─────────────┴──────▶ BUSY
   ├───────────┼──────────────┴────────────────────▶ NO-ANSWER
   ├───────────┴───────────────────────────────────▶ FAILED
   └─────────────────────────────────────────────────▶ CANCELED
```

## Webhook Flow

```
Twilio Cloud
    │
    │ Call Status Changes
    │ (initiated, ringing, answered, completed)
    │
    ▼
POST /api/twilio/call-status
    │
    │ req.body: {
    │   CallSid: "CAxxxxx",
    │   CallStatus: "completed",
    │   Duration: "45",
    │   From: "+15551234567",
    │   To: "+15559876543"
    │ }
    │
    ▼
Log to Console
    │
    │ (Optional) Update Database
    │
    ▼
Response 200 OK
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Security Layers                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Environment Variables (.env, not committed)          │
│     ↓                                                     │
│  2. Configuration Validation (startup check)             │
│     ↓                                                     │
│  3. HTTPS for API calls (Twilio SDK)                     │
│     ↓                                                     │
│  4. Twilio Account Security (IP allowlist optional)      │
│     ↓                                                     │
│  5. Webhook Signature Validation (future enhancement)    │
│     ↓                                                     │
│  6. Rate Limiting (future enhancement)                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Future Enhancements Architecture

### Multi-Owner Support
```
Building Model
    │
    ├─▶ owner_phone (NEW FIELD)
    ├─▶ owner_name (NEW FIELD)
    └─▶ owner_email
         │
         ▼
Incident Controller
    │
    │ Fetch building owner
    │
    ▼
Dynamic Phone Number
    │
    │ building.owner_phone || env.OWNER_PHONE_NUMBER
    │
    ▼
twilioService.makeFireAlertCall(data, phone)
```

### IVR Menu
```
Voice Call Answered
    │
    ├─▶ Play Alert Message
    │
    ├─▶ <Gather> Menu
    │      │
    │      ├─▶ Press 1: Acknowledge (update incident status)
    │      ├─▶ Press 2: Dispatch (auto-call fire department)
    │      └─▶ Press 3: False Alarm (mark incident)
    │
    └─▶ POST /api/twilio/ivr-response
           │
           └─▶ Handle user input
```

## Monitoring & Observability

```
┌──────────────────┐
│  Call Initiated  │
└────────┬─────────┘
         │
         ├─▶ Console Log (immediate)
         ├─▶ Timeline Entry (database)
         ├─▶ Twilio Console (Logs → Calls)
         └─▶ Status Webhook (async updates)
              │
              ├─▶ initiated
              ├─▶ ringing
              ├─▶ in-progress
              └─▶ completed/failed/busy/no-answer
```

## Performance Characteristics

- **Call Initiation**: < 100ms (non-blocking)
- **Phone Ring**: 5-10 seconds (Twilio processing)
- **Voice Message**: 45-60 seconds duration
- **Status Webhook**: Real-time (milliseconds)
- **Timeline Logging**: < 50ms (database insert)

## Cost Breakdown

```
Per Incident
    │
    ├─▶ Voice Call: ~$0.01 (45 seconds @ $0.013/min)
    ├─▶ Phone Number: $0.004/day ($1.15/month / 30 days)
    └─▶ Total: ~$0.014 per incident

Annual (100 incidents)
    │
    ├─▶ Voice Calls: $1.00
    ├─▶ Phone Number: $13.80
    └─▶ Total: ~$14.80/year
```

---

This architecture provides instant, reliable voice alerts with minimal latency and cost. The system is designed to be maintainable, scalable, and easy to enhance with additional features.
