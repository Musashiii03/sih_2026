import React, { useState, useEffect } from 'react';
import {
  Flame, CheckCircle, AlertTriangle, Phone,
  MessageSquare, Mail, Bell, Building2, ExternalLink,
  ChevronRight, RefreshCw, Camera, Loader2
} from 'lucide-react';
import IsometricHologram from './IsometricHologram';
import {
  useIncidentData,
  frameImageUrl,
  deriveSeverity,
  getEvidenceFrames,
  aggregateStats,
} from '../hooks/useIncidentData';

// ── Mock enrichment (fields the backend doesn't store yet) ────────────────
const BUILDING_META = {
  name: 'Arjun Tech Park — Block B',
  address: 'Plot 14, MIDC Phase II, Andheri East, Mumbai — 400093',
  floors: 6,
  buildingId: 'BLD-ARJ-B-042',
  owner: { name: 'Rajesh Mehra', phone: '+91-98200-11234', email: 'r.mehra@arjuntechpark.in' },
  nearest_fire: { station: 'Andheri East Fire Station', distance: '2.1 km', eta: '~6 min', phone: '101' },
};

const MOCK_CAMS = [
  { id: 'CAM-01', label: 'Main Lobby',         status: 'NORMAL' },
  { id: 'CAM-02', label: 'East Corridor 2F',   status: 'FIRE'   },
  { id: 'CAM-03', label: 'Server Room B',      status: 'SMOKE'  },
  { id: 'CAM-04', label: 'Underground Parking',status: 'NORMAL' },
];

const NOTIFICATIONS = [
  { id: 1, msg: 'Fire confirmed on CAM-02. Immediate attention required.',           channel: 'push',  time: '15:45:39', status: 'read' },
  { id: 2, msg: 'SMS: URGENT — Fire alert at Arjun Tech Park Block B, 2nd Floor.',  channel: 'sms',   time: '15:45:42', status: 'delivered' },
  { id: 3, msg: 'Email dispatched: Incident report attached.',                       channel: 'email', time: '15:45:44', status: 'delivered' },
  { id: 4, msg: 'Follow-up: Have you acknowledged the incident?',                   channel: 'push',  time: '15:45:58', status: 'delivered' },
  { id: 5, msg: 'Final notice: No response. Auto-escalating to ERSS/112 dispatch.', channel: 'push',  time: '15:46:14', status: 'pending' },
];

