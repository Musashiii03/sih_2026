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
import { HologramViewer } from '../viewers/OBJ/HologramViewerWithErrorBoundary';
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

// ── Camera Queue Item ───────────────────────────────────────────────────────
function CameraQueueItem({ camera, selected, onClick }) {
  return (
    <div
      className={`dc-queue-item ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Camera Icon */}
      <div className="dc-queue-thumb" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1d1b',
        border: '1px solid #323633'
      }}>
        <Radio size={32} color={selected ? '#fe8019' : '#8b928a'} />
      </div>

      {/* Camera Meta Content */}
      <div className="dc-queue-meta">
        <div className="dc-queue-loc">
          {camera.name || camera.camera_code}
        </div>

        <div className="dc-queue-row">
          <span className="dc-queue-cam">{camera.camera_code}</span>
          <span className={`dc-queue-tag ${camera.status === 'ONLINE' ? 'online' : 'offline'}`}>
            {camera.status || 'ONLINE'}
          </span>
        </div>

        <div className="dc-queue-foot">
          <span>{camera.camera_type || 'FIXED'}</span>
          <span style={{ color: '#8b928a' }}>
            {camera.floor_number ? `Floor ${camera.floor_number}` : camera.location_description || 'Location N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Center Main Incident Detail ─────────────────────────────────────────────
function IncidentDetail({ incident, summary, hologram, metadataStats, onSelectFrame, selectedCamera, dashboardData }) {
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

  // Format diagnostic assessment as bullet points
  const diagnosticPoints = summary ? [
    `${severity} fire hazard verified across ${stats.frameCount} high-speed telemetry frames`,
    `Peak optical confidence ${avgConf}%`,
    `Potential human count: ${humanCount}`,
    `Objects identified: ${stats.objectCount}`,
    `Temporal neural engine: ${framesConf}/${framesTotal} confirmed sequences`
  ] : ['Synchronizing multi-sensor feed from edge detection unit...'];

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
                CAMERA: <strong style={{ color: '#eae7df' }}>{selectedCamera?.camera_code || incident?.camera_id || summary?.camera_id || 'CAM-01'}</strong>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: 14 }}>
          {stageView === 'cctv' ? (
            <CctvStreamPlayer
              incidentId={incId}
              cameraId={selectedCamera?.camera_code || incident?.camera_id || summary?.camera_id || 'CAM-01'}
              streamUrl={selectedCamera?.stream_url || summary?.camera_stream_url || incident?.camera_stream_url}
              frameIndex={bestFrame}
              severity={severity}
            />
          ) : (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633', background: '#121413', height: '440px' }}>
              <HologramViewer theme="dark" />
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
              <span>Neural Diagnostic Assessment</span>
            </div>
            <ul style={{ fontSize: 13, lineHeight: 1.65, color: '#c5c2b8', margin: 0, paddingLeft: 20 }}>
              {diagnosticPoints.map((point, idx) => (
                <li key={idx} style={{ marginBottom: idx < diagnosticPoints.length - 1 ? 6 : 0 }}>
                  {point}
                </li>
              ))}
            </ul>

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
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f7f5ed' }}>
                  {dashboardData?.building?.name || ENRICHMENT.building}
                </div>
                <div style={{ fontSize: 12, color: '#8b928a', marginTop: 2 }}>
                  {dashboardData?.building?.address ? 
                    `${dashboardData.building.address.address_line_1}, ${dashboardData.building.address.locality}, ${dashboardData.building.address.city} — ${dashboardData.building.address.postal_code}` 
                    : ENRICHMENT.address}
                </div>
                {dashboardData?.building?.address && (
                  <div style={{ fontSize: 11, color: '#8b928a', marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                    📍 {dashboardData.building.address.latitude?.toFixed(6)}, {dashboardData.building.address.longitude?.toFixed(6)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ background: '#181a19', padding: '8px 12px', borderRadius: 6, border: '1px solid #2d322f' }}>
                  <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase' }}>Floors</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#eae7df' }}>
                    {dashboardData?.building?.number_of_floors ? `1 → ${dashboardData.building.number_of_floors}` : ENRICHMENT.floors}
                  </div>
                </div>
                <div style={{ background: '#181a19', padding: '8px 12px', borderRadius: 6, border: '1px solid #2d322f' }}>
                  <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase' }}>Type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fe8019' }}>
                    {dashboardData?.building?.building_type || 'OFFICE'}
                  </div>
                </div>
              </div>
            </div>
            {/* Safety Features */}
            {dashboardData?.building && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {dashboardData.building.has_fire_alarm && (
                  <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                    🚨 Fire Alarm
                  </span>
                )}
                {dashboardData.building.has_sprinkler && (
                  <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                    💧 Sprinklers
                  </span>
                )}
                {dashboardData.building.has_fire_extinguishers && (
                  <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                    🧯 Extinguishers
                  </span>
                )}
              </div>
            )}
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
              <span>3D Hologram Viewer - Architectural Model</span>
            </div>
          </div>
          <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633', background: '#121413', height: '520px' }}>
            <HologramViewer theme="dark" />
          </div>
        </div>
      )}

      {/* Tab 3: Evidence Frames Strip */}
      {activeTab === 'evidence' && (
        <div className="dc-card">
          <div className="dc-section-label">
            <Activity size={14} color="#fe8019" />
            <span>Captured Evidence Frames ({evidFrames.length + (dashboardData?.evidence_frames?.length || 0)})</span>
          </div>
          
          {/* Show frames from summary (current detection) */}
          {evidFrames.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8b928a', marginBottom: 8, textTransform: 'uppercase' }}>
                Current Detection Frames
              </div>
              <div className="dc-evidence-grid">
                {evidFrames.map((f, idx) => (
                  <div
                    key={`summary-${idx}`}
                    className="dc-evidence-item"
                    onClick={() => onSelectFrame(f)}
                    title={`Frame ${f.frame_index} · ${(f.fire_confidence * 100).toFixed(1)}%`}
                  >
                    <img src={frameImageUrl(incId, f.frame_index)} alt="Evidence Frame" />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Show frames from database evidence table */}
          {dashboardData?.evidence_frames && dashboardData.evidence_frames.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8b928a', margin: '16px 0 8px', textTransform: 'uppercase' }}>
                Stored Evidence Frames ({dashboardData.evidence_frames.length})
              </div>
              <div className="dc-evidence-grid">
                {dashboardData.evidence_frames.map((evidence, idx) => (
                  <div
                    key={`evidence-${idx}`}
                    className="dc-evidence-item"
                    title={evidence.description || `Evidence ${evidence.file_name}`}
                  >
                    <img src={`/api/incidents/${incId}/frames/${evidence.file_name.match(/\d+/)?.[0] || idx}`} alt={evidence.description} />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 4, 
                      left: 4, 
                      right: 4,
                      background: 'rgba(0,0,0,0.7)', 
                      padding: '2px 4px', 
                      borderRadius: 3,
                      fontSize: 9,
                      color: '#eae7df'
                    }}>
                      {evidence.file_name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {evidFrames.length === 0 && (!dashboardData?.evidence_frames || dashboardData.evidence_frames.length === 0) && (
            <div style={{ padding: 24, textAlign: 'center', color: '#8b928a', fontSize: 12 }}>
              No evidence frames available for this incident.
            </div>
          )}
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

      {/* System Footer */}
      <footer style={{
        marginTop: 16,
        padding: '12px 16px',
        background: '#1a1d1b',
        border: '1px solid #2b302c',
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: '#8b928a',
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        <span>🇮🇳 Routed via India ERSS 112 Multi-Hazard Emergency Framework</span>
        <span>Atmarakshak OS v2.4 · Zonal API: localhost:3001</span>
      </footer>
    </div>
  );
}

// ── Right Tactical Action Column ───────────────────────────────────────────
function RightDispatch({ incident, summary, dashboardData }) {
  const [dispatchedUnits, setDispatchedUnits] = useState({});

  const units = [
    { id: 'UNIT-12', name: 'Engine 12 (Water Tender)', eta: '5 min', status: 'Standby' },
    { id: 'UNIT-07', name: 'Ladder 7 (High Rise)',   eta: '8 min', status: 'Standby' },
    { id: 'AMB-03',  name: 'Ambulance 3 (Trauma)',   eta: '4 min', status: 'Standby' }
  ];

  function toggleDispatch(unitId) {
    setDispatchedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  }

  // Get fire station data from dashboardData or fallback to ENRICHMENT
  const fireStation = dashboardData?.building?.nearest_fire_station || {};
  const stationName = fireStation.fire_station_name || ENRICHMENT.station;
  const stationDist = fireStation.distance_km ? `${fireStation.distance_km} km` : ENRICHMENT.stationDist;
  const stationEta = fireStation.distance_km ? `~${Math.ceil(fireStation.distance_km * 3)} min` : ENRICHMENT.stationEta;
  const stationPhone = fireStation.phone || ENRICHMENT.stationPhone;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Geospatial Transit Map */}
      <div className="dc-station-card" style={{ padding: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8b928a', textTransform: 'uppercase', marginBottom: 8 }}>
          📍 Live Transit Routing
        </div>
        <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633' }}>
          <DispatchMap inc={ENRICHMENT} dashboardData={dashboardData} />
        </div>
      </div>

      {/* 2. Nearest Station Command */}
      <div className="dc-station-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
          <Truck size={15} />
          <span>NEAREST FIRE COMMAND</span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: '#f7f5ed' }}>
          {stationName}
        </div>

        {fireStation.address_line_1 && (
          <div style={{ fontSize: 11, color: '#8b928a', marginTop: 4 }}>
            {fireStation.address_line_1}
          </div>
        )}

        <div className="dc-station-grid">
          <div className="dc-station-box">
            <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase', marginBottom: 2 }}>Distance</div>
            <div className="dc-station-num" style={{ color: '#fabd2f' }}>{stationDist}</div>
          </div>
          <div className="dc-station-box">
            <div style={{ fontSize: 10, color: '#8b928a', textTransform: 'uppercase', marginBottom: 2 }}>Arrival ETA</div>
            <div className="dc-station-num" style={{ color: '#4ade80' }}>{stationEta}</div>
          </div>
        </div>

        <a
          href={`tel:${stationPhone}`}
          className="dc-dispatch-cta"
        >
          <Phone size={14} />
          <span>CALL STATION DIRECT ({stationPhone})</span>
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
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [dashboardData, setDashboardData] = useState(null); // Full DB data with building, fire station, evidence

  // Fetch full dashboard data from DB
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedId) return;
      
      try {
        const response = await fetch(`/api/incidents/dashboard/${selectedId}`);
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, [selectedId]);

  // Synchronize URL param with selectedId on load or when URL changes
  useEffect(() => {
    if (urlIncidentId) {
      // URL has an incident ID, select it
      if (incidents.some(i => i.incident_id === urlIncidentId)) {
        setSelectedId(urlIncidentId);
      }
    } else if (!urlIncidentId && selectedId) {
      // No URL incident ID but we have a selected one, update URL
      navigate(`/dispatch/${selectedId}`, { replace: true });
    } else if (!urlIncidentId && incidents.length > 0) {
      // No URL incident ID and no selection, select first incident and update URL
      const firstIncident = incidents[0].incident_id;
      setSelectedId(firstIncident);
      navigate(`/dispatch/${firstIncident}`, { replace: true });
    }
  }, [urlIncidentId, incidents, selectedId, setSelectedId, navigate]);

  // Fetch cameras when dashboardData is loaded and has a building
  useEffect(() => {
    const fetchCameras = async () => {
      setLoadingCameras(true);
      try {
        // Fetch all cameras — cameras.yaml endpoint ignores building_id filter anyway
        const camerasResponse = await fetch(`/api/cameras?limit=100`);
        const camerasData = await camerasResponse.json();

        // Normalize fields: cameras.yaml uses `id` not `camera_code`, `sector` not `location`
        const raw = camerasData.cameras || camerasData.data?.cameras || [];
        const normalized = raw.map(c => ({
          ...c,
          camera_code: c.camera_code || c.id,
          name: c.name || c.id,
          location: c.location || c.sector || '',
          stream_url: c.stream_url || c.camera_stream_url || c.source || null,
          status: c.enabled === false ? 'OFFLINE' : 'ONLINE',
        }));

        setCameras(normalized);

        // Auto-select the incident's camera or the first camera
        if (normalized.length > 0) {
          const selectedIncident = incidents.find(i => i.incident_id === selectedId);
          const incidentCamera = normalized.find(
            c => c.camera_code === selectedIncident?.camera_id
          );
          setSelectedCameraId(
            incidentCamera ? incidentCamera.camera_code : normalized[0].camera_code
          );
        }
      } catch (err) {
        console.error('Error fetching cameras:', err);
        setCameras([]);
      } finally {
        setLoadingCameras(false);
      }
    };

    fetchCameras();
  }, [dashboardData?.building?.id, selectedId]);

  function handleSelectCamera(cameraCode) {
    setSelectedCameraId(cameraCode);
  }

  const selectedIncident = incidents.find(i => i.incident_id === selectedId) ?? incidents[0];
  const firstFrameIndex = summary?.frames?.[0]?.frame_index ?? 0;
  const selectedCamera = cameras.find(c => c.camera_code === selectedCameraId);

  return (
    <div className="dc-root">
      {/* ─── COMMAND TOPBAR ────────────────────────────────────────────── */}
      <header className="dc-topbar">
        <div className="dc-topbar-left">
          <div className="dc-topbar-brand">
            <img
              src="/atmarakshak_logo.png"
              alt="Atmarakshak Logo"
              style={{ height: 24, width: 24, objectFit: 'contain', borderRadius: 4 }}
            />
            <h1 className="dc-brand-title">ATMA<span style={{ background: 'linear-gradient(120deg, #fabd2f, #fe8019)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RAKSHAK</span></h1>
          </div>

          <div className="dc-divider" />

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
        </div>
      </header>

      {/* ─── SPACIOUS 3-COLUMN WORKSPACE ───────────────────────────────── */}
      <div className="dc-workspace">
        
        {/* Left Column: Camera Queue */}
        <aside className="dc-queue-col">
          {/* Building Cameras Heading */}
          <div style={{ 
            padding: '16px 16px 12px 16px',
            borderBottom: '1px solid #2d322f'
          }}>
            <h2 style={{ 
              fontSize: 15,
              fontWeight: 700,
              color: '#f7f5ed',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              letterSpacing: '0.3px'
            }}>
              <Radio size={18} color="#fe8019" />
              Building Cameras
              <span style={{
                marginLeft: 'auto',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: '#fe8019',
                background: 'rgba(254, 128, 25, 0.1)',
                padding: '2px 8px',
                borderRadius: 4
              }}>
                {cameras.length}
              </span>
            </h2>
          </div>

          <div className="dc-queue-list">
            {loadingCameras && (
              <div style={{ padding: 24, textAlign: 'center', color: '#8b928a', fontSize: 12 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                Loading cameras...
              </div>
            )}

            {!loadingCameras && cameras.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#8b928a', fontSize: 13 }}>
                No cameras available for this building.
              </div>
            )}

            {cameras.map((cam) => (
              <CameraQueueItem
                key={cam.id}
                camera={cam}
                selected={selectedCameraId === cam.camera_code}
                onClick={() => handleSelectCamera(cam.camera_code)}
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
              selectedCamera={selectedCamera}
              dashboardData={dashboardData}
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
          <RightDispatch incident={selectedIncident} summary={summary} dashboardData={dashboardData} />
        </aside>

      </div>

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
