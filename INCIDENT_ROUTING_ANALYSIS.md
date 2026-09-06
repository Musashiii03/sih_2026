# Atmarakshak Incident Routing & Dynamic Dispatch URL Analysis

> **Date:** September 06, 2026  
> **Target System:** Atmarakshak Emergency Response & ERSS 112 Fire Dispatch  
> **Status:** Analyzed & Verified via Live Browser Subagent & API Testing  

---

## Executive Summary

| Feature / Capability | Current Status | Verdict / Real-World Behavior |
| :--- | :---: | :--- |
| **Base Dispatch URL (`/dispatch`)** | 🟢 **Working** | Loads `DispatchConsole.jsx`, connects to backend API (`http://localhost:3001/api/incidents`), displays 4 live active incidents, CCTV streams, and AI telemetry. |
| **Incident Queue Selection** | 🟡 **Partial (State Only)** | Clicking incidents in the left queue updates center views via local React state, but **does NOT update the browser address bar** (URL stays static at `/dispatch`). |
| **Direct URL to Real Incidents (`/dispatch/:id`)** | 🔴 **Fails ("Incident not found")** | Navigating to real backend incidents (e.g. `/dispatch/INC-20260830-230334`) triggers a 404 screen because the route loads `IncidentDashboard.jsx`, which only checks a hardcoded static file (`incidents.js`). |
| **Direct URL to Hardcoded Mock Incidents** | 🟢 **Working (Mock Only)** | Navigating to `/dispatch/INC-00142` loads the static detail view, but is disconnected from live backend database/sensors. |
| **Owner Console → Dispatch Handoff** | 🔴 **Missing Deep Links** | The Owner Console has no action button to route or escalate an incident directly into the dynamic Fire Dispatch URL. |

---

## Live Browser & Subagent Test Results

Testing was conducted using live browser instrumentation against `http://localhost:5173` with the backend API running on `http://localhost:3001`.

### Test Case 1: Base Dispatch Route (`http://localhost:5173/dispatch`)
- **Action:** Open `http://localhost:5173/dispatch` directly.
- **Observed Result:** 
  - Console loads with header `Mumbai Central — ERSS / 112`, `Operator: Amara Singh`, and `4 Active`.
  - The left queue loads 5 items (`INC-20260830-230334` etc.).
  - CCTV player, AI analysis, and facility metadata load properly.
- **Verdict:** **PASSED**

### Test Case 2: In-Page Queue Item Click
- **Action:** Click the second incident in the left queue.
- **Observed Result:**
  - Component re-renders with the clicked incident details.
  - **Browser address bar remains strictly `http://localhost:5173/dispatch`**.
  - No route change occurs; no history entry is pushed.
- **Verdict:** **FAILED (URL is not dynamic)**

### Test Case 3: Direct Dynamic Route to Real Backend Incident (`http://localhost:5173/dispatch/INC-20260830-230334`)
- **Action:** Direct browser navigation to `/dispatch/INC-20260830-230334`.
- **Observed Result:**
  - Screen displays: **"Incident not found"** with `← Back to Dispatch` button.
  - Root Cause: In `App.jsx`, `/dispatch/:incidentId` routes to `IncidentDashboard.jsx`. `IncidentDashboard` only looks up `getIncident(incidentId)` in `frontend/src/data/incidents.js`, which only contains 3 static demo IDs (`INC-00142`, `INC-00141`, `INC-00139`).
- **Verdict:** **FAILED (Real incident URL routing is broken)**

### Test Case 4: Direct Dynamic Route to Mock Incident (`http://localhost:5173/dispatch/INC-00142`)
- **Action:** Direct browser navigation to `/dispatch/INC-00142`.
- **Observed Result:**
  - Successfully renders `IncidentDashboard.jsx` for `#00142` (Arjun Tech Park — Block B).
  - Displays sensor telemetry (Smoke 850 ppm, Temp 62°C) and unit dispatch controls (Engine 12, Ladder 7, Ambulance 3).