// ── CCTV live feed (real frame from backend OR placeholder) ───────────────
function CctvFrame({ incidentId, frameIndex, label, status = 'NORMAL', size = 'full' }) {
  const [loaded, setLoaded] = useState(false);
  const [err,    setErr]    = useState(false);
  const url = incidentId ? frameImageUrl(incidentId, frameIndex) : null;

  const isAlert = status === 'FIRE' || status === 'SMOKE';
  const borderCol = status === 'FIRE'  ? 'var(--critical)' :
                    status === 'SMOKE' ? 'var(--moderate)' : 'var(--border-strong)';

  return (
    <div style={{
      position: 'relative', borderRadius: 8, overflow: 'hidden',
      border: `1.5px solid ${borderCol}`,
      background: '#0d0906',
      ...(size === 'full' ? { aspectRatio: '16/9' } : { height: 100 }),
    }}>
      {/* Scanlines */}
      <div className="cctv-scanlines" />

      {/* Real frame image */}
      {url && !err ? (
        <img
          src={url}
          alt={`Frame ${frameIndex}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      ) : null}

      {/* Dark gradient overlay */}
      {status === 'FIRE' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 50% at 55% 55%, rgba(232,89,59,0.25) 0%, transparent 70%)',
        }} />
      )}

      {/* HUD overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', justifyContent: 'space-between', padding: 8, zIndex: 4,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {isAlert && (
            <span className="hud-pill live" style={{ fontSize: 9 }}>● {status}</span>
          )}
          <span className="hud-pill" style={{ marginLeft: 'auto', fontSize: 9 }}>
            {label}
          </span>
        </div>
        {size === 'full' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span className="hud-pill" style={{ fontSize: 9 }}>Frame {frameIndex}</span>
          </div>
        )}
      </div>

      {/* Loading spinner */}
      {url && !loaded && !err && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 5,
        }}>
          <Loader2 size={20} color="var(--text-dim)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* No-data placeholder */}
      {(!url || err) && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <Camera size={18} color="var(--text-dim)" />
          {size === 'full' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>NO FEED</span>}
        </div>
      )}
    </div>
  );
}

// ── 4-camera grid ─────────────────────────────────────────────────────────
function FourCamGrid({ incidentId, frames }) {
  // Map available real frames to cam slots. Use frame indices where fire detected first.
  const fireFrames = (frames || []).filter(f => f.fire_count > 0);
  const getIdx = slotIndex => {
    const f = fireFrames[slotIndex] ?? frames?.[slotIndex];
    return f?.frame_index ?? slotIndex;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="label">Live Camera Grid — 4 Feeds</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
          {incidentId || 'Awaiting data…'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {MOCK_CAMS.map((cam, i) => (
          <CctvFrame
            key={cam.id}
            incidentId={incidentId}
            frameIndex={getIdx(i)}
            label={cam.id}
            status={cam.status}
          />
        ))}
      </div>
    </div>
  );
}

// ── Evidence strip ─────────────────────────────────────────────────────────
function EvidenceStrip({ incidentId, evidenceFrames }) {
  if (!incidentId || !evidenceFrames?.length) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
        No evidence frames available
      </div>
    );
  }
  return (
    <div className="evidence-strip">
      {evidenceFrames.map((f, i) => (
        <div key={i} className="evidence-thumb" title={`Frame ${f.frame_index} — conf ${(f.fire_confidence * 100).toFixed(1)}%`}>
          <img src={frameImageUrl(incidentId, f.frame_index)} alt={`Evidence ${i + 1}`} />
        </div>
      ))}
    </div>
  );
}

// ── Temporal filmstrip ─────────────────────────────────────────────────────
function Filmstrip({ confirmed, total }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="filmstrip">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`film-frame ${i < confirmed ? 'lit-fire' : ''}`} />
          ))}
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--critical)', fontWeight: 700, letterSpacing: '0.06em',
        }}>
          {confirmed}/{total} confirmed
        </span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
        Temporal verification engine · 5+ consecutive frames required
      </span>
    </div>
  );
}

// ── Countdown ring ─────────────────────────────────────────────────────────
function CountdownRing({ onAcknowledge, onEscalate }) {
  const [seconds, setSeconds] = useState(45);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (seconds <= 0) { setDone(true); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const pct = seconds / 45;
  const r = 58, circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct);
  const ringColor = seconds <= 10 ? 'var(--critical)' : seconds <= 20 ? 'var(--moderate)' : '#C87941';

  if (done) {
    return (
      <div style={{
        background: 'var(--critical-dim)', border: '1.5px solid var(--critical)',
        borderRadius: 10, padding: '16px 18px', textAlign: 'center', width: '100%',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--critical)', fontWeight: 700, marginBottom: 6 }}>
          ⚠ AUTO-ESCALATED
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          No response. Incident routed to ERSS / 112 dispatch.
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-ring-wrap">
      <div className="countdown-ring">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border-strong)" strokeWidth="8" />
          <circle cx="70" cy="70" r={r} fill="none"
            stroke={ringColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }} />
        </svg>
        <div className="countdown-ring-inner">
          <span className="countdown-number" style={{ color: ringColor }}>{seconds}</span>
          <span className="countdown-label">seconds</span>
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn btn-primary" style={{ width: '100%', fontSize: 12 }} onClick={onAcknowledge}>
          <CheckCircle size={15} /> I'm handling this
        </button>
        <button className="btn btn-danger" style={{ width: '100%', fontSize: 12 }} onClick={onEscalate}>
          <AlertTriangle size={15} /> Escalate now
        </button>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
          If no response, auto-escalates to emergency dispatch.
        </p>
      </div>
    </div>
  );
}

// ── Notification log ───────────────────────────────────────────────────────
function NotificationLog({ notifications }) {
  const icons = { push: <Bell size={12} />, sms: <MessageSquare size={12} />, email: <Mail size={12} />, phone: <Phone size={12} /> };
  return (
    <div className="notif-timeline">
      {notifications.map(n => (
        <div className="notif-item" key={n.id}>
          <div className="notif-dot-wrap" style={{
            color: n.status === 'read' ? 'var(--accent)' : n.status === 'delivered' ? 'var(--safe)' : 'var(--text-dim)',
          }}>
            {icons[n.channel] || <Bell size={12} />}
          </div>
          <div className="notif-content">
            <div className="notif-msg">{n.msg}</div>
            <div className="notif-meta">
              <span className="notif-time">{n.time}</span>
              <span className={`notif-status ${n.status}`}>{n.status}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                via {n.channel}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Loading / error states ─────────────────────────────────────────────────
function StatusBanner({ loading, error, onRetry }) {
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
      background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
      <Loader2 size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        Connecting to detection backend…
      </span>
    </div>
  );
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', background: 'var(--critical-dim)', borderRadius: 8,
      border: '1px solid var(--critical)', marginBottom: 16 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--critical)' }}>
        Backend offline — showing cached/mock data · {error}
      </span>
      <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 11 }} onClick={onRetry}>
        <RefreshCw size={12} /> Retry
      </button>
    </div>
  );
  return null;
}

// ── Owner Console Root ─────────────────────────────────────────────────────
export default function OwnerConsole() {
  const { incidents, loading, error, selectedId, summary, hologram, metadataStats, refresh } = useIncidentData();
  const [ackDone, setAckDone] = useState(false);

  // Derive real values from backend data
  const inc = summary;
  const severity   = inc ? deriveSeverity(inc) : 'CRITICAL';
  const stats      = aggregateStats(inc, metadataStats);
  const evidFrames = getEvidenceFrames(inc, 6);

  // Build incident ID display
  const incidentIdDisplay = selectedId ?? 'ALERT_CAM02_FIRE_154614';
  const timestampDisplay  = inc?.timestamp_readable
    ? new Date(inc.timestamp_readable).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : '2026-08-30 15:46:14 IST';

  // Frames confirmed = how many frames have fire detections
  const framesConfirmed = inc?.frames ? inc.frames.filter(f => f.fire_count > 0).length : 5;
  const framesTotal     = Math.max(5, framesConfirmed);
  const avgConf         = ((stats.avgConf || 0) * 100).toFixed(1);
  const humanCount      = stats.humanCount; // peak from per-frame metadata JSON files

  return (
    <div className="view-content" style={{ paddingBottom: 80 }}>
      {/* Status banner */}
      <StatusBanner loading={loading} error={error} onRetry={refresh} />

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="label" style={{ fontSize: 11 }}>Owner Console</span>
            <ChevronRight size={12} color="var(--text-dim)" />
            <span className="label" style={{ color: 'var(--text-muted)', fontSize: 11 }}>{BUILDING_META.name}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
            Building Owner Alert View
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="live-dot-wrap">
            <span className="live-dot alert" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--critical)' }}>
              Critical Hazard Active
            </span>
          </div>
          <a href={`https://atmarakshak.in/building/${BUILDING_META.buildingId}`} target="_blank" rel="noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 5 }}>
            <ExternalLink size={11} />
            atmarakshak.in/building/{BUILDING_META.buildingId}
          </a>
        </div>
      </div>

      <div className="owner-grid">
        {/* ── Left column ── */}
        <div className="owner-left-col">

          {/* Hero incident card */}
          <div className="card animate-slide-in">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-critical"><Flame size={10} /> {severity}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {incidentIdDisplay}
                </span>
              </div>
              <span className="label">Detected {timestampDisplay}</span>
            </div>

            <div className="card-body">
              {/* Title */}
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700,
                fontSize: 26, color: 'var(--text)', lineHeight: 1.2, marginBottom: 16 }}>
                Fire confirmed —{' '}
                <span style={{ color: 'var(--critical)' }}>East Corridor, 2nd Floor</span>
              </h2>

              {/* 4-camera grid */}
              <FourCamGrid incidentId={selectedId} frames={inc?.frames} />

              {/* Temporal filmstrip */}
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg-surface)',
                borderRadius: 8, border: '1px solid var(--border)' }}>
                <div className="label" style={{ marginBottom: 8 }}>Temporal Verification Engine</div>
                <Filmstrip confirmed={framesConfirmed} total={framesTotal} />
              </div>

              {/* Stats */}
              <div className="stat-row" style={{ marginTop: 14 }}>
                <div className="stat-chip">
                  <span className="label">Confidence</span>
                  <span className="stat-number critical" style={{ fontSize: 32 }}>{avgConf}%</span>
                </div>
                <div className="stat-chip">
                  <span className="label">Severity</span>
                  <span className="stat-number critical" style={{ fontSize: 28 }}>{severity}</span>
                </div>
                <div className="stat-chip">
                  <span className="label">Fire Detections</span>
                  <span className="stat-number moderate" style={{ fontSize: 32 }}>{stats.fireCount}</span>
                </div>
                <div className="stat-chip">
                  <span className="label">People at Risk</span>
                  <span className="stat-number accent" style={{ fontSize: 32 }}>{stats.humanCount}</span>
                  {(stats.totalHumanDetections > 0 || stats.framesWithHumans > 0) && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                      {stats.totalHumanDetections} total · {stats.framesWithHumans} frame{stats.framesWithHumans !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence strip */}
              <div style={{ marginTop: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>
                  Evidence Frames — {evidFrames.length} fire-confirmed captures
                </div>
                <EvidenceStrip incidentId={selectedId} evidenceFrames={evidFrames} />
              </div>

              {/* Hologram */}
              <div style={{ marginTop: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>3D Room Hologram — AI Spatial Analysis</div>
                <IsometricHologram hologramData={hologram} humanCount={humanCount} />
              </div>
            </div>
          </div>

          {/* Notification log */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Multi-Channel Notification Log</span>
              <span className="badge badge-moderate">{NOTIFICATIONS.length} messages sent</span>
            </div>
            <div className="card-body">
              <NotificationLog notifications={NOTIFICATIONS} />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="owner-right-col">
          {/* Countdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Response Window</span>
              <span className="badge badge-critical">45s</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              {ackDone ? (
                <div style={{ textAlign: 'center', padding: '20px 16px', background: 'var(--safe-dim)',
                  borderRadius: 10, border: '1px solid rgba(143,175,62,0.3)', width: '100%' }}>
                  <CheckCircle size={32} color="var(--safe)" style={{ marginBottom: 10 }} />
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, color: 'var(--safe)', marginBottom: 6 }}>
                    Acknowledged
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>You've taken ownership. Escalation paused.</div>
                </div>
              ) : (
                <CountdownRing
                  onAcknowledge={() => setAckDone(true)}
                  onEscalate={() => alert('Escalated to ERSS / 112 dispatch immediately.')}
                />
              )}
            </div>
          </div>

          {/* Building info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🏢 Building Info</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span className="label" style={{ fontSize: 9 }}>Building</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{BUILDING_META.name}</div>
              </div>
              <div>
                <span className="label" style={{ fontSize: 9 }}>Address</span>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{BUILDING_META.address}</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <span className="label" style={{ fontSize: 9 }}>Floors</span>
                  <div className="stat-number" style={{ fontSize: 22 }}>{BUILDING_META.floors}</div>
                </div>
                <div>
                  <span className="label" style={{ fontSize: 9 }}>Frames</span>
                  <div className="stat-number safe" style={{ fontSize: 22 }}>{stats.frameCount}/6</div>
                </div>
              </div>
              <div className="sep" />
              <div>
                <span className="label" style={{ fontSize: 9 }}>Owner</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{BUILDING_META.owner.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{BUILDING_META.owner.phone}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{BUILDING_META.owner.email}</div>
              </div>
            </div>
          </div>

          {/* Nearest fire station */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--critical)' }}>🚒 Nearest Fire Station</span>
            </div>
            <div className="card-body">
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                {BUILDING_META.nearest_fire.station}
              </div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                <div>
                  <span className="label" style={{ fontSize: 9 }}>Distance</span>
                  <div className="stat-number moderate" style={{ fontSize: 24 }}>{BUILDING_META.nearest_fire.distance}</div>
                </div>
                <div>
                  <span className="label" style={{ fontSize: 9 }}>ETA</span>
                  <div className="stat-number accent" style={{ fontSize: 24 }}>{BUILDING_META.nearest_fire.eta}</div>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={11} color="var(--safe)" />
                Emergency: <span style={{ color: 'var(--safe)', fontWeight: 700 }}>{BUILDING_META.nearest_fire.phone}</span>
              </div>
            </div>
          </div>

          {/* Incident selector (if multiple) */}
          {incidents.length > 1 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">All Incidents</span>
                <span className="badge badge-moderate">{incidents.length}</span>
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                {incidents.map(i => (
                  <div key={i.incident_id}
                    onClick={() => {}}
                    style={{
                      padding: '10px 16px', borderBottom: '1px solid var(--border)',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                      background: i.incident_id === selectedId ? 'var(--bg-card-hover)' : 'transparent',
                    }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
                      {i.incident_id}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                      {i.frame_count} frames
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer-bar" style={{ margin: '16px -20px -20px', position: 'sticky', bottom: 0 }}>
        <span>Atmarakshak v2.4 · ERSS/112 Integration · YOLOv8x Detection · API: localhost:3001</span>
        <a href={`https://atmarakshak.in/building/${BUILDING_META.buildingId}`} className="footer-link">
          atmarakshak.in/building/{BUILDING_META.buildingId}
        </a>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
