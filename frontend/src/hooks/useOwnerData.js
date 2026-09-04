/**
 * useOwnerData
 *
 * Owner-specific data hook. Wraps the existing /api/incidents endpoint
 * and provides enriched building, camera, complaint and alert data for
 * the BUILDING_OWNER dashboard.
 *
 * Follows the same enrichment pattern as BUILDING_META / MOCK_CAMS in
 * the original OwnerConsole, and the INCIDENTS array in incidents.js.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useIncidentData, deriveSeverity, aggregateStats } from './useIncidentData';

// ── Owner profile (enrichment — maps to `owners` + `users` tables) ─────────
export const OWNER_PROFILE = {
  id: 'OWN-001',
  name: 'Rajesh Mehra',
  phone: '+91-98200-11234',
  email: 'r.mehra@arjuntechpark.in',
  initials: 'RM',
  role: 'BUILDING_OWNER',
  since: '2021-04-01',
};

// ── Buildings (maps to `buildings` + `ownerships` tables) ──────────────────
export const OWNER_BUILDINGS = [
  {
    id: 'BLD-ARJ-B-042',
    name: 'Arjun Tech Park — Block B',
    type: 'Commercial',
    address: 'Plot 14, MIDC Phase II, Andheri East, Mumbai — 400093',
    floors: 6,
    units: 48,
    occupancyType: 'Office',
    safetyStatus: 'CRITICAL',           // SAFE | ATTENTION | CRITICAL
    fireAlarm: true,
    sprinkler: true,
    fireExtinguishers: 24,
    fireExits: 4,
    fireHydrant: true,
    lastInspection: '2026-06-14',
    activeIncidents: 1,
    cameras: 4,
    camerasOnline: 3,
    floorPlans: '6 floors + terrace',
    latitude: 19.1136,
    longitude: 72.8697,
  },
  {
    id: 'BLD-SHL-A-011',
    name: 'Shalimar Residency — Tower A',
    type: 'Residential',
    address: 'Sector 18, Nerul, Navi Mumbai — 400706',
    floors: 14,
    units: 112,
    occupancyType: 'Residential',
    safetyStatus: 'ATTENTION',
    fireAlarm: true,
    sprinkler: false,
    fireExtinguishers: 28,
    fireExits: 3,
    fireHydrant: true,
    lastInspection: '2026-03-09',
    activeIncidents: 0,
    cameras: 6,
    camerasOnline: 5,
    floorPlans: '14 floors',
    latitude: 19.0368,
    longitude: 73.0166,
  },
  {
    id: 'BLD-WRH-D-007',
    name: 'Bharat Cold Warehouse — Unit D',
    type: 'Industrial',
    address: 'APMC Yard, Turbhe, Navi Mumbai — 400703',
    floors: 2,
    units: 8,
    occupancyType: 'Storage / Industrial',
    safetyStatus: 'SAFE',
    fireAlarm: true,
    sprinkler: true,
    fireExtinguishers: 18,
    fireExits: 6,
    fireHydrant: true,
    lastInspection: '2026-07-20',
    activeIncidents: 0,
    cameras: 8,
    camerasOnline: 8,
    floorPlans: '2 floors + loading bay',
    latitude: 19.0760,
    longitude: 73.0191,
  },
];

// ── Cameras (maps to `cameras` table) ─────────────────────────────────────
export const OWNER_CAMERAS = [
  // Arjun Tech Park Block B
  { id: 'CAM-01', code: 'ARJ-B-CAM-01', label: 'Main Lobby',          buildingId: 'BLD-ARJ-B-042', building: 'Arjun Tech Park — Block B', floor: 'G',   room: 'Lobby',          status: 'ONLINE',      lastSeen: 'Live',         aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-02', code: 'ARJ-B-CAM-02', label: 'East Corridor 2F',    buildingId: 'BLD-ARJ-B-042', building: 'Arjun Tech Park — Block B', floor: '2',   room: 'East Corridor',  status: 'ONLINE',      lastSeen: 'Live',         aiStatus: 'FIRE',    hasIncident: true  },
  { id: 'CAM-03', code: 'ARJ-B-CAM-03', label: 'Server Room B',       buildingId: 'BLD-ARJ-B-042', building: 'Arjun Tech Park — Block B', floor: '1',   room: 'Server Room B',  status: 'ONLINE',      lastSeen: 'Live',         aiStatus: 'SMOKE',   hasIncident: true  },
  { id: 'CAM-04', code: 'ARJ-B-CAM-04', label: 'Underground Parking', buildingId: 'BLD-ARJ-B-042', building: 'Arjun Tech Park — Block B', floor: 'B1',  room: 'Parking Level 1',status: 'OFFLINE',     lastSeen: '18 min ago',   aiStatus: 'UNKNOWN', hasIncident: false },
  // Shalimar Residency Tower A
  { id: 'CAM-05', code: 'SHL-A-CAM-01', label: 'Podium Entry',        buildingId: 'BLD-SHL-A-011', building: 'Shalimar Residency — Tower A', floor: 'P', room: 'Podium Entry',  status: 'ONLINE',      lastSeen: 'Live',         aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-06', code: 'SHL-A-CAM-02', label: 'Kitchen Block 3F',    buildingId: 'BLD-SHL-A-011', building: 'Shalimar Residency — Tower A', floor: '3', room: 'Kitchen Block', status: 'ONLINE',      lastSeen: 'Live',         aiStatus: 'SMOKE',   hasIncident: true  },
  { id: 'CAM-07', code: 'SHL-A-CAM-03', label: 'Stairwell A',        buildingId: 'BLD-SHL-A-011', building: 'Shalimar Residency — Tower A', floor: '7', room: 'Stairwell A',   status: 'ONLINE',      lastSeen: 'Live',         aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-08', code: 'SHL-A-CAM-04', label: 'Terrace Exit',        buildingId: 'BLD-SHL-A-011', building: 'Shalimar Residency — Tower A', floor: '14',room: 'Terrace',      status: 'MAINTENANCE', lastSeen: '2 days ago',   aiStatus: 'UNKNOWN', hasIncident: false },
  { id: 'CAM-09', code: 'SHL-A-CAM-05', label: 'Basement Parking',    buildingId: 'BLD-SHL-A-011', building: 'Shalimar Residency — Tower A', floor: 'B', room: 'Parking',      status: 'ONLINE',      lastSeen: 'Live',         aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-10', code: 'SHL-A-CAM-06', label: 'Fire Hose Cabinet 8F',buildingId: 'BLD-SHL-A-011', building: 'Shalimar Residency — Tower A', floor: '8', room: 'Corridor',     status: 'OFFLINE',     lastSeen: '4 hours ago',  aiStatus: 'UNKNOWN', hasIncident: false },
  // Bharat Cold Warehouse Unit D
  { id: 'CAM-11', code: 'WRH-D-CAM-01', label: 'Loading Bay Alpha',   buildingId: 'BLD-WRH-D-007', building: 'Bharat Cold Warehouse — Unit D', floor: 'G', room: 'Loading Bay A', status: 'ONLINE', lastSeen: 'Live',     aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-12', code: 'WRH-D-CAM-02', label: 'Cold Storage 1',      buildingId: 'BLD-WRH-D-007', building: 'Bharat Cold Warehouse — Unit D', floor: 'G', room: 'Cold Stor. 1', status: 'ONLINE', lastSeen: 'Live',     aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-13', code: 'WRH-D-CAM-03', label: 'Cold Storage 2',      buildingId: 'BLD-WRH-D-007', building: 'Bharat Cold Warehouse — Unit D', floor: '1', room: 'Cold Stor. 2', status: 'ONLINE', lastSeen: 'Live',     aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-14', code: 'WRH-D-CAM-04', label: 'Generator Room',      buildingId: 'BLD-WRH-D-007', building: 'Bharat Cold Warehouse — Unit D', floor: 'G', room: 'Gen. Room',    status: 'ONLINE', lastSeen: 'Live',     aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-15', code: 'WRH-D-CAM-05', label: 'Admin Office',        buildingId: 'BLD-WRH-D-007', building: 'Bharat Cold Warehouse — Unit D', floor: '1', room: 'Admin Office', status: 'ONLINE', lastSeen: 'Live',     aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-16', code: 'WRH-D-CAM-06', label: 'Roof Access',         buildingId: 'BLD-WRH-D-007', building: 'Bharat Cold Warehouse — Unit D', floor: 'R', room: 'Roof',         status: 'ONLINE', lastSeen: 'Live',     aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-17', code: 'WRH-D-CAM-07', label: 'Perimeter North',     buildingId: 'BLD-WRH-D-007', building: 'Bharat Cold Warehouse — Unit D', floor: 'G', room: 'Perimeter N',  status: 'ONLINE', lastSeen: 'Live',     aiStatus: 'NORMAL',  hasIncident: false },
  { id: 'CAM-18', code: 'WRH-D-CAM-08', label: 'Perimeter South',     buildingId: 'BLD-WRH-D-007', building: 'Bharat Cold Warehouse — Unit D', floor: 'G', room: 'Perimeter S',  status: 'ONLINE', lastSeen: 'Live',     aiStatus: 'NORMAL',  hasIncident: false },
];

// ── Complaints (maps to `complaints` table) ────────────────────────────────
export const OWNER_COMPLAINTS = [
  { id: 'CMP-0041', category: 'Blocked Fire Exit',     building: 'Arjun Tech Park — Block B', priority: 'HIGH',     status: 'Open',        date: '2026-09-02', reporter: 'Security Guard' },
  { id: 'CMP-0039', category: 'No Fire Extinguisher',  building: 'Shalimar Residency — Tower A', priority: 'MEDIUM',  status: 'In Progress', date: '2026-08-30', reporter: 'Resident' },
  { id: 'CMP-0037', category: 'Fire Alarm Failure',    building: 'Shalimar Residency — Tower A', priority: 'CRITICAL',status: 'Open',        date: '2026-08-28', reporter: 'Maintenance' },
  { id: 'CMP-0035', category: 'Electrical Hazard',     building: 'Bharat Cold Warehouse — Unit D', priority: 'LOW',  status: 'Resolved',    date: '2026-08-22', reporter: 'Manager' },
  { id: 'CMP-0033', category: 'Smoke Hazard',          building: 'Arjun Tech Park — Block B', priority: 'MEDIUM',  status: 'Resolved',    date: '2026-08-18', reporter: 'Tenant' },
  { id: 'CMP-0031', category: 'Fire Hazard',           building: 'Bharat Cold Warehouse — Unit D', priority: 'HIGH', status: 'Resolved',    date: '2026-08-10', reporter: 'Inspector' },
];

// ── Alerts / Notifications feed (maps to `notifications` table) ───────────
export const OWNER_ALERTS = [
  { id: 'ALT-0091', type: 'FIRE',           message: 'Fire detected on East Corridor, 2nd Floor.',          building: 'Arjun Tech Park — Block B',     camera: 'ARJ-B-CAM-02', time: '15:46:14', severity: 'CRITICAL', read: false },
  { id: 'ALT-0090', type: 'SMOKE',          message: 'Smoke detected in Server Room B.',                    building: 'Arjun Tech Park — Block B',     camera: 'ARJ-B-CAM-03', time: '15:46:11', severity: 'HIGH',     read: false },
  { id: 'ALT-0089', type: 'CAMERA_OFFLINE', message: 'Camera ARJ-B-CAM-04 went offline.',                  building: 'Arjun Tech Park — Block B',     camera: 'ARJ-B-CAM-04', time: '15:28:03', severity: 'MEDIUM',   read: false },
  { id: 'ALT-0088', type: 'SMOKE',          message: 'Smoke detected in Kitchen Block 3F.',                 building: 'Shalimar Residency — Tower A',  camera: 'SHL-A-CAM-02', time: '13:51:04', severity: 'HIGH',     read: true  },
  { id: 'ALT-0087', type: 'CAMERA_OFFLINE', message: 'Camera SHL-A-CAM-06 offline for 4+ hours.',          building: 'Shalimar Residency — Tower A',  camera: 'SHL-A-CAM-06', time: '11:42:17', severity: 'LOW',      read: true  },
  { id: 'ALT-0086', type: 'COMPLAINT',      message: 'New complaint: Blocked Fire Exit reported.',          building: 'Arjun Tech Park — Block B',     camera: null,           time: '09:14:32', severity: 'HIGH',     read: true  },
  { id: 'ALT-0085', type: 'SYSTEM',         message: 'Monthly safety inspection due in 3 days.',           building: 'Shalimar Residency — Tower A',  camera: null,           time: '08:00:00', severity: 'LOW',      read: true  },
  { id: 'ALT-0084', type: 'PERSON',         message: 'Person detected in restricted area — Gen. Room.',     building: 'Bharat Cold Warehouse — Unit D',camera: 'WRH-D-CAM-04', time: '2026-09-02 22:18', severity: 'MEDIUM', read: true },
];

// ── People safety enrichment (maps to `incident_people` table) ─────────────
export const PEOPLE_SAFETY = [
  {
    incidentId: 'INC-00142',
    building: 'Arjun Tech Park — Block B',
    floor: '2nd Floor',
    room: 'East Corridor',
    estimated: 4,
    possiblyTrapped: 2,
    evacuated: 1,
    rescued: 0,
    unknown: 1,
  },
  {
    incidentId: 'INC-00141',
    building: 'Shalimar Residency — Tower A',
    floor: '3rd Floor',
    room: 'Kitchen Block',
    estimated: 2,
    possiblyTrapped: 0,
    evacuated: 2,
    rescued: 0,
    unknown: 0,
  },
];

// ── Analytics seed data (maps to historical `incidents` aggregation) ────────
export function generateAnalyticsData(period = '30') {
  const days = period === 'today' ? 1 : period === '7' ? 7 : 30;
  const fireData = [];
  const smokeData = [];
  const now = Date.now();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const label = days === 1
      ? `${String(d.getHours()).padStart(2, '0')}:00`
      : `${d.getDate()}/${d.getMonth() + 1}`;
    fireData.push({ label, value: Math.floor(Math.random() * 3) });
    smokeData.push({ label, value: Math.floor(Math.random() * 4) });
  }

  const bySeverity = [
    { label: 'CRITICAL', value: 2, color: 'var(--critical)' },
    { label: 'HIGH',     value: 3, color: '#E87B2D' },
    { label: 'MEDIUM',   value: 5, color: 'var(--moderate)' },
    { label: 'LOW',      value: 4, color: 'var(--safe)' },
  ];

  const byBuilding = OWNER_BUILDINGS.map(b => ({
    label: b.name.split('—')[1]?.trim() || b.name,
    value: Math.floor(Math.random() * 4),
    color: 'var(--accent)',
  }));

  const cameraStatus = [
    { label: 'Online',      value: OWNER_CAMERAS.filter(c => c.status === 'ONLINE').length,      color: 'var(--safe)' },
    { label: 'Offline',     value: OWNER_CAMERAS.filter(c => c.status === 'OFFLINE').length,     color: 'var(--critical)' },
    { label: 'Maintenance', value: OWNER_CAMERAS.filter(c => c.status === 'MAINTENANCE').length, color: 'var(--moderate)' },
  ];

  return { fireData, smokeData, bySeverity, byBuilding, cameraStatus };
}

// ── Main hook ──────────────────────────────────────────────────────────────
export function useOwnerData() {
  const incidentHook = useIncidentData();
  const { incidents, loading, error, summary, metadataStats, refresh, selectedId, setSelectedId } = incidentHook;

  // Derive stats
  const stats = useMemo(() => aggregateStats(summary, metadataStats), [summary, metadataStats]);
  const severity = useMemo(() => summary ? deriveSeverity(summary) : 'UNKNOWN', [summary]);

  // KPI aggregates
  const kpis = useMemo(() => {
    const onlineCams = OWNER_CAMERAS.filter(c => c.status === 'ONLINE').length;
    const offlineCams = OWNER_CAMERAS.filter(c => c.status === 'OFFLINE').length;
    const activeIncidents = incidents.length > 0 ? incidents.length : 1; // at least show demo
    const openComplaints = OWNER_COMPLAINTS.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
    return {
      totalBuildings: OWNER_BUILDINGS.length,
      totalCameras: OWNER_CAMERAS.length,
      onlineCameras: onlineCams,
      offlineCameras: offlineCams,
      activeIncidents,
      openComplaints,
    };
  }, [incidents]);

  // Unread alerts count
  const unreadAlerts = OWNER_ALERTS.filter(a => !a.read).length;

  return {
    // From existing incident hook
    incidents,
    loading,
    error,
    summary,
    metadataStats,
    stats,
    severity,
    selectedId,
    setSelectedId,
    refresh,
    // Owner-specific
    kpis,
    buildings: OWNER_BUILDINGS,
    cameras: OWNER_CAMERAS,
    complaints: OWNER_COMPLAINTS,
    alerts: OWNER_ALERTS,
    unreadAlerts,
    peopleSafety: PEOPLE_SAFETY,
    owner: OWNER_PROFILE,
  };
}
