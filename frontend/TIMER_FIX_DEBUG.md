# Fire Alert Timer Debug Guide

## Issue
The 45-second countdown timer in fire alert notifications was stuck at 45 seconds and not counting down.

## Changes Made

### 1. Enhanced Timer Logic (`src/hooks/useFireAlerts.js`)

**Key improvements:**
- Moved time calculation outside state update closure (fresh calculation each tick)
- Added comprehensive console logging for debugging
- Improved cleanup for escalated/dismissed alerts
- Fixed closure issues in the timer interval

**Before:**
```javascript
// Time was calculated inside the map function
setActiveAlerts(prev => {
  return prev.map(a => {
    const elapsed = Math.floor((Date.now() - a.startTime) / 1000);
    const remaining = Math.max(0, ALERT_DURATION - elapsed);
    // ...
  });
});
```

**After:**
```javascript
// Time is calculated once per interval tick
const now = Date.now();
const elapsed = Math.floor((now - alert.startTime) / 1000);
const remaining = Math.max(0, ALERT_DURATION - elapsed);

setActiveAlerts(prev => {
  return prev.map(a => {
    if (a.incident_number === alert.incident_number) {
      return { ...a, timeRemaining: remaining };
    }
    return a;
  });
});
```

### 2. Added Debug Logging

**Timer creation logs:**
```
⏱️ Starting countdown timer for INC-20260907-003538
   Start time: 10:30:15 AM
   Initial timeRemaining: 45
✅ Timer interval created for INC-20260907-003538
```

**Timer tick logs (every second):**
```
⏱️ Tick for INC-20260907-003538: 44s remaining (1s elapsed)
⏱️ Tick for INC-20260907-003538: 43s remaining (2s elapsed)
⏱️ Tick for INC-20260907-003538: 42s remaining (3s elapsed)
...
```

**Timer expiration:**
```
⏰ TIMER REACHED ZERO for INC-20260907-003538
🚨 AUTO-ESCALATION: Would contact fire department for incident INC-20260907-003538
```

### 3. Component Rendering Debug (`src/components/FireAlertNotification.jsx`)

Added logging to track when component receives updated props:
```javascript
console.log(`🔔 FireAlertNotification render - ${incident_number}: timeRemaining=${timeRemaining}, escalated=${escalated}`);
```

## How to Debug

### 1. Open Browser Console
Press `F12` or `Ctrl+Shift+I` to open developer tools

### 2. Watch for Timer Logs

**Successful timer behavior:**
```
⏱️ Timer effect triggered, active alerts count: 1
⏱️ Starting countdown timer for INC-xxx
   Start time: 10:30:15 AM
   Initial timeRemaining: 45
✅ Timer interval created for INC-xxx
⏱️ Tick for INC-xxx: 44s remaining (1s elapsed)
🔔 FireAlertNotification render - INC-xxx: timeRemaining=44, escalated=false
⏱️ Tick for INC-xxx: 43s remaining (2s elapsed)
🔔 FireAlertNotification render - INC-xxx: timeRemaining=43, escalated=false
...
```

### 3. Common Issues & Solutions

#### Issue: No timer logs appear
**Symptom:** No `⏱️ Starting countdown timer` messages
**Cause:** Alert not being added to activeAlerts
**Solution:** Check earlier logs for alert processing:
```
🔄 Processing alerts from API: [...]
🚨 NEW FIRE ALERT DETECTED: INC-xxx at Building Name
```

#### Issue: Timer logs appear but UI stuck
**Symptom:** See `⏱️ Tick` logs but UI shows 45s
**Cause:** Component not re-rendering
**Solution:** Check if `🔔 FireAlertNotification render` logs appear with updated timeRemaining values

#### Issue: Timer starts then stops
**Symptom:** A few ticks then silence
**Cause:** Interval being cleared prematurely
**Solution:** Look for cleanup logs:
```
🧹 Cleaning up timer for escalated/dismissed alert: INC-xxx
```

#### Issue: Multiple timers for same alert
**Symptom:** Multiple tick logs with same timestamp
**Cause:** useEffect running multiple times
**Solution:** Look for duplicate timer creation:
```
⏱️ Starting countdown timer for INC-xxx
⏱️ Starting countdown timer for INC-xxx  // ← Duplicate!
```

