/**
 * DispatchConsole — ERSS / 112 Fire Dispatch Console
 * GIC design language: Fraunces, Manrope, JetBrains Mono
 * Parchment canvas, hairline #dee2de borders, signal-blue outlined CTAs
 */
import React, { useState } from 'react';
import {
  Flame, Building2, Brain, CheckCircle2, Clock,
  Truck, Phone, Loader2, RefreshCw, X,
  MapPin, ChevronRight, AlertTriangle, Radio
} from 'lucide-react';
import DispatchMap from './DispatchMap';
import IsometricHologram from './IsometricHologram';
import {
  useIncidentData, frameImageUrl,
  deriveSeverity, getEvidenceFrames, aggregateStats,
} from '../hooks/useIncidentData';

// ── GIC tokens (local) ─────────────────────────────────────────────────────
const G = {
  parchment: '#fefffc',
  paper:     '#ffffff',
  linen:     '#f9faf7',
  graphite:  '#2c2c2c',
  charcoal:  '#444141',
  ash:       '#646464',
  fog:       '#b4b8b4',
  mist:      '#dee2de',
  twilight:  '#282834',
  dusk:      '#1f1f29',
  signal:    '#41a1cf',
  fire:      '#e11d48',
  fireDim:   '#fef2f2',
  amber:     '#d97706',
  amberDim:  '#fffbeb',
  green:     '#16a34a',
  greenDim:  '#f0fdf4',
};

// Enrichment (fields backend doesn't store yet)
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
};

// ── Shared primitives ──────────────────────────────────────────────────────

function GCard({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: G.paper, border: `1px solid ${G.mist}`, borderRadius: 12,
      boxShadow: '0 1px 1px rgba(0,0,0,0.05),0 4px 5px rgba(0,0,0,0.03)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function GBadge({ label, color = G.signal }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color, background: `${color}15`, border: `1px solid ${color}35`,
      borderRadius: 999, padding: '2px 9px', display: 'inline-block', lineHeight: 1.6,
    }}>{label}</span>
  );
}

function BtnSignal({ children, onClick, small = false, style = {} }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? `${G.signal}12` : 'transparent',
        border: `1px solid ${G.signal}`, borderRadius: 8,
        padding: small ? '5px 12px' : '8px 16px',
        fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500,
        color: G.signal, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'background 0.15s', ...style,
      }}>
      {children}
    </button>
  );
}

function BtnDark({ children, onClick, style = {}, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? G.fog : G.dusk, border: `1px solid ${G.twilight}`,
      borderRadius: 8, padding: '8px 16px',
      fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500,
      color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      opacity: disabled ? 0.6 : 1, ...style,
    }}>
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600,
      color: G.ash, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Row({ label, value, mono = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 0', borderBottom: `1px solid ${G.mist}` }}>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>{label}</span>
      <span style={{
        fontFamily: mono ? "'JetBrains Mono',monospace" : "'Manrope',sans-serif",
        fontSize: 12, fontWeight: mono ? 600 : 500, color: G.graphite,
        textAlign: 'right', maxWidth: '60%',
      }}>{value}</span>
    </div>
  );
}

// ── Image modal ────────────────────────────────────────────────────────────
function ImageModal({ frame, incidentId, onClose }) {
  if (!frame) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', maxWidth: '88vw', maxHeight: '88vh',
        background: G.paper, borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${G.mist}`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 10, right: 10, zIndex: 10,
          background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6,
          padding: 7, cursor: 'pointer', display: 'flex',
        }}>
          <X size={16} color="#fff" />
        </button>
        <img src={frameImageUrl(incidentId, frame.frame_index)} alt=""
          style={{ maxWidth: '88vw', maxHeight: '75vh', display: 'block' }} />
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${G.mist}` }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: G.graphite }}>
            Frame {frame.frame_index} · Confidence: {(frame.fire_confidence * 100).toFixed(1)}%
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
            color: G.ash, marginLeft: 16 }}>
            Fire: {frame.fire_count} · Humans: {frame.human_count} · Objects: {frame.object_count}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Evidence strip ─────────────────────────────────────────────────────────
