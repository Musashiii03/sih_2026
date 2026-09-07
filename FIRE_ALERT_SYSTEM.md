# Fire Incident Real-Time Alert System

## Overview

A comprehensive real-time fire alert system for the Atmarakshak platform that monitors fire incidents, displays alerts to building owners, and provides a 45-second acknowledgment window with automatic escalation.

**Status:** ✅ Fully Implemented  
**Date:** September 7, 2026  
**Target Building:** Building ID 1 (Demo/Testing)

---

## Features Implemented

### 1. Backend API - Active Fire Alerts Endpoint
**File:** `backend/src/controllers/incident.controller.js`

- **Endpoint:** `GET /api/incidents/active-alerts`
- **Filter Criteria:**
  - `building_id = 1` (hardcoded for demo)
  - `incident_type = 'FIRE'`
  - `status = 'DETECTED'`
- **Response:** Simplified alert data with building name, incident number, confidence score, camera location
- **Route:** Added to `backend/src/routes/incident.routes.js`

### 2. Real-Time Polling Hook
**File:** `frontend/src/hooks/useFireAlerts.js`

- **Polling Interval:** 5 seconds
- **Features:**
  - Tracks seen incident IDs to detect new alerts
  - Manages 45-second countdown timers for each alert
  - `acknowledgeAlert()` - Updates backend status to VERIFIED
  - `dismissAlert()` - Dismisses notification (for testing)
  - `buildingsWithAlerts` - Array of building IDs with active alerts
  - Auto-escalation when timer expires

### 3. Alert Notification Component
**Files:** 
- `frontend/src/components/FireAlertNotification.jsx`
- `frontend/src/components/FireAlertNotification.css`

**Features:**
- Slide-in animation from top-right corner
- Non-blocking design (z-index: 10000)
- Displays:
  - Building name and code
  - Fire status indicator
  - Confidence score
  - Camera location
  - 45-second countdown timer (MM:SS format)
  - Acknowledge button
  - Dismiss button