## Testing Procedure

### 1. Create a Test Alert
- Start backend: `cd backend && npm start`
- Start frontend: `cd frontend && npm run dev`
- Navigate to Owner Dashboard: `http://localhost:5173/owner`
- Wait for an active fire alert (status: DETECTED)

### 2. Watch Console Output
Open browser console and look for:

**Alert appears:**
```
🔄 Processing alerts from API
🚨 NEW FIRE ALERT DETECTED: INC-xxx
⏱️ Starting countdown timer for INC-xxx
```

**Timer counts down:**
```
⏱️ Tick for INC-xxx: 44s remaining
⏱️ Tick for INC-xxx: 43s remaining
⏱️ Tick for INC-xxx: 42s remaining
```

**Component updates:**
```
🔔 FireAlertNotification render - INC-xxx: timeRemaining=44
🔔 FireAlertNotification render - INC-xxx: timeRemaining=43
```

### 3. Test Acknowledgment
Click "Acknowledge & View" button:

**Expected logs:**
```
🔔 FireAlertNotification: Acknowledge clicked
✓ ACKNOWLEDGING ALERT: INC-xxx
📡 Calling acknowledge API for incident ID: 123
✅ Acknowledge API response: {...}
📧 Fire department email sent to: firedept@example.com
⏱️  Acknowledged within 32.5s
```

Alert should remain visible until verified or timer expires.

### 4. Test Timer Expiration
Let timer run to 0 without acknowledging:

**Expected logs:**
```
⏱️ Tick for INC-xxx: 3s remaining
⏱️ Tick for INC-xxx: 2s remaining
⏱️ Tick for INC-xxx: 1s remaining
⏱️ Tick for INC-xxx: 0s remaining
⏰ TIMER REACHED ZERO for INC-xxx
🚨 AUTO-ESCALATION: Would contact fire department for incident INC-xxx
```

Alert should show "Fire department notified" message.

## Code Structure

### Timer Flow

```
useFireAlerts Hook
    ↓
loadAlerts() (every 5s)
    ↓
fetchActiveAlerts() → API
    ↓
processAlerts()
    ↓
Add to activeAlerts with:
  - timeRemaining: 45
  - startTime: Date.now()
  - escalated: false
    ↓
useEffect [activeAlerts]
    ↓
Create setInterval (1000ms)
    ↓
Every second:
  - Calculate elapsed time
  - Calculate remaining time
  - Update activeAlerts state
    ↓
FireAlertNotification component
    ↓
Receives updated timeRemaining
    ↓
Renders countdown: "Acknowledge in 0:43"
```

### State Management

**Initial alert state:**
```javascript
{
  id: 123,
  incident_number: "INC-xxx",
  building_name: "Tech Tower 4B",
  severity: "CRITICAL",
  timeRemaining: 45,      // ← Counts down
  startTime: 1725784815000, // ← Fixed reference
  escalated: false,        // ← Becomes true at 0
  dismissed: false,
  viewed: false
}
```

**After 10 seconds:**
```javascript
{
  ...
  timeRemaining: 35,  // ← Updated by interval
  startTime: 1725784815000, // ← Same
}
```

**After 45 seconds:**
```javascript
{
  ...
  timeRemaining: 0,
  escalated: true,    // ← Timer expired
}
```

## Performance Notes

- **Memory:** One interval per active alert
- **CPU:** State update every second per alert
- **Cleanup:** Intervals cleared on unmount, dismissal, or escalation
- **Optimization:** Using `useRef` for synchronous access to avoid stale closures

## Future Improvements

- [ ] Use `requestAnimationFrame` for smoother updates
- [ ] Debounce rapid state updates
- [ ] Add visual pulse effect at critical thresholds (10s, 5s)
- [ ] Store timer state in localStorage for persistence across refreshes
- [ ] Add audio warning at 10 seconds remaining
- [ ] Implement Web Worker for timer to prevent blocking main thread

## Related Files

- `frontend/src/hooks/useFireAlerts.js` - Timer logic
- `frontend/src/components/FireAlertNotification.jsx` - Timer display
- `frontend/src/components/OwnerConsole.jsx` - Alert container
- `backend/src/controllers/incident.controller.js` - Acknowledgment API

---

**Last Updated:** September 8, 2026
**Fix Version:** 1.1.0
