import React, { useState } from 'react';
import {
  Flame, Users, MapPin, Building2, Brain, Box,
  CheckCircle2, Clock, Truck, Phone, Loader2, RefreshCw
} from 'lucide-react';
import DispatchMap from './DispatchMap';
import IsometricHologram from './IsometricHologram';
import {
  useIncidentData,
  frameImageUrl,
  deriveSeverity,
  getEvidenceFrames,
  aggregateStats,
} from '../hooks/useIncidentData';

// ── Static enrichment for display fields backend doesn't store ────────────
const ENRICHMENT = {
  building:  'Arjun Tech Park — Block B',
  zone:      'East Corridor, 2F',
  address:   'Plot 14, MIDC Phase II, Andheri East, Mumbai — 400093',
  floors:    '1 → 6',
  owner:     'Rajesh Mehra',
  ownerPhone:'+91-98200-11234',
  station:   'Andheri East Fire Station',
  stationDist: '2.1 km',
  stationEta:  '~6 min',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function severityBadgeClass(s) {
  if (s === 'CRITICAL') return 'badge badge-critical';
  if (s === 'MODERATE') return 'badge badge-moderate';
  return 'badge badge-safe';
}
function statusColor(s) {
  if (s === 'Active')        return 'var(--critical)';
  if (s === 'Investigating') return 'var(--moderate)';
  return 'var(--safe)';
}

// ── Evidence strip (real frames) ───────────────────────────────────────────
function EvidenceStrip({ incidentId, evidenceFrames }) {
  if (!incidentId || !evidenceFrames?.length) {
    return <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>No evidence captured</span>;
  }
  return (
    <div className="evidence-strip">
      {evidenceFrames.map((f, i) => (
        <div key={i} className="evidence-thumb"
          title={`Frame ${f.frame_index} · conf ${(f.fire_confidence * 100).toFixed(1)}%`}>
          <img src={frameImageUrl(incidentId, f.frame_index)} alt={`Evidence ${i + 1}`} />
        </div>
      ))}
    </div>
  );
}

// ── CCTV thumbnail ─────────────────────────────────────────────────────────
function MiniCctv({ incidentId, frameIndex, severity }) {
  const [loaded, setLoaded] = useState(false);
  const url = incidentId ? frameImageUrl(incidentId, frameIndex) : null;
  const fireColor = severity === 'CRITICAL' ? '#E8593B' : severity === 'MODERATE' ? '#DFA23D' : '#8FAF3E';

  return (
    <div style={{
      background: '#0d0906', borderRadius: 8, position: 'relative',
      overflow: 'hidden', aspectRatio: '16/9',
      border: `1.5px solid ${fireColor}50`,
    }}>
      {url && (
        <img src={url} alt="Live feed" onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 55% 45% at 55% 55%, ${fireColor}25 0%, #1B120C80 80%)`,
        pointerEvents: 'none',
      }} />
      <div className="cctv-scanlines" />
      {severity === 'CRITICAL' && (
        <div style={{
          position: 'absolute', top: 6, left: 6, zIndex: 5,
          background: 'rgba(232,89,59,0.85)', borderRadius: 4,
          padding: '2px 8px', fontFamily: 'var(--font-mono)', fontSize: 9,
          color: '#fff', fontWeight: 700, animation: 'blink 1.5s infinite',
        }}>● LIVE</div>
      )}
      {!loaded && !url && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center' }}>
          <Loader2 size={18} color="var(--text-dim)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

// ── Real incident queue item ───────────────────────────────────────────────
function QueueItem({ incident, selected, onClick }) {
  const ts = incident.timestamp_readable
    ? new Date(incident.timestamp_readable * 1000 || incident.timestamp * 1000).toLocaleTimeString('en-IN')
    : '—';
  return (
    <div className={`incident-queue-item ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
          fontSize: 13, color: 'var(--text)', lineHeight: 1.2 }}>
          🔥 {incident.location || 'Video Source'} — {incident.camera_id}
        </div>
        <span className="badge badge-critical" style={{ flexShrink: 0 }}>FIRE</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        {incident.incident_id}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
          <Clock size={9} style={{ display: 'inline', marginRight: 3 }} />
          {incident.frame_count} frames · {new Date(incident.timestamp * 1000).toLocaleDateString('en-IN')}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--critical)', fontWeight: 700 }}>
          ● Active
        </span>
      </div>
    </div>
  );
}

// ── Incident detail panel ──────────────────────────────────────────────────
function IncidentDetail({ incident, summary, hologram, metadataStats }) {
  const [notes,    setNotes]    = useState('');
  const [resolved, setResolved] = useState(false);

  const severity    = deriveSeverity(summary);
  const stats       = aggregateStats(summary, metadataStats);  // pass metadataStats for authoritative human count
  const evidFrames  = getEvidenceFrames(summary, 4);
  const humanCount  = stats.humanCount; // peak simultaneous humans from per-frame metadata JSON files
  const avgConf     = ((stats.avgConf || 0) * 100).toFixed(1);
  const incId       = incident?.incident_id;

  // Best frame index for the CCTV thumbnail
  const bestFrameIdx = summary?.frames?.find(f => f.fire_count > 0)?.frame_index ?? 0;

  const aiAnalysis = summary
    ? `Fire probability ${severity} — ${stats.fireCount} detections across ${stats.frameCount} frames. ` +
      `Average confidence ${avgConf}%. Object detections: ${stats.objectCount}. ` +
      `Human detections: ${humanCount}. YOLOv8 temporal engine: ${summary.frames?.filter(f=>f.fire_count>0).length}/${stats.frameCount} frames confirmed.`
    : 'Loading AI analysis…';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
          fontSize: 20, color: 'var(--critical)' }}>
          🚨 Fire Incident {incId?.replace('INC-', '#') ?? '#---'}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={severityBadgeClass(severity)}>{severity}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: statusColor('Active'),
            fontWeight: 700, background: 'var(--bg-surface)', padding: '3px 10px',
            borderRadius: 'var(--r-badge)', border: `1px solid ${statusColor('Active')}40` }}>
            ● Active
          </span>
        </div>
      </div>

      {/* CCTV */}
      <MiniCctv incidentId={incId} frameIndex={bestFrameIdx} severity={severity} />

      {/* Key metrics */}
      <div className="stat-row">
        <div className="stat-chip">
          <span className="label" style={{ fontSize: 9 }}>📍 Location</span>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
            {incident?.location || ENRICHMENT.zone}
          </div>
        </div>
        <div className="stat-chip" style={{ minWidth: 60 }}>
          <span className="label" style={{ fontSize: 9 }}>👥 Victims</span>
          <div className="stat-number critical" style={{ fontSize: 28 }}>{humanCount}</div>
        </div>
        <div className="stat-chip">
          <span className="label" style={{ fontSize: 9 }}>📷 Source</span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
            {incident?.camera_id ?? 'CAM-01'}
          </div>
        </div>
        <div className="stat-chip">
          <span className="label" style={{ fontSize: 9 }}>🔥 Detections</span>
          <div className="stat-number moderate" style={{ fontSize: 28 }}>{stats.fireCount}</div>
        </div>
      </div>

      {/* Building info */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '10px 14px',
        border: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <Building2 size={16} color="var(--text-dim)" style={{ marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{ENRICHMENT.building}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ENRICHMENT.address}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>
            🏢 Floors: {ENRICHMENT.floors}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px',
        border: '1px solid var(--border-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Brain size={13} color="var(--accent)" />
          <span className="label" style={{ color: 'var(--accent)', fontSize: 10 }}>AI Analysis</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>
            {avgConf}% avg confidence
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{aiAnalysis}</div>
      </div>

      {/* Evidence */}
      <div>
        <span className="label" style={{ marginBottom: 8, display: 'block' }}>
          📷 Evidence Frames — {evidFrames.length} with fire detections
        </span>
        <EvidenceStrip incidentId={incId} evidenceFrames={evidFrames} />
      </div>

      {/* Hologram */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="label">🔗 3D Spatial Analysis</span>
          {hologram && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>
              {hologram.room_geometry?.width_m}×{hologram.room_geometry?.depth_m}m room
            </span>
          )}
        </div>
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <IsometricHologram hologramData={hologram} humanCount={humanCount} />
        </div>
      </div>

      {/* Operator notes */}
      <div>
        <span className="label" style={{ marginBottom: 8, display: 'block' }}>Operator Notes</span>
        <textarea className="operator-notes" placeholder="Add notes for this incident…"
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {/* Mark resolved */}
      {!resolved ? (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setResolved(true)}>
          <CheckCircle2 size={15} /> Mark as Resolved
        </button>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px', background: 'var(--safe-dim)',
          borderRadius: 8, border: '1px solid rgba(143,175,62,0.3)',
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--safe)', fontWeight: 700 }}>
          ✓ Incident Resolved
        </div>
      )}
    </div>
  );
}

// ── Right dispatch panel ───────────────────────────────────────────────────
function RightDispatch({ incident, summary }) {
  const [dispatched, setDispatched] = useState(false);
  const stats = aggregateStats(summary);

  // Build alert log from real frame data
  const alertLog = summary?.frames?.slice(0, 5).map((f, i) => ({
    time: new Date(f.timestamp * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    event: i === 0
      ? `Detection started — ${f.fire_count} fire bbox(es) detected`
      : `Frame ${f.frame_index}: ${f.fire_count} fire, ${f.human_count} human, ${f.object_count} objects`,
  })) ?? [
    { time: '15:45:39', event: 'Fire detection started' },
    { time: '15:45:43', event: '2 fire bboxes confirmed' },
    { time: '15:46:14', event: 'Owner notified via push/SMS/email' },
    { time: '15:46:14', event: 'Auto-escalated to ERSS / 112' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Map */}
      <div>
        <span className="label" style={{ display: 'block', marginBottom: 8 }}>📍 Live Location</span>
        <DispatchMap inc={{ ...ENRICHMENT, stationEta: ENRICHMENT.stationEta, stationDist: ENRICHMENT.stationDist }} />
      </div>

      {/* Fire station */}
      <div className="card">
        <div className="card-header" style={{ padding: '10px 14px' }}>
          <span className="card-title">🚒 Nearest Station</span>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            {ENRICHMENT.station}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <span className="label" style={{ fontSize: 9 }}>Distance</span>
              <div className="stat-number moderate" style={{ fontSize: 20 }}>{ENRICHMENT.stationDist}</div>
            </div>
            <div>
              <span className="label" style={{ fontSize: 9 }}>ETA</span>
              <div className="stat-number accent" style={{ fontSize: 20 }}>{ENRICHMENT.stationEta}</div>
            </div>
          </div>
          {dispatched ? (
            <div style={{ background: 'var(--safe-dim)', borderRadius: 8, padding: '9px 12px',
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--safe)',
              fontWeight: 700, textAlign: 'center', border: '1px solid rgba(143,175,62,0.3)' }}>
              ✓ Unit Dispatched
            </div>
          ) : (
            <button className="btn btn-accent" style={{ width: '100%', fontSize: 12 }} onClick={() => setDispatched(true)}>
              <Truck size={14} /> Dispatch Unit
            </button>
          )}
        </div>
      </div>

      {/* Owner */}
      <div className="card">
        <div className="card-header" style={{ padding: '10px 14px' }}>
          <span className="card-title">Building Owner</span>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{ENRICHMENT.owner}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            <Phone size={11} color="var(--safe)" /> {ENRICHMENT.ownerPhone}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
            {ENRICHMENT.address}
          </div>
        </div>
      </div>

      {/* Alert log (real frame timestamps) */}
      <div className="card">
        <div className="card-header" style={{ padding: '10px 14px' }}>
          <span className="card-title">Alert Log</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
            {stats.frameCount} frames
          </span>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {alertLog.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 8, paddingTop: i === 0 ? 0 : 8,
              borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                {entry.time}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{entry.event}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
          Incident: <span style={{ color: 'var(--accent)' }}>{incident?.incident_id ?? '—'}</span>
          {' '}· {incident?.camera_id ?? 'CAM-01'}
        </div>
      </div>
    </div>
  );
}

// ── Dispatch Console Root ──────────────────────────────────────────────────
export default function DispatchConsole() {
  const { incidents, loading, error, selectedId, setSelectedId, summary, hologram, metadataStats, refresh } = useIncidentData();
  const selectedIncident = incidents.find(i => i.incident_id === selectedId) ?? incidents[0];

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Dispatch header */}
      <div style={{ padding: '12px 20px', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Mumbai Central — ERSS / 112 Dispatch
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>
              Zone: Greater Mumbai · Operator: Amara Singh
            </div>
          </div>
          {!loading && (
            <span className="badge badge-critical">
              <Flame size={9} /> {incidents.length} Active Incident{incidents.length !== 1 ? 's' : ''}
            </span>
          )}
          {loading && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />Connecting…
            </span>
          )}
          {error && (
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 11 }} onClick={refresh}>
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="live-dot-wrap">
            <span className="live-dot alert" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: 'var(--critical)' }}>Live</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {new Date().toLocaleTimeString('en-IN')} IST
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '280px 1fr 300px' }}>
        {/* ── Left: Queue ── */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="label">Incident Queue</span>
            <span className="badge badge-moderate">{incidents.length} total</span>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && (
              <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Loading incidents…
              </div>
            )}
            {!loading && incidents.length === 0 && !error && (
              <div style={{ padding: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                No incidents found.
              </div>
            )}
            {incidents.map((inc) => (
              <QueueItem
                key={inc.incident_id}
                incident={inc}
                selected={selectedId === inc.incident_id}
                onClick={() => setSelectedId(inc.incident_id)}
              />
            ))}
          </div>
        </div>

        {/* ── Center: Detail ── */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px 18px' }}>
          {selectedIncident ? (
          <IncidentDetail
              key={selectedId}
              incident={selectedIncident}
              summary={summary}
              hologram={hologram}
              metadataStats={metadataStats}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
              Select an incident from the queue
            </div>
          )}
        </div>

        {/* ── Right: Dispatch ── */}
        <div style={{ overflowY: 'auto', padding: '16px' }}>
          <RightDispatch incident={selectedIncident} summary={summary} />
        </div>
      </div>

      {/* Footer */}
      <div className="footer-bar">
        <span>🇮🇳 Routed via India's ERSS / 112 — complete incident data sent to zonal dispatch controller</span>
        <span style={{ color: 'var(--accent)' }}>Atmarakshak v2.4 · API: localhost:3001</span>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