- **Verdict:** **PASSED (For legacy static mocks only)**

---

## Architectural Root Causes

```
                     ┌──────────────────────────────────────────────────────────┐
                     │                         App.jsx                          │
                     └────────────┬─────────────────────────────┬───────────────┘
                                  │                             │
                     Path: "/dispatch"             Path: "/dispatch/:incidentId"
                                  │                             │
                                  ▼                             ▼
                     ┌────────────────────────┐    ┌───────────────────────────┐
                     │  DispatchConsole.jsx   │    │   IncidentDashboard.jsx   │
                     │  (Modern 3-Column UI)  │    │  (Legacy Standalone View) │
                     └────────────┬───────────┘    └─────────────┬─────────────┘
                                  │                             │
                     Fetches Real Backend API       Checks Static Hardcoded Array
                     (GET /api/incidents)          (src/data/incidents.js)
                                  │                             │
                     • Ignores URL parameter        • Real IDs trigger "Not Found"
                     • Queue clicks don't update    • Only works for 3 mock IDs
                       the browser URL
```

1. **Dual Incompatible Components:**
   - `/dispatch` mounts `DispatchConsole.jsx` (the modern ERSS 112 console connected to the backend).
   - `/dispatch/:incidentId` mounts `IncidentDashboard.jsx` (an older static component).
2. **Missing Router Hook in `DispatchConsole.jsx`:**
   - `DispatchConsole` does not call `useParams()` to inspect `:incidentId` from the URL.
   - `QueueItem` click handler only executes `onClick={() => setSelectedId(inc.incident_id)}` without invoking `navigate('/dispatch/' + inc.incident_id)`.
3. **Hook Ignores External Route State:**
   - `useIncidentData.js` defaults `selectedId` to `list[0].incident_id`, ignoring any URL path or query parameter.

---

## What Needs to Be Fixed (Implementation Plan)

### Step 1: Unify Route Configuration in `App.jsx`
Allow `DispatchConsole` to handle both `/dispatch` and `/dispatch/:incidentId`:
```jsx
function DispatchLayout() {
  return (
    <div className="atma-layout">
      <div className="atma-main-full">
        <Routes>
          <Route path="/" element={<DispatchConsole />} />
          <Route path="/:incidentId" element={<DispatchConsole />} />
        </Routes>
      </div>
    </div>
  );
}
```

### Step 2: Make `DispatchConsole.jsx` URL-Aware
- Read `const { incidentId } = useParams();`
- When selecting an incident from the queue, call `navigate(`/dispatch/${inc.incident_id}`);`
- Sync `selectedId` state with `incidentId` from the URL.

### Step 3: Pass URL Param into `useIncidentData` Hook
Update `useIncidentData(initialIncidentId)`:
- If `initialIncidentId` is provided in the URL, fetch and display that incident immediately.
- If not provided, fallback to the latest active incident from `/api/incidents`.

### Step 4: Add Deep-Linking from Owner Console (`OwnerConsole.jsx`)
In the Incident Record view of `OwnerConsole.jsx`, add an **"ESCALATE TO ERSS FIRE DISPATCH →"** button:
```jsx
<button 
  className="apex-ack-btn" 
  onClick={() => navigate(`/dispatch/${selectedIncident.id}`)}
>
  OPEN IN ERSS DISPATCH
</button>
```

---

## Conclusion

Is incident routing working?
- **Static routing to hardcoded mock incidents works.**
- **Dynamic URL routing for real backend incidents is currently NOT working.**
- Making the Fire Dispatch URL dynamic requires:
  1. Routing `/dispatch/:incidentId` to the active `DispatchConsole` component.
  2. Syncing queue item clicks with `useNavigate()` to update the browser URL.
  3. Reading `useParams()` in `useIncidentData()` to load any bookmarked or shared incident link.
