/**
 * DispatchConsole — ATMARAKSHAK ERSS / 112 Fire Dispatch Console
 * Spacious 3-Column Command Hub: Incident Queue | Live Vision Stage | Tactical Dispatch
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Flame,
  Building2,
  Brain,
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  Loader2,
  RefreshCw,
  X,
  MapPin,
  ChevronRight,
  AlertTriangle,
  Radio,
  User,
  Shield,
  Send,
  Layers,
  Activity,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import DispatchMap from './DispatchMap';
import IsometricHologram from './IsometricHologram';
import Atmarakshak3DHero from './Atmarakshak3DHero';
import CctvStreamPlayer, { StreamBadge } from './CctvStreamPlayer';
import {
  useIncidentData,
  frameImageUrl,
  deriveSeverity,
  getEvidenceFrames,
  aggregateStats
} from '../hooks/useIncidentData';
import './DispatchConsole.css';

// Facility & Regional Enrichment
const ENRICHMENT = {
  building:    'Arjun Tech Park — Block B',
  zone:        'East Corridor, 2nd Floor',
  address:     'Plot 14, MIDC Phase II, Andheri East, Mumbai — 400093',
  floors:      '1 → 6',
  owner:       'Rajesh Mehra',
  ownerPhone:  '+91-98200-11234',
  station:     'Andheri East Fire Station',
  stationDist: '2.1 km',
  stationEta:  '~6 min',
  stationPhone: '101'
};

// ── Image Modal ────────────────────────────────────────────────────────────
function ImageModal({ frame, incidentId, onClose }) {
  if (!frame) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backdropFilter: 'blur(6px)'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#212423',
          border: '1px solid #3c423e',
          borderRadius: 12,
          overflow: 'hidden',
          maxWidth: 820,
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: '#161817',
          borderBottom: '1px solid #323633'
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#f7f5ed' }}>
            FRAME #{frame.frame_index} · CONFIDENCE: {(frame.fire_confidence * 100).toFixed(1)}%
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8b928a', cursor: 'pointer', display: 'flex' }}
          >
            <X size={18} />
          </button>
        </div>
        <img
          src={frameImageUrl(incidentId, frame.frame_index)}
          alt="Enlarged Frame"
          style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain', background: '#0e100f' }}
        />
      </div>
    </div>
  );
}

// ── Horizontal Sleek Queue Item ─────────────────────────────────────────────
function QueueItem({ incident, selected, onClick, firstFrameIndex }) {
  const incId = incident.incident_id;
  const date = new Date(incident.timestamp * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  });

  return (
    <div
      className={`dc-queue-item ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="dc-queue-thumb">
        <img src={frameImageUrl(incId, firstFrameIndex)} alt="Thumbnail" />
      </div>

      {/* Meta Content */}
      <div className="dc-queue-meta">
        <div className="dc-queue-loc">
          {incident.location || 'Surveillance Sector'}
        </div>

        <div className="dc-queue-row">
          <span className="dc-queue-cam">{incident.camera_id || 'CAM-01'}</span>
          <span className="dc-queue-tag">ACTIVE HAZARD</span>
        </div>

        <div className="dc-queue-foot">
          <span>{incident.frame_count} frames captured</span>
          <span style={{ color: '#4ade80' }}>{date}</span>
        </div>
      </div>
    </div>
  );
}

