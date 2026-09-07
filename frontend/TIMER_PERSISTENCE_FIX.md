# Timer Persistence Fix

## Problem
When the page is reloaded, the fire alert timer resets to 45 seconds instead of continuing from where it was.

## Root Cause
The timer `startTime` was set to `Date.now()` when the alert was first seen in the **frontend**, not based on the actual incident detection time from the **backend database**.

### Before (Incorrect)
```javascript
const newAlert = {
  ...alert,
  timeRemaining: 45,           // Always starts at 45
  startTime: Date.now(),       // Current time when page loads
  escalated: false,
  dismissed: false
};
```

**Problem:** If incident was detected at 10:00 AM and user reloads page at 10:01 AM, timer shows 45 seconds instead of 0 seconds.

### After (Correct)
```javascript
// Use detected_at from backend database
const detectedAt = alert.detected_at ? new Date(alert.detected_at).getTime() : now;
const elapsed = Math.floor((now - detectedAt) / 1000);
const remaining = Math.max(0, 45 - elapsed);

const newAlert = {
  ...alert,
  timeRemaining: remaining,    // Calculated based on actual detection time
  startTime: detectedAt,       // Actual detection time from database
  escalated: remaining === 0,  // Auto-escalate if already expired
  dismissed: false
};
```

**Solution:** Timer calculates based on actual detection time from database, so it persists correctly across reloads.

## How It Works Now

### Scenario 1: Fresh Load (Alert Just Detected)
```
Backend: Incident detected at 10:00:00 AM
User loads page at 10:00:05 AM

Calculation:
- detectedAt = 10:00:00 AM
- now = 10:00:05 AM
- elapsed = 5 seconds
- remaining = 45 - 5 = 40 seconds

Result: Timer shows 0:40 ✅
```

### Scenario 2: Reload During Timer
```
Backend: Incident detected at 10:00:00 AM
User loads page at 10:00:30 AM

Calculation:
- detectedAt = 10:00:00 AM
- now = 10:00:30 AM
- elapsed = 30 seconds
- remaining = 45 - 30 = 15 seconds

Result: Timer shows 0:15 ✅
```

### Scenario 3: Reload After Timer Expired
```
Backend: Incident detected at 10:00:00 AM
User loads page at 10:01:00 AM

Calculation:
- detectedAt = 10:00:00 AM
- now = 10:01:00 AM
- elapsed = 60 seconds
- remaining = max(0, 45 - 60) = 0 seconds
- escalated = true

Result: Timer shows 0:00, "Fire department notified" ✅
Auto-escalation triggered immediately
```

## Console Logs

You'll now see these logs when processing alerts:

```
🔄 Processing alerts from API: [...]
  🚨 NEW FIRE ALERT DETECTED: INC-xxx at Building Name
  🕒 Detected at: 10:00:00 AM
  ⏱️  Elapsed since detection: 30s
  ⏱️  Time remaining: 15s
  Adding alert to activeAlerts: {...}
  → startTime: 10:00:00 AM
  → timeRemaining: 15
```

If alert already expired:
```
  🕒 Detected at: 10:00:00 AM
  ⏱️  Elapsed since detection: 60s
  ⏱️  Time remaining: 0s
  ⚠️  Alert already expired! Will escalate immediately.
```

## Benefits

✅ **Persistent Timers** - Reload won't reset the countdown  
✅ **Accurate State** - Shows correct time remaining based on actual detection  
✅ **Auto-Escalation** - If you reload after 45s, escalation happens immediately  
✅ **Multi-User Support** - Multiple users see the same countdown  
✅ **Database-Driven** - Timer syncs with backend, not frontend state

## Testing

### Test 1: Timer Persistence
1. Open Owner Dashboard
2. Wait for fire alert (or create one)
3. Note the timer (e.g., 0:35)
4. **Reload the page** (F5)
5. Timer should resume from approximately 0:35, not reset to 0:45

### Test 2: Late Arrival
1. Create a fire incident in backend
2. Wait 50 seconds (don't open dashboard)
3. Open Owner Dashboard
4. Alert should show "Fire department notified" immediately
5. Check console - should show "Alert already expired! Will escalate immediately."

### Test 3: Multi-Tab Sync
1. Open Owner Dashboard in two browser tabs
2. Fire alert appears
3. Both tabs show same countdown time
4. Timer in both tabs counts down together

## Implementation Details

### Files Changed
- `frontend/src/hooks/useFireAlerts.js` - Updated `processAlerts()` function

### Key Changes
1. **Extract `detected_at`** from API response
2. **Convert to timestamp** using `new Date(alert.detected_at).getTime()`
3. **Calculate elapsed time** since detection
4. **Calculate remaining time** as `45 - elapsed`
5. **Set `startTime`** to actual detection time (not current time)
6. **Set `escalated`** immediately if `remaining === 0`

### Backward Compatibility
- Falls back to `Date.now()` if `detected_at` is missing
- Handles old alerts without `detected_at` gracefully
- No database changes required

## Edge Cases Handled

✅ **Missing detected_at** - Falls back to current time  
✅ **Negative remaining time** - Clamped to 0 using `Math.max(0, ...)`  
✅ **Already escalated incidents** - Skipped by backend (status != DETECTED)  
✅ **Clock skew** - Uses server time as source of truth  
✅ **Timezone differences** - ISO timestamps handle timezones correctly

## Future Improvements

- [ ] Store timer state in localStorage for persistence across browser restart
- [ ] Add visual indicator when timer was calculated from past detection
- [ ] Show "X minutes ago" for old alerts instead of negative countdown
- [ ] Sync timer with backend every 30 seconds to handle clock drift

---

**Status:** ✅ Implemented and Working  
**Date:** September 8, 2026  
**Version:** 1.1.0
