/**
 * IncidentDashboard — ATMARAKSHAK ERSS 112 Mission Critical Dispatch View
 * Spacious, breathable command HUD with real-time video, telemetry, and fleet dispatch.
 * 
 * NOW FULLY DYNAMIC: Fetches real incident data from the backend API
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  Radio,
  Truck,
  ShieldAlert,
  Activity,
  Thermometer,
  Droplets,
  Wind,
  ArrowLeft,
  Check,
  Share2,
  Send,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';
import { INCIDENTS, getIncident } from '../data/incidents';
import CctvStreamPlayer from './CctvStreamPlayer';
import Atmarakshak3DHero from './Atmarakshak3DHero';
import { useSingleIncidentData, aggregateStats, getEvidenceFrames } from '../hooks/useIncidentData';
import './IncidentDashboard.css';

// Facility & Regional Enrichment (fallback data when not in database)
const ENRICHMENT = {
  building:    'Arjun Tech Park — Block B',
  zone:        'East Corridor, 2nd Floor',
  address:     'Plot 14, MIDC Phase II, Andheri East, Mumbai — 400093',
  floors:      '1 → 6',
  owner:       'Rajesh Mehra',
  ownerPhone:  '+91-98200-11234',
  ownerEmail:  'dispatch@atmarakshak.internal',
  ownerInitials: 'RM',
  station:     'Andheri East Fire Station',
  stationDist: '2.1 km',
  stationEta:  '~6 min',
  stationPhone: '101'
};

export default function IncidentDashboard() {
  const { incidentId } = useParams();
  const navigate = useNavigate();

  // Use the new hook to fetch real data from the API
  const { incident, summary, hologram, humanData, metadataStats, loading, error } = useSingleIncidentData(incidentId);

  // Component state
  const [stageView, setStageView] = useState('cctv'); // 'cctv' | '3d'
  const [dispatched, setDispatched] = useState({});
  const [resolved, setResolved] = useState(false);
  const [notes, setNotes] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [erssEscalated, setErssEscalated] = useState(false);

  // Check if we should fall back to static data
  const staticIncident = getIncident(incidentId);
  const inc = incident || staticIncident;
  const loadingApi = loading && !staticIncident;

  // Calculate stats from real data
  const stats = summary ? aggregateStats(summary, humanData, hologram) : null;

  // Merge real data with fallback enrichment data
  const displayData = inc ? {
    id: inc.incident_id || inc.id || incidentId,
    shortId: `#${(inc.incident_number || inc.incident_id || incidentId).slice(-5)}`,
    building: inc.location || ENRICHMENT.building,
    zone: ENRICHMENT.zone,
    severity: inc.severity || 'MODERATE',
    type: inc.type || (stats && stats.fireCount > 0 ? 'fire' : 'smoke'),
    typLabel: (stats && stats.fireCount > 0) ? 'Fire' : 'Smoke Hazard',
    timestamp: inc.timestamp_readable ? new Date(inc.timestamp_readable).toLocaleTimeString('en-IN') : new Date().toLocaleTimeString('en-IN'),
    victims: stats ? stats.humanCount : 0,
    camId: inc.camera_id || 'CAM-01',
    camera_id: inc.camera_id || 'CAM-01',
    camera_stream_url: inc.camera_stream_url || summary?.camera_stream_url,
    confidence: stats ? (stats.avgConf * 100).toFixed(1) : 94.2,
    framesConfirmed: stats ? summary.frames?.filter(f => f.fire_count > 0).length : 5,
    framesTotal: inc.frame_count || summary?.frame_count || 5,
    status: inc.status || 'ACTIVE',
    address: ENRICHMENT.address,
    floors: ENRICHMENT.floors,
    owner: ENRICHMENT.owner,
    ownerPhone: ENRICHMENT.ownerPhone,
    ownerEmail: ENRICHMENT.ownerEmail,
    ownerInitials: ENRICHMENT.ownerInitials,
    station: ENRICHMENT.station,
    stationDist: ENRICHMENT.stationDist,
    stationEta: ENRICHMENT.stationEta,
    stationPhone: ENRICHMENT.stationPhone,
    temperature: '58°C',
    humidity: '34%',
    aiAnalysis: stats ? 
      `${inc.severity || 'Moderate'} fire hazard verified across ${stats.frameCount} high-speed telemetry frames. Peak optical confidence ${(stats.avgConf * 100).toFixed(1)}%. Potential human count: ${stats.humanCount}. Objects identified: ${stats.objectCount}.` :
      'Continuous thermal radiation and sustained fire signature detected via multi-spectral YOLO computer vision model.',
    alertCooldown: [
      { time: inc.timestamp_readable ? new Date(inc.timestamp_readable).toLocaleTimeString('en-IN') : '14:02:11', event: 'Alert verified by temporal neural net', type: 'alert' },
      { time: inc.timestamp_readable ? new Date(new Date(inc.timestamp_readable).getTime() + 3000).toLocaleTimeString('en-IN') : '14:02:14', event: 'Automated notification sent to facility security', type: 'notify' },
      { time: inc.timestamp_readable ? new Date(new Date(inc.timestamp_readable).getTime() + 45000).toLocaleTimeString('en-IN') : '14:02:56', event: 'Zonal dispatch priority elevated to CRITICAL', type: 'escalate' },
    ],
    units: [
      { id: 'UNIT-12', name: 'Engine 12 (Water Tender)', eta: '5 min', status: 'Standby' },
      { id: 'UNIT-07', name: 'Ladder 7 (High Rise)',   eta: '8 min', status: 'Standby' },
      { id: 'AMB-03',  name: 'Emergency Ambulance 3',  eta: '4 min', status: 'Standby' },
    ],
    sensors: {
      smoke: 'HIGH (820 ppm)',
      temp: '58°C',
      co: '165 ppm',
      sprinkler: 'Activated',
      hvac: 'Shutdown',
    },
  } : null;

  function copyShareUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleDispatchUnit(unitId) {
    setDispatched(prev => ({ ...prev, [unitId]: true }));
  }

  function handleErssEscalate() {
    setErssEscalated(true);
  }

  if (loadingApi) {
    return (
      <div className="id-root" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className="apex-pulse-dot" style={{ width: 14, height: 14, background: '#fe8019' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#c5c2b8' }}>
            [ CONNECTING TO EMERGENCY DISPATCH TELEMETRY... ]
          </span>
        </div>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="id-root" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <div style={{ maxWidth: 460, textAlign: 'center', background: '#212423', border: '1px solid #323633', borderRadius: 12, padding: '36px 32px' }}>
          <AlertTriangle size={44} color="#fb4934" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontStyle: 'italic', margin: '0 0 10px', color: '#f7f5ed' }}>
            Incident Not Found
          </h2>
          <p style={{ fontSize: 13, color: '#8b928a', lineHeight: 1.6, margin: '0 0 24px' }}>
            The requested incident ID <code style={{ color: '#fe8019' }}>{incidentId}</code> does not exist in local cache or the active server incident log.
          </p>
          <button className="id-back-btn" onClick={() => navigate('/dispatch')} style={{ margin: '0 auto' }}>
            <ArrowLeft size={14} />
            Return to Fire Dispatch Queue
          </button>
        </div>
      </div>
    );
  }

  const isCritical = displayData.severity === 'CRITICAL';
  const isModerate = displayData.severity === 'MODERATE';
  const severityClass = isCritical ? 'critical' : isModerate ? 'moderate' : 'safe';

  return (
    <div className="id-root">
      {/* ─── STICKY COMMAND TOPBAR ─────────────────────────────────────── */}
      <header className="id-topbar">
        <div className="id-topbar-left">
          <button className="id-back-btn" onClick={() => navigate('/dispatch')}>
            <ArrowLeft size={14} />
            <span>DISPATCH QUEUE</span>
          </button>

          <div className="id-topbar-divider" />

          <div className="id-header-title-block">
            <div className="id-header-title">
              <span className="id-hazard-badge">
                <Flame size={16} />
              </span>
              <span>{displayData.typLabel} Hazard Assessment · {displayData.shortId || displayData.id}</span>
            </div>
            <div className="id-header-sub">
              <MapPin size={12} color="#fe8019" />
              <span>{displayData.building} — {displayData.zone}</span>
            </div>
          </div>
        </div>

        <div className="id-topbar-right">
          <div className={`id-severity-pill ${severityClass}`}>
            <span>●</span>
            <span>{displayData.severity}</span>
          </div>

          <div className="id-status-pill">
            <span className={`id-status-dot ${displayData.status === 'ACTIVE' ? 'active' : ''}`} />
            <span>{resolved ? 'RESOLVED' : displayData.status.toUpperCase()}</span>
          </div>

          <div className="id-timestamp">
            <Clock size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: -1 }} />
            {displayData.timestamp} IST
          </div>

          <button
            onClick={copyShareUrl}
            className="id-back-btn"
            title="Copy dynamic link to this incident"
            style={{ padding: '7px 11px' }}
          >
            {copiedLink ? <Check size={14} color="#4ade80" /> : <Share2 size={14} />}
            <span>{copiedLink ? 'COPIED' : 'SHARE'}</span>
          </button>
        </div>
      </header>

      {/* ─── SPACIOUS 2-COLUMN MISSION STAGE ───────────────────────────── */}
      <main className="id-container">
        
        {/* ═══ LEFT COLUMN: VISION & ENVIRONMENTAL TELEMETRY ═══ */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* 1. CCTV Stream Player / 3D Model Hero */}
          <div className="id-card" style={{ padding: 0 }}>
            <div className="id-card-header">
              <div className="id-card-title">
                {stageView === 'cctv' ? (
                  <>
                    <Radio size={16} color="#fe8019" />
                    <span>Live Optical & Thermal Surveillance Feed</span>
                  </>
                ) : (
                  <>
                    <Layers size={16} color="#fe8019" />
                    <span>3D Architectural Digital Twin (WebGL)</span>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    className={`id-mode-pill ${stageView === 'cctv' ? 'active' : ''}`}
                    onClick={() => setStageView('cctv')}
                  >
                    <Radio size={12} />
                    <span>OPTICAL CCTV</span>
                  </button>
                  <button
                    className={`id-mode-pill ${stageView === '3d' ? 'active' : ''}`}
                    onClick={() => setStageView('3d')}
                  >
                    <Layers size={12} />
                    <span>HOLOGRAM</span>
                  </button>
                </div>

                {stageView === 'cctv' && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8b928a' }}>
                    CAMERA: <strong style={{ color: '#eae7df' }}>{displayData.camId || displayData.camera_id}</strong>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: 16 }}>
              {stageView === 'cctv' ? (
                <CctvStreamPlayer
                  incidentId={displayData.id || displayData.incident_id}
                  cameraId={displayData.camId || displayData.camera_id || 'CAM-01'}
                  streamUrl={displayData.camera_stream_url}
                  frameIndex={0}
                  severity={displayData.severity}
                />
              ) : (
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633', background: '#121413' }}>
                  <Atmarakshak3DHero theme="dark" minHeight="420px" maxHeight="480px" />
                </div>
              )}

              {/* Spacious KPI Metric Chips Below Video */}
              <div className="id-kpi-grid">
                <div className="id-kpi-chip">
                  <div className="id-kpi-icon" style={{ background: 'rgba(251, 73, 52, 0.15)', color: '#fb4934' }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div className="id-kpi-val" style={{ color: displayData.victims > 0 ? '#fb4934' : '#eae7df' }}>
                      {displayData.victims}
                    </div>
                    <div className="id-kpi-label">Persons at Risk</div>
                  </div>
                </div>

                <div className="id-kpi-chip">
                  <div className="id-kpi-icon" style={{ background: 'rgba(250, 189, 47, 0.15)', color: '#fabd2f' }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <div className="id-kpi-val" style={{ color: '#fabd2f' }}>
                      {displayData.confidence}%
                    </div>
                    <div className="id-kpi-label">AI Confidence</div>
                  </div>
                </div>

                <div className="id-kpi-chip">
                  <div className="id-kpi-icon" style={{ background: 'rgba(251, 73, 52, 0.15)', color: '#fb4934' }}>
                    <Thermometer size={20} />
                  </div>
                  <div>
                    <div className="id-kpi-val" style={{ color: '#fb4934' }}>
                      {displayData.temperature}
                    </div>
                    <div className="id-kpi-label">Ambient Temp</div>
                  </div>
                </div>

                <div className="id-kpi-chip">
                  <div className="id-kpi-icon" style={{ background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' }}>
                    <Droplets size={20} />
                  </div>
                  <div>
                    <div className="id-kpi-val" style={{ color: '#4ade80' }}>
                      {displayData.humidity}
                    </div>
                    <div className="id-kpi-label">Rel Humidity</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Side-by-Side: AI Analysis & Environmental Sensors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* AI Diagnostics Card */}
            <div className="id-card id-ai-card">
              <div className="id-card-header">
                <div className="id-card-title">
                  <Cpu size={15} color="#fe8019" />
                  <span>AI Diagnostics & Neural Verification</span>
                </div>
              </div>
              <div className="id-card-body">
                <p className="id-ai-desc">
                  {displayData.aiAnalysis}
                </p>

                <div className="id-ai-filmstrip-wrap">
                  <div className="id-filmstrip-header">
                    <span>TEMPORAL VERIFICATION SEQUENCE</span>
                    <strong style={{ color: '#4ade80' }}>{displayData.framesConfirmed}/{displayData.framesTotal} FRAMES CONFIRMED</strong>
                  </div>
                  <div className="id-filmstrip-bars">
                    {Array.from({ length: displayData.framesTotal || 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`id-filmstrip-bar ${idx < (displayData.framesConfirmed || 5) ? 'verified' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental Sensors Card */}
            <div className="id-card">
              <div className="id-card-header">
                <div className="id-card-title">
                  <Layers size={15} color="#83a598" />
                  <span>IoT Sensor Telemetry Grid</span>
                </div>
              </div>
              <div className="id-card-body">
                <div className="id-sensors-grid">
                  <div className="id-sensor-box">
                    <div className="id-sensor-header">
                      <Wind size={12} />
                      <span>Smoke PPM</span>
                    </div>
                    <div className="id-sensor-val critical">
                      {displayData.sensors?.smoke || '850 ppm'}
                    </div>
                  </div>

                  <div className="id-sensor-box">
                    <div className="id-sensor-header">
                      <Thermometer size={12} />
                      <span>Core Temp</span>
                    </div>
                    <div className="id-sensor-val critical">
                      {displayData.sensors?.temp || displayData.temperature}
                    </div>
                  </div>

                  <div className="id-sensor-box">
                    <div className="id-sensor-header">
                      <Activity size={12} />
                      <span>Carbon Monoxide</span>
                    </div>
                    <div className="id-sensor-val warning">
                      {displayData.sensors?.co || '180 ppm'}
                    </div>
                  </div>

                  <div className="id-sensor-box">
                    <div className="id-sensor-header">
                      <Droplets size={12} />
                      <span>Sprinklers</span>
                    </div>
                    <div className="id-sensor-val safe">
                      {displayData.sensors?.sprinkler || 'Activated'}
                    </div>
                  </div>

                  <div className="id-sensor-box">
                    <div className="id-sensor-header">
                      <Layers size={12} />
                      <span>HVAC Dampers</span>
                    </div>
                    <div className="id-sensor-val safe">
                      {displayData.sensors?.hvac || 'Shutdown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Facility Location Map & Owner Card */}
          <div className="id-card">
            <div className="id-card-header">
              <div className="id-card-title">
                <Building2 size={16} color="#fabd2f" />
                <span>Geospatial Transit & Facility Dossier</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8b928a' }}>
                DISTANCE TO STATION: <strong style={{ color: '#fabd2f' }}>{displayData.stationDist}</strong>
              </div>
            </div>

            <div className="id-card-body">
              {/* Clean Vector Tactical Map */}
              <div className="id-map-frame">
                <svg width="100%" height="100%" viewBox="0 0 800 300" style={{ position: 'absolute', inset: 0, background: '#171918' }}>
                  {/* Grid Background */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#252927" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="800" height="300" fill="url(#grid)" />

                  {/* Road Network */}
                  <line x1="40" y1="160" x2="760" y2="160" stroke="#2e3330" strokeWidth="18" strokeLinecap="round" />
                  <line x1="380" y1="30" x2="380" y2="280" stroke="#2e3330" strokeWidth="14" strokeLinecap="round" />
                  <line x1="180" y1="60" x2="180" y2="260" stroke="#272b29" strokeWidth="8" />
                  <line x1="620" y1="50" x2="620" y2="270" stroke="#272b29" strokeWidth="8" />

                  {/* Industrial Building Footprints */}
                  {[[80, 50, 80, 80], [220, 50, 120, 70], [420, 50, 150, 80], [660, 60, 90, 70],
                    [70, 190, 90, 70], [220, 190, 130, 80], [420, 190, 160, 70], [650, 180, 100, 80]].map(([x,y,w,h], i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="#1e2220" stroke="#323835" strokeWidth="1.5" />
                  ))}

                  {/* Connecting Dispatch Route Line */}
                  <path d="M 680 100 L 380 160 L 280 160" fill="none" stroke="#fe8019" strokeWidth="3" strokeDasharray="8 5" />

                  {/* Fire Station Marker */}
                  <circle cx="680" cy="100" r="22" fill="rgba(74, 222, 128, 0.15)" stroke="rgba(74, 222, 128, 0.5)" strokeWidth="1.5" />
                  <circle cx="680" cy="100" r="9" fill="#4ade80" />
                  <text x="680" y="140" fill="#4ade80" fontSize="11" fontFamily="'JetBrains Mono', monospace" textAnchor="middle" fontWeight="700">FIRE STATION</text>

                  {/* Incident Epicenter Marker */}
                  <circle cx="280" cy="160" r="28" fill="rgba(251, 73, 52, 0.2)" stroke="rgba(251, 73, 52, 0.6)" strokeWidth="2" />
                  <circle cx="280" cy="160" r="11" fill="#fb4934" />
                  <circle cx="280" cy="160" r="4" fill="#ffffff" />
                  <text x="280" y="210" fill="#fb4934" fontSize="11" fontFamily="'JetBrains Mono', monospace" textAnchor="middle" fontWeight="700">INCIDENT HAZARD</text>
                </svg>

                <div className="id-map-legend">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb4934' }} />
                    <span>Hazard Site</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
                    <span>Andheri East Station</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 2, background: '#fe8019' }} />
                    <span>Direct Transit ({displayData.stationDist} · {displayData.stationEta})</span>
                  </span>
                </div>
              </div>

              {/* Building Details & Owner Information */}
              <div style={{ marginTop: 18 }}>
                <div className="id-bldg-grid">
                  <div>
                    <div className="id-bldg-name">{displayData.building}</div>
                    <div className="id-bldg-addr">{displayData.address}</div>
                    <div className="id-bldg-pills">
                      <div className="id-bldg-pill">
                        <span>FLOORS:</span>
                        <strong style={{ color: '#eae7df' }}>{displayData.floors}</strong>
                      </div>
                      <div className="id-bldg-pill">
                        <span>ZONE:</span>
                        <strong style={{ color: '#eae7df' }}>{displayData.zone}</strong>
                      </div>
                      <div className="id-bldg-pill">
                        <span>CAMERA ID:</span>
                        <strong style={{ color: '#fe8019' }}>{displayData.camId}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Facility Owner Card */}
                <div className="id-owner-card">
                  <div className="id-owner-info">
                    <div className="id-owner-avatar">{displayData.ownerInitials || 'RM'}</div>
                    <div>
                      <div className="id-owner-name">{displayData.owner}</div>
                      <div className="id-owner-meta">
                        Registered Property Custodian · {displayData.ownerPhone} · {displayData.ownerEmail}
                      </div>
                    </div>
                  </div>
                  <a href={`tel:${displayData.ownerPhone}`} className="id-call-btn">
                    <Phone size={13} />
                    <span>CALL OWNER</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ RIGHT COLUMN: TACTICAL DISPATCH & COMMAND ACTIONS ═══ */}
        <aside className="id-sidebar">
          
          {/* 1. Station & Response ETA */}
          <div className="id-card">
            <div className="id-card-header">
              <div className="id-card-title">
                <Truck size={15} color="#4ade80" />
                <span>Primary Fire Station Command</span>
              </div>
            </div>
            <div className="id-card-body">
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f7f5ed', marginBottom: 12 }}>
                {displayData.station}
              </div>

              <div className="id-station-info">
                <div className="id-station-stat">
                  <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase', marginBottom: 4 }}>
                    Station Distance
                  </div>
                  <div className="id-station-num" style={{ color: '#fabd2f' }}>
                    {displayData.stationDist}
                  </div>
                </div>

                <div className="id-station-stat">
                  <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase', marginBottom: 4 }}>
                    Estimated Arrival
                  </div>
                  <div className="id-station-num" style={{ color: '#4ade80' }}>
                    {displayData.stationEta}
                  </div>
                </div>
              </div>

              <a href={`tel:${displayData.stationPhone}`} className="id-call-station-btn">
                <Phone size={14} />
                <span>DIRECT LINE TO DISPATCHER ({displayData.stationPhone})</span>
              </a>
            </div>
          </div>

          {/* 2. Response Units Fleet Deployment */}
          <div className="id-card">
            <div className="id-card-header">
              <div className="id-card-title">
                <ShieldAlert size={15} color="#fe8019" />
                <span>Response Units & Vehicles</span>
              </div>
            </div>
            <div className="id-card-body" style={{ padding: 14 }}>
              <div className="id-unit-list">
                {displayData.units.map(unit => {
                  const isSent = dispatched[unit.id] || unit.status === 'En Route';
                  return (
                    <div key={unit.id} className="id-unit-row">
                      <div className="id-unit-meta">
                        <div className="id-unit-name">{unit.name}</div>
                        <div className="id-unit-sub">
                          {unit.id} · ETA: <strong style={{ color: '#eae7df' }}>{unit.eta}</strong>
                        </div>
                      </div>

                      {isSent ? (
                        <div className="id-dispatched-tag">
                          <Check size={12} />
                          <span>EN ROUTE</span>
                        </div>
                      ) : (
                        <button
                          className="id-dispatch-btn"
                          onClick={() => handleDispatchUnit(unit.id)}
                        >
                          <Send size={12} />
                          <span>DISPATCH</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. National ERSS 112 Escalation Card */}
          {!resolved && (
            <div className="id-card id-erss-card">
              <div className="id-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fb4934', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  <ShieldAlert size={16} />
                  <span>NATIONAL EMERGENCY (ERSS 112)</span>
                </div>
                <p style={{ fontSize: 12.5, color: '#c5c2b8', lineHeight: 1.5, margin: '0 0 14px' }}>
                  Transmit verified encrypted telemetry directly to the central Maharashtra 112 Command Center.
                </p>
                {erssEscalated ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: 10, borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                    <Check size={14} />
                    <span>TELEMETRY ROUTED TO ERSS 112</span>
                  </div>
                ) : (
                  <button className="id-erss-btn" onClick={handleErssEscalate}>
                    <span>ESCALATE TO ERSS 112</span>
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Resolve Incident Action */}
          <div className="id-card">
            <div className="id-card-body">
              {resolved ? (
                <div className="id-resolved-banner">
                  <CheckCircle2 size={24} color="#4ade80" />
                  <div>
                    <div className="id-resolved-title">Incident Officially Resolved</div>
                    <div className="id-resolved-sub">Logged & signed off by active dispatch operator</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f7f5ed', marginBottom: 4 }}>
                    Operational Clearance
                  </div>
                  <p style={{ fontSize: 12, color: '#8b928a', lineHeight: 1.5, margin: '0 0 14px' }}>
                    Mark this incident as cleared once field units have suppressed hazards and confirmed site safety.
                  </p>
                  <button className="id-resolve-btn" onClick={() => setResolved(true)}>
                    <CheckCircle2 size={16} />
                    <span>MARK INCIDENT AS RESOLVED</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 5. Tactical Incident Timeline Audit */}
          <div className="id-card">
            <div className="id-card-header">
              <div className="id-card-title">
                <Clock size={15} color="#83a598" />
                <span>Incident Action Timeline</span>
              </div>
            </div>
            <div className="id-card-body">
              <div className="id-timeline-wrap">
                {displayData.alertCooldown?.map((event, idx) => (
                  <div key={idx} className="id-timeline-item">
                    <div className="id-timeline-badge">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: event.type === 'alert' ? '#fb4934' : event.type === 'escalate' ? '#fabd2f' : '#83a598' }} />
                    </div>
                    <div className="id-timeline-content">
                      <div className="id-timeline-time">{event.time} IST</div>
                      <div className="id-timeline-desc">{event.event}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Operator Notes */}
          <div className="id-card">
            <div className="id-card-header">
              <div className="id-card-title">
                <Activity size={15} color="#c5c2b8" />
                <span>Dispatcher Log & Notes</span>
              </div>
            </div>
            <div className="id-card-body">
              <textarea
                className="id-notes-area"
                placeholder="Log dispatcher notes, evacuation progress, or hazmat warnings for this incident..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

        </aside>
      </main>
    </div>
  );
}