- **Visual States:**
  - Normal (red #fb4934)
  - Urgent (last 10 seconds, orange #fe8019, pulsing)
  - Escalated (yellow #fabd2f, "Fire department notified")
- Animated progress bar
- Flame icon with flicker animation

### 4. Owner Console Integration
**File:** `frontend/src/components/OwnerConsole.jsx`

- Imports and initializes `useFireAlerts` hook
- Renders `FireAlertNotification` components in fixed top-right position
- `handleAcknowledgeFireAlert()` function:
  - Calls API to update incident status
  - Navigates to building detail view with incident data
  - Shows success toast notification
- Auto-escalation toast notifications
- Manages `activeIncidentForBuilding` state for navigation

### 5. Building Sidebar Highlighting
**Files:**
- `frontend/src/components/OwnerConsole.jsx`
- `frontend/src/components/ApexConsole.css`

**Features:**
- Buildings with active alerts show:
  - Red/orange gradient background (rgba(251, 73, 52, 0.15))
  - 3px solid red left border
  - Pulsing border animation (2s cycle)
  - Flame icon with flicker animation
  - Fire emoji badge (🔥) with bounce animation
- Organization-level indicator if any child building has alerts
- Hover effects with enhanced highlighting
- CSS class: `.building-fire-alert`

### 6. Incident Detail View Component
**Files:**
- `frontend/src/components/IncidentDetailView.jsx`
- `frontend/src/components/IncidentDetailView.css`

**Layout:** 2-column grid (400px sidebar + flexible main area)

**Left Column - Summary Cards:**
- Incident Status Card
  - Status badge (DETECTED/VERIFIED)
  - Severity badge (color-coded)
  - Priority badge
  - Confidence score percentage
  - Detection timestamp
- Building Information Card
  - Building name, type, floors
  - Address with map pin icon
  - Safety features (fire alarm, sprinklers, extinguishers, exits)
- Camera Detection Source Card
  - Camera name/code
  - Floor number and room name
  - Location description
- Detection Statistics Grid
  - Total detections
  - Fire detections
  - People detected
  - Evidence frames count

**Right Column - Evidence Frames:**
- Large selected frame preview
- Frame metadata (filename, timestamp, description)
- Scrollable thumbnail grid
- Click to select and view frame
- Fallback for missing images

**Features:**
- Fetches data from `/api/incidents/dashboard/:incident_number`
- Loading spinner with animation
- Error handling with user-friendly messages
- Back button to return to building view
- External link to full dispatch dashboard
- Responsive design (breakpoints at 1200px, 768px)
- Gruvbox color theme matching existing UI

### 7. Building Detail Integration
**File:** `frontend/src/components/BuildingDetail.jsx`

- Accepts optional `activeIncidentId` prop
- Conditionally renders `IncidentDetailView` when incident is active
- Preserves building context for incident view
- Back button returns to normal building view
- State management for view switching

### 8. Acknowledgment Workflow
**Implementation:** Already completed in `useFireAlerts` hook

**Flow:**
1. User clicks "Acknowledge & View" button on alert
2. `acknowledgeAlert(incidentNumber)` is called
3. API request: `PATCH /api/incidents/:id/status` with `status='VERIFIED'`
4. Alert removed from active alerts array
5. Countdown timer cleared
6. Building highlight removed if no more alerts
7. Navigation to building detail view with incident data
8. Toast notification shown: "Incident {id} acknowledged"

### 9. Auto-Escalation System
**Implementation:** Already completed in Tasks 2-4

**Flow:**
1. Timer counts down from 45 seconds
2. Visual changes at 10 seconds (urgent state, pulsing)
3. When timer reaches 0:
   - Console logs: "⏰ TIMER EXPIRED for {id}"
   - Console logs: "🚨 AUTO-ESCALATION: Would contact fire department for incident {id}"
   - Console logs: "TODO: Integrate with ERSS 112 dispatch system"
   - Alert marked as escalated
   - Visual state changes to yellow theme
   - Message: "Fire department notified"
   - Toast notification: "Incident {id} auto-escalated to fire department (placeholder)"
4. User can dismiss escalated alerts

---

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── incident.controller.js      [✓ Modified - Added getActiveFireAlerts]
│   └── routes/
│       └── incident.routes.js          [✓ Modified - Added /active-alerts route]

frontend/
├── src/
│   ├── components/
│   │   ├── OwnerConsole.jsx            [✓ Modified - Integrated alerts]
│   │   ├── BuildingDetail.jsx          [✓ Modified - Added incident view]
│   │   ├── FireAlertNotification.jsx   [✓ New - Alert component]
│   │   ├── FireAlertNotification.css   [✓ New - Alert styles]
│   │   ├── IncidentDetailView.jsx      [✓ New - Incident details]
│   │   ├── IncidentDetailView.css      [✓ New - Incident styles]
│   │   └── ApexConsole.css             [✓ Modified - Building highlight styles]
│   └── hooks/
│       └── useFireAlerts.js            [✓ New - Alert management hook]
```

---

## API Endpoints Used

### Active Alerts (Polling)
```
GET /api/incidents/active-alerts
Response: {
  success: true,
  count: number,
  data: [
    {
      id, incident_number, building_id, building_name, building_code,
      severity, priority, confidence_score, detected_at, camera_code,
      camera_location, dashboard_url
    }
  ]
}
```

### Acknowledge Incident
```
PATCH /api/incidents/:id/status
Body: { status: 'VERIFIED', notes: 'Acknowledged by building owner...' }
Response: { success: true, data: incident }
```

### Incident Dashboard Data
```
GET /api/incidents/dashboard/:incident_number
Response: {
  success: true,
  data: {
    incident: {...},
    building: {...},
    camera: {...},
    detections: [...],
    evidence_frames: [...]
  }
}
```

---

## Usage & Testing

### How to Test the System

1. **Start Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend Dev Server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Sync Fire Incidents to Database:**
   ```bash
   cd backend
   node src/utils/sync-fire-incidents.js
   ```
   This will create incidents from `backend/data/fire_incidents/` directory.

4. **Access Owner Console:**
   Navigate to `http://localhost:5173/owner`

5. **Observe Alert System:**
   - Alerts will appear in top-right corner within 5 seconds
   - Building ID 1 will be highlighted in sidebar if it has alerts
   - 45-second countdown timer will be visible
   - Last 10 seconds will show urgent pulsing state

6. **Test Acknowledgment:**
   - Click "Acknowledge & View" button
   - System navigates to building detail view
   - Incident details and evidence frames are displayed
   - Alert disappears from notification area
   - Building highlight is removed

7. **Test Auto-Escalation:**
   - Wait for timer to reach 0 seconds
   - Alert changes to yellow escalated state
   - Toast notification appears
   - Console logs show escalation messages

---

## Configuration

### Target Building
Currently hardcoded to `building_id = 1` in:
- `backend/src/controllers/incident.controller.js` (line 417)

To change target building, modify:
```javascript
const targetBuildingId = 1; // Change this value
```

### Polling Interval
Defined in `frontend/src/hooks/useFireAlerts.js`:
```javascript
const POLL_INTERVAL = 5000; // 5 seconds
```

### Alert Duration
Defined in `frontend/src/hooks/useFireAlerts.js`:
```javascript
const ALERT_DURATION = 45; // 45 seconds
```

---

## Color Palette (Gruvbox Theme)

- **Critical Red:** `#fb4934` - Fire alerts, critical status
- **Orange:** `#fe8019` - Urgent state, highlights
- **Yellow:** `#fabd2f` - Escalated state, warnings
- **Green:** `#b8bb26` - Safety features, success
- **Background Dark:** `#1d2021` - Main background
- **Background Alt:** `#2a2520` - Card backgrounds
- **Border:** `#323633` - Subtle borders
- **Text Primary:** `#f7f5ed` - Main text
- **Text Secondary:** `#bdae93` - Secondary text
- **Text Muted:** `#8b928a` - Labels, metadata

---

## Animations

### Fire Icon Flicker
```css
@keyframes fireIconFlicker {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}
```

### Building Pulse
```css
@keyframes buildingFirePulse {
  0%, 100% { border-color: rgba(251, 73, 52, 0.4); }
  50% { border-color: rgba(254, 128, 25, 0.6); }
}
```

### Urgent Alert Pulse
```css
@keyframes pulseUrgent {
  0%, 100% { border-color: #fe8019; }
  50% { border-color: #fb4934; }
}
```

### Slide In Animation
```css
@keyframes slideInRight {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

---

## Future Enhancements

### Near-term (Placeholder)
- [ ] Integrate with ERSS 112 dispatch system
- [ ] Real-time notification via WebSocket instead of polling
- [ ] Email/SMS notifications to building owner
- [ ] Push notifications via browser API

### Long-term
- [ ] Multi-building support (remove hardcoded building_id = 1)
- [ ] User-based building ownership filtering
- [ ] Historical incident playback with video timeline
- [ ] 3D hologram view in incident detail
- [ ] Severity prediction using AI
- [ ] Integration with fire department dispatch systems
- [ ] Mobile app for owner alerts
- [ ] Voice alerts via browser speech API

---

## Troubleshooting

### Alerts Not Appearing
1. Check backend is running: `http://localhost:3001/api/incidents/active-alerts`
2. Verify incidents exist with `building_id = 1` and `status = 'DETECTED'`
3. Check browser console for polling logs: "🔄 Starting fire alerts polling..."
4. Verify frontend can reach backend (CORS, network)

### Building Not Highlighting
1. Verify building exists in database with `id = 1`
2. Check `buildingsWithAlerts` array in React DevTools
3. Ensure CSS class `.building-fire-alert` is applied
4. Check ApexConsole.css is loaded

### Evidence Frames Not Loading
1. Check incident has evidence frames in database
2. Verify file paths in `evidence` table
3. Check backend serves images via `/api/incidents/:id/frames/:n`
4. Look for 404 errors in browser Network tab

### Timer Not Counting Down
1. Check `timeRemaining` updates in React DevTools
2. Verify interval is created in useFireAlerts hook
3. Check console for timer creation logs
4. Ensure alert is not already escalated or dismissed

---

## Testing Checklist

- [x] Backend endpoint returns active alerts
- [x] Frontend polls every 5 seconds
- [x] New alerts trigger notifications
- [x] Countdown timer displays correctly (MM:SS)
- [x] Timer updates every second
- [x] Last 10 seconds show urgent state
- [x] Acknowledge button updates database
- [x] Acknowledge navigates to building view
- [x] Building highlights in sidebar
- [x] Organization shows fire indicator
- [x] Evidence frames load and display
- [x] Frame selection works
- [x] Auto-escalation triggers at 0 seconds
- [x] Escalation toast appears
- [x] Console logs escalation messages
- [x] Alert changes to escalated state
- [x] Multiple alerts stack properly
- [x] Back button returns to building view
- [x] Responsive design works on mobile
- [x] Error states display correctly
- [x] Loading states show spinner

---

## Performance Considerations

- **Polling Frequency:** 5 seconds balances real-time updates with server load
- **Alert Limit:** API returns max 10 active alerts to prevent UI overflow
- **Image Loading:** Evidence frames load on-demand, not all at once
- **Timer Intervals:** Cleared properly to prevent memory leaks
- **React Keys:** Unique keys on all mapped elements for efficient re-renders
- **CSS Animations:** Hardware-accelerated transforms for smooth performance

---

## Security Notes

⚠️ **Production Considerations:**
- API endpoints should require authentication
- Building access should be filtered by user ownership
- Rate limiting should be implemented on polling endpoint
- Evidence frame access should be authorized per user
- Incident acknowledgment should be logged with user ID
- CORS should be properly configured for production domains

---

## Credits

**Developed for:** SIH 2026 - Atmarakshak Fire Safety Platform  
**Component Design:** Gruvbox-inspired color scheme  
**Icons:** Lucide React  
**Animations:** CSS3 with hardware acceleration  
**Architecture:** React Hooks + Express.js REST API