// ── Center Main Incident Detail ─────────────────────────────────────────────
function IncidentDetail({ incident, summary, hologram, metadataStats, onSelectFrame }) {
  const [stageView, setStageView] = useState('cctv'); // 'cctv' | '3d'
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [resolved, setResolved] = useState(false);

  const severity = deriveSeverity(summary);
  const stats = aggregateStats(summary, metadataStats);
  const evidFrames = getEvidenceFrames(summary, 999);
  const humanCount = stats.humanCount;
  const avgConf = ((stats.avgConf || 0) * 100).toFixed(1);
  const incId = incident?.incident_id;
  const bestFrame = summary?.frames?.find(f => f.fire_count > 0)?.frame_index ?? 0;
  const framesConf = summary?.frames?.filter(f => f.fire_count > 0).length ?? 5;
  const framesTotal = Math.max(5, framesConf, summary?.frame_count ?? 5);

  const aiText = summary
    ? `${severity} fire hazard verified across ${stats.frameCount} high-speed telemetry frames. ` +
      `Peak optical confidence ${avgConf}%. Potential human count: ${humanCount}. Objects identified: ${stats.objectCount}. ` +
      `Temporal neural engine: ${framesConf}/${framesTotal} confirmed sequences.`
    : 'Synchronizing multi-sensor feed from edge detection unit...';

  const isCritical = severity === 'CRITICAL';
  const sevColor = isCritical ? '#fb4934' : '#fabd2f';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Incident Title Header */}
      <div className="dc-stage-header">
        <div className="dc-stage-title-wrap">
          <div className="dc-stage-title">
            <span>#{incId?.replace('INC-', '') ?? '00142'}</span> — {incident?.location || 'Primary Operational Facility'}
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            background: isCritical ? 'rgba(251, 73, 52, 0.15)' : 'rgba(250, 189, 47, 0.15)',
            color: sevColor,
            border: `1px solid ${sevColor}40`
          }}>
            ● {severity}
          </span>
        </div>

        <Link
          to={`/dispatch/${incId}`}
          className="dc-view-dossier-btn"
          title="Open comprehensive 2-column tactical assessment"
        >
          <span>FULL DOSSIER</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* CCTV / 3D Model Stage Card */}
      <div className="dc-video-card">
        <div className="dc-video-header">
          <div className="dc-video-title">
            {stageView === 'cctv' ? (
              <>
                <Radio size={15} color="#fb4934" />
                <span>Tactical Optical Surveillance Feed</span>
              </>
            ) : (
              <>
                <Layers size={15} color="#fe8019" />
                <span>3D Architectural Digital Twin (WebGL)</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className={`dc-mode-pill ${stageView === 'cctv' ? 'active' : ''}`}
                onClick={() => setStageView('cctv')}
              >
                <Radio size={12} />
                <span>OPTICAL CCTV</span>
              </button>
              <button
                className={`dc-mode-pill ${stageView === '3d' ? 'active' : ''}`}
                onClick={() => setStageView('3d')}
              >
                <Layers size={12} />
                <span>HOLOGRAM</span>
              </button>
            </div>

            {stageView === 'cctv' && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8b928a' }}>
                CAMERA: <strong style={{ color: '#eae7df' }}>{incident?.camera_id ?? summary?.camera_id ?? 'CAM-01'}</strong>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: 14 }}>
          {stageView === 'cctv' ? (
            <CctvStreamPlayer
              incidentId={incId}
              cameraId={incident?.camera_id ?? summary?.camera_id ?? 'CAM-01'}
              streamUrl={summary?.camera_stream_url !== undefined ? summary.camera_stream_url : incident?.camera_stream_url}
              frameIndex={bestFrame}
              severity={severity}
            />
          ) : (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633', background: '#121413' }}>
              <Atmarakshak3DHero theme="dark" minHeight="380px" maxHeight="440px" />
            </div>
          )}
        </div>
      </div>

      {/* Spacious 4-KPI Grid */}
      <div className="dc-kpi-grid">
        <div className="dc-kpi-box">
          <span className="dc-kpi-label">Persons at Risk</span>
          <span className="dc-kpi-val" style={{ color: humanCount > 0 ? '#fb4934' : '#4ade80' }}>
            {humanCount}
          </span>
        </div>

        <div className="dc-kpi-box">
          <span className="dc-kpi-label">AI Confidence</span>
          <span className="dc-kpi-val" style={{ color: '#fabd2f' }}>
            {avgConf}%
          </span>
        </div>

        <div className="dc-kpi-box">
          <span className="dc-kpi-label">Detections</span>
          <span className="dc-kpi-val" style={{ color: '#fb4934' }}>
            {stats.fireCount}
          </span>
        </div>

        <div className="dc-kpi-box">
          <span className="dc-kpi-label">Source Camera</span>
          <span className="dc-kpi-val" style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace" }}>
            {incident?.camera_id ?? summary?.camera_id ?? 'CAM-01'}
          </span>
        </div>
      </div>

      {/* Interactive Tabs for Deep Telemetry */}
      <div className="dc-tabs-nav">
        <button
          className={`dc-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Brain size={14} />
          <span>Overview & AI Analysis</span>
        </button>

        <button
          className={`dc-tab-btn ${activeTab === 'hologram' ? 'active' : ''}`}
          onClick={() => setActiveTab('hologram')}
        >
          <Layers size={14} />
          <span>3D Spatial Hologram</span>
        </button>

        <button
          className={`dc-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          <Activity size={14} />
          <span>Evidence Frames ({evidFrames.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview & AI Analysis */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Narrative Card */}
          <div className="dc-card">
            <div className="dc-section-label">
              <Brain size={14} color="#fe8019" />
              <span>YOLO Neural Diagnostic Assessment</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: '#c5c2b8', margin: 0 }}>
              {aiText}
            </p>

            {/* Confirmation Sequence */}
            <div style={{ marginTop: 8, background: '#181a19', padding: '10px 14px', borderRadius: 8, border: '1px solid #2d322f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#8b928a', marginBottom: 8 }}>
                <span>TEMPORAL VERIFICATION</span>
                <strong style={{ color: '#4ade80' }}>{framesConf}/{framesTotal} CONFIRMED</strong>
              </div>
              <div style={{ display: 'flex', gap: 6, height: 8 }}>
                {Array.from({ length: framesTotal }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: '100%',
                      borderRadius: 3,
                      background: idx < framesConf ? '#fb4934' : '#2b302c',
                      boxShadow: idx < framesConf ? '0 0 8px rgba(251, 73, 52, 0.4)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Building Information Card */}
          <div className="dc-card">
            <div className="dc-section-label">
              <Building2 size={14} color="#fabd2f" />
              <span>Facility Profile</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f7f5ed' }}>{ENRICHMENT.building}</div>
                <div style={{ fontSize: 12, color: '#8b928a', marginTop: 2 }}>{ENRICHMENT.address}</div>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ background: '#181a19', padding: '8px 12px', borderRadius: 6, border: '1px solid #2d322f' }}>
                  <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase' }}>Floors</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#eae7df' }}>{ENRICHMENT.floors}</div>
                </div>
                <div style={{ background: '#181a19', padding: '8px 12px', borderRadius: 6, border: '1px solid #2d322f' }}>
                  <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase' }}>Sector</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fe8019' }}>{incident?.camera_id || 'CAM-01'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Operator Dispatch Notes */}
          <div className="dc-card">
            <div className="dc-section-label">
              <Clock size={14} color="#83a598" />
              <span>Operator Tactical Notes</span>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Log dispatch actions, evacuation notes, or hazardous material details..."
              style={{
                width: '100%',
                minHeight: 80,
                resize: 'vertical',
                background: '#181a19',
                border: '1px solid #323633',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#eae7df',
                fontFamily: 'Manrope, sans-serif',
                fontSize: 12.5,
                lineHeight: 1.6,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      )}

      {/* Tab 2: 3D Spatial Hologram & Floor Digital Twin */}
      {activeTab === 'hologram' && (
        <div className="dc-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="dc-section-label">
              <Layers size={14} color="#fe8019" />
              <span>3D Architectural Floor Twin & Thermal Hazard Mapping</span>
            </div>
            {hologram && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#fe8019' }}>
                ROOM: {hologram.room_geometry?.width_m}m × {hologram.room_geometry?.depth_m}m
              </span>
            )}
          </div>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633', background: '#121413' }}>
            <Atmarakshak3DHero theme="dark" minHeight="440px" maxHeight="520px" />
          </div>
        </div>
      )}

      {/* Tab 3: Evidence Frames Strip */}
      {activeTab === 'evidence' && (
        <div className="dc-card">
          <div className="dc-section-label">
            <Activity size={14} color="#fe8019" />
            <span>Captured Bounding-Box Detection Frames ({evidFrames.length})</span>
          </div>
          <div className="dc-evidence-grid">
            {evidFrames.map((f, idx) => (
              <div
                key={idx}
                className="dc-evidence-item"
                onClick={() => onSelectFrame(f)}
                title={`Frame ${f.frame_index} · ${(f.fire_confidence * 100).toFixed(1)}%`}
              >
                <img src={frameImageUrl(incId, f.frame_index)} alt="Evidence Frame" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution CTA */}
      <div style={{ marginTop: 8 }}>
        {resolved ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(74, 222, 128, 0.12)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            borderRadius: 8,
            padding: 14
          }}>
            <CheckCircle2 size={20} color="#4ade80" />
            <div>
              <div style={{ fontWeight: 700, color: '#4ade80', fontSize: 14 }}>Incident Marked as Cleared</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8b928a' }}>
                Logged at {new Date().toLocaleTimeString('en-IN')} IST
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setResolved(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 13,
              borderRadius: 8,
              background: '#2b302c',
              border: '1px solid #3c423e',
              color: '#c5c2b8',
              fontFamily: "'Manrope', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4ade80'; e.currentTarget.style.color = '#121413'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2b302c'; e.currentTarget.style.color = '#c5c2b8'; }}
          >
            <CheckCircle2 size={16} />
            <span>MARK INCIDENT AS RESOLVED</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Right Tactical Action Column ───────────────────────────────────────────
function RightDispatch({ incident, summary }) {
  const [dispatchedUnits, setDispatchedUnits] = useState({});

  const units = [
    { id: 'UNIT-12', name: 'Engine 12 (Water Tender)', eta: '5 min', status: 'Standby' },
    { id: 'UNIT-07', name: 'Ladder 7 (High Rise)',   eta: '8 min', status: 'Standby' },
    { id: 'AMB-03',  name: 'Ambulance 3 (Trauma)',   eta: '4 min', status: 'Standby' }
  ];

  function toggleDispatch(unitId) {
    setDispatchedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Geospatial Transit Map */}
      <div className="dc-station-card" style={{ padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8b928a', textTransform: 'uppercase', marginBottom: 8 }}>
          📍 Live Transit Routing
        </div>
        <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633' }}>
          <DispatchMap inc={ENRICHMENT} />
        </div>
      </div>

      {/* 2. Nearest Station Command */}
      <div className="dc-station-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
          <Truck size={15} />
          <span>NEAREST FIRE COMMAND</span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: '#f7f5ed' }}>
          {ENRICHMENT.station}
        </div>

        <div className="dc-station-grid">
          <div className="dc-station-box">
            <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase', marginBottom: 2 }}>Distance</div>
            <div className="dc-station-num" style={{ color: '#fabd2f' }}>{ENRICHMENT.stationDist}</div>
          </div>
          <div className="dc-station-box">
            <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase', marginBottom: 2 }}>Arrival ETA</div>
            <div className="dc-station-num" style={{ color: '#4ade80' }}>{ENRICHMENT.stationEta}</div>
          </div>
        </div>

        <a
          href={`tel:${ENRICHMENT.stationPhone}`}
          className="dc-dispatch-cta"
        >
          <Phone size={14} />
          <span>CALL STATION DIRECT (101)</span>
        </a>
      </div>

      {/* 3. Fleet Deployment */}
      <div className="dc-station-card">
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8b928a', textTransform: 'uppercase' }}>
          🚒 Assigned Response Fleet
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {units.map(u => {
            const isSent = dispatchedUnits[u.id];
            return (
              <div key={u.id} className="dc-unit-pill">
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f7f5ed' }}>{u.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#8b928a' }}>
                    {u.id} · ETA {u.eta}
                  </div>
                </div>

                <button
                  onClick={() => toggleDispatch(u.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: isSent ? '1px solid #4ade80' : '1px solid rgba(254, 128, 25, 0.4)',
                    background: isSent ? 'rgba(74, 222, 128, 0.15)' : 'rgba(254, 128, 25, 0.15)',
                    color: isSent ? '#4ade80' : '#fe8019',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {isSent ? '✓ EN ROUTE' : 'DISPATCH'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Building Owner Card */}
      <div className="dc-station-card">
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8b928a', textTransform: 'uppercase' }}>
          Facility Custodian
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f7f5ed' }}>{ENRICHMENT.owner}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8b928a', marginTop: 2 }}>
              {ENRICHMENT.ownerPhone}
            </div>
          </div>
          <a
            href={`tel:${ENRICHMENT.ownerPhone}`}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: 'rgba(74, 222, 128, 0.15)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              color: '#4ade80',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Phone size={12} />
            <span>CALL</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Root Dispatch Console Component ─────────────────────────────────────────
export default function DispatchConsole() {
  const { incidentId: urlIncidentId } = useParams();
  const navigate = useNavigate();

  const {
    incidents,
    loading,
    error,
    selectedId,
    setSelectedId,
    summary,
    hologram,
    metadataStats,
    refresh
  } = useIncidentData();

  const [modalFrame, setModalFrame] = useState(null);

  // Synchronize URL param with selectedId on load
  useEffect(() => {
    if (urlIncidentId && incidents.some(i => i.incident_id === urlIncidentId)) {
      setSelectedId(urlIncidentId);
    }
  }, [urlIncidentId, incidents, setSelectedId]);

  function handleSelectIncident(id) {
    setSelectedId(id);
    // Gracefully update the URL dynamically without full page reload
    navigate(`/dispatch/${id}`, { replace: true });
  }

  const selectedIncident = incidents.find(i => i.incident_id === selectedId) ?? incidents[0];
  const firstFrameIndex = summary?.frames?.[0]?.frame_index ?? 0;

  return (
    <div className="dc-root">
      {/* ─── COMMAND TOPBAR ────────────────────────────────────────────── */}
      <header className="dc-topbar">
        <div className="dc-topbar-left">
          <div className="dc-topbar-brand">
            <div className="dc-brand-icon">
              <Radio size={16} />
            </div>
            <h1 className="dc-brand-title">Mumbai Central — ERSS 112</h1>
          </div>

          <div className="dc-divider" />

          <div className="dc-operator-chip">
            <span>OPERATOR:</span>
            <span className="dc-operator-name">Amara Singh</span>
          </div>

          {!loading && (
            <div className="dc-active-badge">
              <span>●</span>
              <span>{incidents.length} ACTIVE HAZARDS</span>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8b928a' }}>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              <span>SYNCHRONIZING TELEMETRY...</span>
            </div>
          )}

          {error && (
            <button
              onClick={refresh}
              style={{
                background: 'none',
                border: '1px solid #323633',
                borderRadius: 6,
                padding: '4px 10px',
                color: '#fb4934',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11
              }}
            >
              <RefreshCw size={11} /> RETRY
            </button>
          )}
        </div>

        <div className="dc-topbar-right">
          <div className="dc-live-indicator">
            <div className="dc-pulse-dot" />
            <span>LIVE OPERATIONAL</span>
          </div>

          <div className="dc-clock">
            {new Date().toLocaleTimeString('en-IN')} IST
          </div>

          <Link to="/" className="dc-nav-link">
            ← ATMARAKSHAK HOME
          </Link>
        </div>
      </header>

      {/* ─── SPACIOUS 3-COLUMN WORKSPACE ───────────────────────────────── */}
      <div className="dc-workspace">
        
        {/* Left Column: Incident Queue */}
        <aside className="dc-queue-col">
          <div className="dc-queue-header">
            <div className="dc-queue-title">
              <Flame size={14} color="#fb4934" />
              <span>Incident Queue</span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: '#fe8019'
            }}>
              {incidents.length}
            </span>
          </div>

          <div className="dc-queue-list">
            {loading && (
              <div style={{ padding: 24, textAlign: 'center', color: '#8b928a', fontSize: 12 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                Loading active incidents...
              </div>
            )}

            {!loading && incidents.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#8b928a', fontSize: 13 }}>
                No active hazard incidents reported.
              </div>
            )}

            {incidents.map((inc) => (
              <QueueItem
                key={inc.incident_id}
                incident={inc}
                firstFrameIndex={firstFrameIndex}
                selected={selectedIncident?.incident_id === inc.incident_id}
                onClick={() => handleSelectIncident(inc.incident_id)}
              />
            ))}
          </div>
        </aside>

        {/* Center Column: Vision Stage & Deep Telemetry */}
        <main className="dc-stage-col">
          {selectedIncident ? (
            <IncidentDetail
              key={selectedIncident.incident_id}
              incident={selectedIncident}
              summary={summary}
              hologram={hologram}
              metadataStats={metadataStats}
              onSelectFrame={setModalFrame}
            />
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8b928a',
              fontSize: 14
            }}>
              Select an incident from the queue to inspect telemetry
            </div>
          )}
        </main>

        {/* Right Column: Tactical Action & Station Command */}
        <aside className="dc-tactical-col">
          <RightDispatch incident={selectedIncident} summary={summary} />
        </aside>

      </div>

      {/* ─── SYSTEM FOOTER ─────────────────────────────────────────────── */}
      <footer className="dc-footer">
        <span>🇮🇳 Routed via India ERSS 112 Multi-Hazard Emergency Framework</span>
        <span>Atmarakshak OS v2.4 · Zonal API: localhost:3001</span>
      </footer>

      {/* Frame Enlargement Modal */}
      {modalFrame && (
        <ImageModal
          frame={modalFrame}
          incidentId={selectedIncident?.incident_id}
          onClose={() => setModalFrame(null)}
        />
      )}
    </div>
  );
}