function EvidenceStrip({ incidentId, frames, onFrameClick }) {
  if (!incidentId || !frames?.length) {
    return (
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G.ash }}>
        No evidence captured
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {frames.map((f, i) => (
        <div key={i} onClick={() => onFrameClick?.(f)}
          title={`Frame ${f.frame_index} · ${(f.fire_confidence * 100).toFixed(1)}%`}
          style={{
            width: 78, height: 54, borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
            border: `1px solid ${G.mist}`, background: G.linen, flexShrink: 0,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = G.signal}
          onMouseLeave={e => e.currentTarget.style.borderColor = G.mist}
        >
          <img src={frameImageUrl(incidentId, f.frame_index)} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ))}
    </div>
  );
}

// ── CCTV feed ──────────────────────────────────────────────────────────────
function CctvFeed({ incidentId, frameIndex, severity }) {
  const [loaded, setLoaded] = useState(false);
  const url = incidentId ? frameImageUrl(incidentId, frameIndex) : null;
  const accent = severity === 'CRITICAL' ? G.fire : severity === 'MODERATE' ? G.amber : G.green;

  return (
    <div style={{
      position: 'relative', borderRadius: 8, overflow: 'hidden',
      aspectRatio: '16/9', background: '#0a0a0a',
      border: `1px solid ${accent}40`,
    }}>
      {url && (
        <img src={url} alt="" onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover',
            opacity: loaded ? 1 : 0, transition: 'opacity 0.3s', display: 'block' }} />
      )}
      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 50% at 55% 55%, ${accent}20 0%, transparent 70%)`,
      }} />
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)',
      }} />
      {/* Top-left badge */}
      {severity === 'CRITICAL' && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 4,
          background: 'rgba(225,29,72,0.88)', borderRadius: 4, padding: '2px 8px',
          fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
          color: '#fff', fontWeight: 700, animation: 'blink 1.5s infinite',
        }}>● LIVE</div>
      )}
      {/* Frame index */}
      <div style={{
        position: 'absolute', bottom: 7, right: 8, zIndex: 4,
        background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '2px 7px',
        fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.7)',
      }}>
        Frame {frameIndex}
      </div>
      {/* Loading */}
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={18} color={G.fog} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

// ── Queue item ─────────────────────────────────────────────────────────────
function QueueItem({ incident, selected, onClick, firstFrameIndex }) {
  const incId = incident.incident_id;
  const date  = new Date(incident.timestamp * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: '2-digit',
  });

  return (
    <div onClick={onClick}
      style={{
        padding: '14px 16px', borderBottom: `1px solid ${G.mist}`,
        cursor: 'pointer', transition: 'background 0.12s',
        background: selected ? G.linen : 'transparent',
        borderLeft: selected ? `3px solid ${G.signal}` : '3px solid transparent',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = G.linen; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Frame thumbnail */}
      <div style={{ borderRadius: 6, overflow: 'hidden', marginBottom: 10,
        border: `1px solid ${G.mist}`, height: 70 }}>
        <img src={frameImageUrl(incId, firstFrameIndex)} alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
            fontWeight: 400, fontSize: 14, color: G.graphite, lineHeight: 1.3, marginBottom: 4 }}>
            {incident.location || 'Video Source'}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.ash }}>
            {incident.camera_id}
          </div>
        </div>
        <GBadge label="FIRE" color={G.fire} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.ash }}>
          {incident.frame_count} frames · {date}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
          color: G.fire, fontWeight: 700 }}>● Active</span>
      </div>
    </div>
  );
}

// ── Filmstrip ──────────────────────────────────────────────────────────────
function Filmstrip({ confirmed, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 28, height: 9, borderRadius: 3,
            background: i < confirmed ? G.fire : G.mist,
            boxShadow: i < confirmed ? `0 0 6px ${G.fire}60` : 'none',
            transition: 'background 0.25s',
          }} />
        ))}
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
        fontWeight: 700, color: G.fire }}>{confirmed}/{total}</span>
    </div>
  );
}

// ── Incident detail (center) ───────────────────────────────────────────────
function IncidentDetail({ incident, summary, hologram, metadataStats }) {
  const [notes,      setNotes]      = useState('');
  const [resolved,   setResolved]   = useState(false);
  const [modalFrame, setModalFrame] = useState(null);

  const severity   = deriveSeverity(summary);
  const stats      = aggregateStats(summary, metadataStats);
  const evidFrames = getEvidenceFrames(summary, 999);
  const humanCount = stats.humanCount;
  const avgConf    = ((stats.avgConf || 0) * 100).toFixed(1);
  const incId      = incident?.incident_id;
  const bestFrame  = summary?.frames?.find(f => f.fire_count > 0)?.frame_index ?? 0;
  const framesConf = summary?.frames?.filter(f => f.fire_count > 0).length ?? 5;
  const framesTotal= Math.max(5, framesConf, summary?.frame_count ?? 5);

  const aiText = summary
    ? `${severity} fire probability — ${stats.fireCount} bbox detections across ${stats.frameCount} frames. ` +
      `Avg confidence ${avgConf}%. Humans: ${humanCount}. Objects: ${stats.objectCount}. ` +
      `Temporal engine: ${framesConf}/${framesTotal} frames confirmed.`
    : 'Connecting to detection engine…';

  const sevColor = severity === 'CRITICAL' ? G.fire : severity === 'MODERATE' ? G.amber : G.green;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10, paddingBottom: 16, borderBottom: `1px solid ${G.mist}` }}>
        <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
          fontWeight: 400, fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.02em',
          color: sevColor, margin: 0 }}>
          🚨 Fire Incident {incId?.replace('INC-', '#') ?? '#—'}
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <GBadge label={severity} color={sevColor} />
          <GBadge label="Active" color={G.fire} />
        </div>
      </div>

      {/* ── CCTV ── */}
      <CctvFeed incidentId={incId} frameIndex={bestFrame} severity={severity} />

      {/* ── KPI chips ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { l: 'Location',   v: incident?.location || ENRICHMENT.zone, mono: false },
          { l: 'Persons',    v: humanCount, big: true, color: humanCount > 0 ? G.fire : G.green },
          { l: 'Camera',     v: incident?.camera_id ?? 'CAM-01' },
          { l: 'Detections', v: stats.fireCount, big: true, color: G.amber },
        ].map(k => (
          <GCard key={k.l} style={{ padding: '12px 14px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: G.ash, marginBottom: 4 }}>{k.l}</div>
            {k.big
              ? <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                  fontWeight: 400, fontSize: 30, lineHeight: 1, color: k.color || G.graphite }}>
                  {k.v}
                </div>
              : <div style={{ fontFamily: k.mono === false ? "'Manrope',sans-serif" : "'JetBrains Mono',monospace",
                  fontSize: 13, fontWeight: 600, color: G.graphite, lineHeight: 1.4 }}>{k.v}</div>
            }
          </GCard>
        ))}
      </div>

      {/* ── Building ── */}
      <GCard style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: G.linen,
          border: `1px solid ${G.mist}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0 }}>
          <Building2 size={15} color={G.ash} />
        </div>
        <div>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
            fontWeight: 400, fontSize: 16, color: G.graphite, marginBottom: 3 }}>
            {ENRICHMENT.building}
          </div>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash,
            lineHeight: 1.5 }}>{ENRICHMENT.address}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
            color: G.fog, marginTop: 3 }}>Floors: {ENRICHMENT.floors}</div>
        </div>
      </GCard>

      {/* ── AI Analysis ── */}
      <GCard style={{ padding: '14px 16px', background: G.linen }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Brain size={14} color={G.signal} />
          <SectionLabel>AI Analysis</SectionLabel>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
            color: G.fog, marginLeft: 'auto' }}>{avgConf}% avg confidence</span>
        </div>
        <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: G.charcoal,
          lineHeight: 1.6, margin: 0 }}>{aiText}</p>
      </GCard>

      {/* ── Temporal verification ── */}
      <GCard style={{ padding: '14px 16px' }}>
        <SectionLabel>Temporal Verification · YOLOv8x</SectionLabel>
        <Filmstrip confirmed={framesConf} total={framesTotal} />
        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash, marginTop: 8 }}>
          {framesConf >= 5
            ? '⚠ Hazard confirmed — 5+ consecutive frames verified'
            : `Monitoring — ${framesConf} of ${framesTotal} frames confirmed`}
        </div>
      </GCard>

      {/* ── Evidence ── */}
      <div>
        <SectionLabel>Evidence Frames — {evidFrames.length || 0} captured</SectionLabel>
        <EvidenceStrip incidentId={incId} frames={evidFrames} onFrameClick={setModalFrame} />
      </div>
      {modalFrame && <ImageModal frame={modalFrame} incidentId={incId} onClose={() => setModalFrame(null)} />}

      {/* ── 3D Hologram ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SectionLabel>3D Spatial Analysis</SectionLabel>
          {hologram && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.signal }}>
              {hologram.room_geometry?.width_m}×{hologram.room_geometry?.depth_m}m
            </span>
          )}
        </div>
        <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${G.mist}` }}>
          <IsometricHologram hologramData={hologram} humanCount={humanCount} />
        </div>
      </div>

      {/* ── Operator notes ── */}
      <div>
        <SectionLabel>Operator Notes</SectionLabel>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Add notes for this incident…"
          style={{
            width: '100%', minHeight: 90, resize: 'vertical',
            background: G.linen, border: `1px solid ${G.mist}`, borderRadius: 8,
            padding: '10px 13px', fontFamily: "'Manrope',sans-serif",
            fontSize: 13, color: G.charcoal, outline: 'none', lineHeight: 1.6,
          }}
          onFocus={e => e.currentTarget.style.borderColor = G.signal}
          onBlur={e => e.currentTarget.style.borderColor = G.mist}
        />
      </div>

      {/* ── Resolve ── */}
      {!resolved ? (
        <BtnDark onClick={() => setResolved(true)} style={{ width: '100%', justifyContent: 'center' }}>
          <CheckCircle2 size={15} /> Mark as Resolved
        </BtnDark>
      ) : (
        <GCard style={{ padding: '14px 18px', background: G.greenDim, borderColor: `${G.green}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} color={G.green} />
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
              fontWeight: 400, fontSize: 18, color: G.green }}>
              Incident Resolved
            </span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
            color: G.ash, marginTop: 5 }}>
            Logged at {new Date().toLocaleTimeString('en-IN')} IST
          </div>
        </GCard>
      )}
    </div>
  );
}

// ── Right dispatch panel ───────────────────────────────────────────────────
function RightDispatch({ incident, summary }) {
  const [dispatched, setDispatched] = useState(false);
  const stats = aggregateStats(summary);

  const alertLog = summary?.frames?.slice(0, 5).map((f, i) => ({
    time: new Date(f.timestamp * 1000).toLocaleTimeString('en-IN',
      { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    event: i === 0
      ? `Detection started — ${f.fire_count} fire bbox(es)`
      : `Frame ${f.frame_index}: ${f.fire_count}🔥 ${f.human_count}👤 ${f.object_count}📦`,
  })) ?? [
    { time: '15:45:39', event: 'Fire detection started' },
    { time: '15:45:43', event: '2 fire bboxes confirmed' },
    { time: '15:46:14', event: 'Owner notified via push/SMS' },
    { time: '15:46:14', event: 'Auto-escalated → ERSS / 112' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Map */}
      <div>
        <SectionLabel>📍 Live Location</SectionLabel>
        <DispatchMap inc={ENRICHMENT} />
      </div>

      {/* Fire station */}
      <GCard>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${G.mist}` }}>
          <SectionLabel>🚒 Nearest Station</SectionLabel>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
            fontWeight: 400, fontSize: 16, color: G.graphite, lineHeight: 1.3 }}>
            {ENRICHMENT.station}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: G.ash }}>Distance</div>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                fontWeight: 400, fontSize: 24, color: G.amber }}>{ENRICHMENT.stationDist}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: G.ash }}>ETA</div>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                fontWeight: 400, fontSize: 24, color: G.signal }}>{ENRICHMENT.stationEta}</div>
            </div>
          </div>
          {dispatched ? (
            <div style={{ background: G.greenDim, borderRadius: 8, padding: '10px 14px',
              border: `1px solid ${G.green}40`, fontFamily: "'Manrope',sans-serif",
              fontSize: 13, color: G.green, fontWeight: 600, textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <CheckCircle2 size={15} /> Unit Dispatched
            </div>
          ) : (
            <BtnDark onClick={() => setDispatched(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <Truck size={14} /> Dispatch Unit
            </BtnDark>
          )}
        </div>
      </GCard>

      {/* Owner */}
      <GCard style={{ padding: '14px 16px' }}>
        <SectionLabel>Building Owner</SectionLabel>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
          fontWeight: 400, fontSize: 16, color: G.graphite, marginBottom: 8 }}>
          {ENRICHMENT.owner}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <Phone size={12} color={G.green} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
            color: G.charcoal }}>{ENRICHMENT.ownerPhone}</span>
        </div>
        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash,
          lineHeight: 1.5 }}>{ENRICHMENT.address}</div>
      </GCard>

      {/* Alert log */}
      <GCard>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${G.mist}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionLabel>Alert Log</SectionLabel>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.ash }}>
            {stats.frameCount} frames
          </span>
        </div>
        <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column' }}>
          {alertLog.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0',
              borderBottom: i < alertLog.length - 1 ? `1px solid ${G.mist}` : 'none' }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                color: G.signal, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {entry.time}
              </span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12,
                color: G.charcoal, lineHeight: 1.4 }}>{entry.event}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 16px', borderTop: `1px solid ${G.mist}` }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.fog }}>
            {incident?.incident_id ?? '—'} · {incident?.camera_id ?? 'CAM-01'}
          </span>
        </div>
      </GCard>
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────
export default function DispatchConsole() {
  const {
    incidents, loading, error, selectedId, setSelectedId,
    summary, hologram, metadataStats, refresh,
  } = useIncidentData();

  const selectedIncident = incidents.find(i => i.incident_id === selectedId) ?? incidents[0];
  const demoEntries = incidents.length > 0
    ? Array(5).fill(null).map((_, i) => ({ ...incidents[0], _demoId: i }))
    : [];
  const firstFrameIndex = summary?.frames?.[0]?.frame_index ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: G.parchment, fontFamily: "'Manrope',sans-serif",
      display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div style={{
        background: G.paper, borderBottom: `1px solid ${G.mist}`,
        padding: '0 24px', height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={16} color={G.fire} strokeWidth={1.5} />
            <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
              fontWeight: 400, fontSize: 18, color: G.graphite, margin: 0 }}>
              Mumbai Central — ERSS / 112
            </h1>
          </div>
          <div style={{ width: 1, height: 18, background: G.mist }} />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12,
            fontWeight: 500, color: G.ash }}>Operator: Amara Singh</span>
          {!loading && (
            <GBadge label={`${incidents.length} Active`} color={G.fire} />
          )}
          {loading && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G.ash }}>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…
            </span>
          )}
          {error && (
            <button onClick={refresh} style={{
              background: 'none', border: `1px solid ${G.mist}`, borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash,
            }}>
              <RefreshCw size={12} /> Retry
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%',
              background: G.fire, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
              color: G.fire, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Live
            </span>
          </div>
          <div style={{ width: 1, height: 18, background: G.mist }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G.ash }}>
            {new Date().toLocaleTimeString('en-IN')} IST
          </span>
          <a href="/" style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12,
            color: G.ash, textDecoration: 'none' }}>← Portal</a>
        </div>
      </div>

      {/* ── 3-column layout ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'grid',
        gridTemplateColumns: '272px 1fr 296px' }}>

        {/* Left — queue */}
        <div style={{ borderRight: `1px solid ${G.mist}`, display: 'flex',
          flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${G.mist}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12,
              fontWeight: 600, color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Incident Queue
            </span>
            <GBadge label={`${demoEntries.length}`} color={G.signal} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && (
              <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G.ash }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Loading…
              </div>
            )}
            {!loading && demoEntries.length === 0 && (
              <div style={{ padding: '24px 16px', fontFamily: "'Manrope',sans-serif",
                fontSize: 13, color: G.ash, textAlign: 'center' }}>
                No active incidents.
              </div>
            )}
            {demoEntries.map((inc, idx) => (
              <QueueItem
                key={`${inc.incident_id}-${idx}`}
                incident={inc}
                firstFrameIndex={firstFrameIndex}
                selected={selectedId === inc.incident_id}
                onClick={() => setSelectedId(inc.incident_id)}
              />
            ))}
          </div>
        </div>

        {/* Center — detail */}
        <div style={{ borderRight: `1px solid ${G.mist}`, overflowY: 'auto',
          padding: '24px 22px' }}>
          {selectedIncident ? (
            <IncidentDetail
              key={selectedId}
              incident={selectedIncident}
              summary={summary}
              hologram={hologram}
              metadataStats={metadataStats}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: "'Manrope',sans-serif",
              fontSize: 14, color: G.ash }}>
              Select an incident from the queue
            </div>
          )}
        </div>

        {/* Right — dispatch */}
        <div style={{ overflowY: 'auto', padding: '20px 18px' }}>
          <RightDispatch incident={selectedIncident} summary={summary} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        background: G.paper, borderTop: `1px solid ${G.mist}`,
        padding: '8px 24px', display: 'flex', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.fog }}>
          🇮🇳 Routed via India's ERSS / 112 — complete incident data sent to zonal dispatch
        </span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.fog }}>
          Atmarakshak v2.4 · API: localhost:3001
        </span>
      </div>

      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.3); } }
      `}</style>
    </div>
  );
}
