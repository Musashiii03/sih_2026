import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { INCIDENTS, getIncident, severityClass, statusColor } from '../data/incidents';

// ── CCTV feed (dispatch variant) ─────────────────────────────────
function DispatchCctv({ inc }) {
  const fireColor = inc.severity === 'CRITICAL' ? '#C93A1C'
                  : inc.severity === 'MODERATE' ? '#B87518' : '#4A7C2F';
  return (
    <div className="dcctv-wrap">
      <div className="dcctv-bg" style={{
        background: `radial-gradient(ellipse 58% 48% at 56% 55%, ${fireColor}55 0%, #120C06ee 80%)`
      }} />
      <svg className="dcctv-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">
        <rect x="60" y="60" width="520" height="240" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        <line x1="60" y1="200" x2="580" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
        <rect x="120" y="90" width="80" height="110" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        {inc.severity === 'CRITICAL' && <>
          <ellipse cx="355" cy="210" rx="90" ry="55" fill={`${fireColor}50`}/>
          <ellipse cx="355" cy="148" rx="55" ry="68" fill="rgba(100,70,40,0.45)"/>
        </>}
      </svg>
      <div className="dcctv-scanlines"/>
      {inc.severity === 'CRITICAL' && (
        <div className="dcctv-bbox">
          <span className="dcctv-bbox-label">{inc.typLabel.toUpperCase()} · {inc.confidence}%</span>
        </div>
      )}
      <div className="dcctv-hud">
        <div className="dcctv-hud-top">
          <span className={`dcctv-pill${inc.severity === 'CRITICAL' ? ' live' : ''}`}>
            {inc.severity === 'CRITICAL' ? '● REC LIVE' : '● REC'}
          </span>
          <span className="dcctv-pill">{inc.camId} · {inc.confidence}%</span>
        </div>
        <div className="dcctv-hud-bot">
          <span className="dcctv-pill">{inc.zone}</span>
          <span className="dcctv-pill">{inc.timestamp}</span>
        </div>
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────
function Timeline({ events }) {
  const iconMap = {
    alert: { icon: 'emergency', color: 'var(--critical)' },
    notify: { icon: 'notifications_active', color: 'var(--accent)' },
    ack: { icon: 'check_circle', color: 'var(--safe)' },
    system: { icon: 'settings', color: 'var(--text-muted)' },
    escalate: { icon: 'campaign', color: 'var(--critical)' },
  };
  return (
    <div className="dtl-timeline">
      {events.map((e, i) => {
        const { icon, color } = iconMap[e.type] || iconMap.notify;
        return (
          <div key={i} className="dtl-timeline-row">
            <div className="dtl-timeline-dot" style={{ borderColor: color }}>
              <span className="material-symbols-outlined" style={{ fontSize: 10, color }}>{icon}</span>
            </div>
            {i < events.length - 1 && <div className="dtl-timeline-line"/>}
            <div className="dtl-timeline-content">
              <span className="dtl-time">{e.time}</span>
              <span className="dtl-event">{e.event}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sensor readings ───────────────────────────────────────────────
function SensorGrid({ sensors }) {
  const fields = [
    { key: 'smoke',     label: 'Smoke',     icon: 'air' },
    { key: 'temp',      label: 'Temp',      icon: 'thermostat' },
    { key: 'co',        label: 'CO Level',  icon: 'science' },
    { key: 'sprinkler', label: 'Sprinkler', icon: 'water_drop' },
    { key: 'hvac',      label: 'HVAC',      icon: 'air_freshener' },
  ];
  return (
    <div className="dtl-sensors">
      {fields.map(f => (
        <div key={f.key} className="dtl-sensor-chip">
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--text-muted)', fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
          <div>
            <div className="dtl-sensor-label">{f.label}</div>
            <div className="dtl-sensor-val">{sensors[f.key]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dispatch Incident Detail Page ─────────────────────────────────
export default function IncidentDashboard() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const inc = getIncident(incidentId);
  const [dispatched, setDispatched] = useState({});
  const [resolved, setResolved] = useState(inc?.status === 'Resolved');
  const [notes, setNotes] = useState('');

  if (!inc) {
    return (
      <div className="dtl-notfound">
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-dim)' }}>search_off</span>
        <h2>Incident not found</h2>
        <button className="btn btn-ghost" onClick={() => navigate('/dispatch')}>← Back to Dispatch</button>
      </div>
    );
  }

  const sevColor = inc.severity === 'CRITICAL' ? 'var(--critical)'
                 : inc.severity === 'MODERATE' ? 'var(--moderate)' : 'var(--safe)';

  return (
    <div className="dtl-root">
      {/* ── Top header bar ── */}
      <header className="dtl-header">
        <div className="dtl-header-left">
          <button className="dtl-back-btn" onClick={() => navigate('/dispatch')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Back to Queue
          </button>
          <div className="dtl-header-divider"/>
          <div>
            <div className="dtl-header-title">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: sevColor, fontVariationSettings: "'FILL' 1" }}>
                {inc.typeIcon}
              </span>
              {inc.typLabel} Incident — {inc.shortId}
            </div>
            <div className="dtl-header-sub">{inc.building} · {inc.zone}</div>
          </div>
        </div>
        <div className="dtl-header-right">
          <span className={severityClass(inc.severity)}>{inc.severity}</span>
          <span className="dtl-status-pill" style={{ color: statusColor(inc.status), borderColor: `${statusColor(inc.status)}40` }}>
            ● {inc.status}
          </span>
          <span className="dtl-timestamp">{inc.timestamp} IST</span>
        </div>
      </header>

      {/* ── 3-column body ── */}
      <div className="dtl-body">

        {/* ══ Left: CCTV + AI + Timeline ══ */}
        <div className="dtl-left">
          <DispatchCctv inc={inc} />

          {/* AI Analysis card */}
          <div className="card dtl-ai-card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent)', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                AI Analysis
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>{inc.confidence}% confidence</span>
            </div>
            <div className="card-body">
              <p className="dtl-ai-text">{inc.aiAnalysis}</p>
              <div className="dtl-filmstrip">
                {Array.from({ length: inc.framesTotal }).map((_, i) => (
                  <div key={i} className={`dtl-frame${i < inc.framesConfirmed ? ' confirmed' : ''}`}/>
                ))}
                <span className="dtl-frame-label">{inc.framesConfirmed}/{inc.framesTotal} frames verified</span>
              </div>
            </div>
          </div>

          {/* Sensor readings */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>sensors</span>
                Sensor Telemetry
              </span>
            </div>
            <div className="card-body">
              <SensorGrid sensors={inc.sensors} />
            </div>
          </div>

          {/* Alert timeline */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>timeline</span>
                Alert Timeline
              </span>
            </div>
            <div className="card-body">
              <Timeline events={inc.alertCooldown} />
            </div>
          </div>
        </div>

        {/* ══ Center: Map + Building + Notes ══ */}
        <div className="dtl-center">
          {/* Stats row */}
          <div className="dtl-stats-row">
            {[
              { label: 'Occupants at Risk', value: inc.victims,     color: 'var(--critical)', icon: 'person' },
              { label: 'Confidence',         value: `${inc.confidence}%`, color: 'var(--accent)', icon: 'analytics' },
              { label: 'Temp',              value: inc.temperature, color: inc.severity === 'CRITICAL' ? 'var(--critical)' : 'var(--text)', icon: 'thermostat' },
              { label: 'Humidity',          value: inc.humidity,    color: 'var(--safe)', icon: 'water_drop' },
            ].map((s, i) => (
              <div key={i} className="dtl-stat-chip">
                <span className="material-symbols-outlined dtl-stat-icon" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                <div>
                  <div className="dtl-stat-val" style={{ color: s.color }}>{s.value}</div>
                  <div className="dtl-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Location map placeholder */}
          <div className="card dtl-map-card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>location_on</span>
                Live Location
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{inc.stationDist} from station</span>
            </div>
            <div className="dtl-map-body">
              <div className="dtl-map-bg">
                {/* Stylised map mock */}
                <svg width="100%" height="100%" viewBox="0 0 400 200" style={{ position: 'absolute', inset: 0 }}>
                  <rect width="400" height="200" fill="#F5ECD8"/>
                  {/* Roads */}
                  <line x1="0" y1="100" x2="400" y2="100" stroke="#E0D0B0" strokeWidth="14"/>
                  <line x1="200" y1="0" x2="200" y2="200" stroke="#E0D0B0" strokeWidth="10"/>
                  <line x1="0" y1="140" x2="400" y2="140" stroke="#EDE0C4" strokeWidth="6"/>
                  <line x1="130" y1="0" x2="130" y2="200" stroke="#EDE0C4" strokeWidth="6"/>
                  <line x1="300" y1="0" x2="300" y2="200" stroke="#EDE0C4" strokeWidth="5"/>
                  {/* Blocks */}
                  {[[30,20,85,70],[155,20,35,70],[250,20,110,70],[320,20,60,70],
                    [30,120,85,60],[155,120,35,60],[250,120,30,60],[300,155,80,35]].map(([x,y,w,h],i)=>(
                    <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#EDE0C4" stroke="#D4C4A0" strokeWidth="1"/>
                  ))}
                  {/* Incident marker */}
                  <circle cx="200" cy="100" r="18" fill="rgba(201,58,28,0.18)" stroke="rgba(201,58,28,0.6)" strokeWidth="2"/>
                  <circle cx="200" cy="100" r="8" fill="var(--critical)" opacity="0.9"/>
                  <circle cx="200" cy="100" r="4" fill="#fff"/>
                  {/* Station marker */}
                  <circle cx="310" cy="65" r="10" fill="rgba(74,124,47,0.2)" stroke="rgba(74,124,47,0.6)" strokeWidth="1.5"/>
                  <circle cx="310" cy="65" r="5" fill="var(--safe)" opacity="0.9"/>
                  <line x1="200" y1="100" x2="310" y2="65" stroke="rgba(74,124,47,0.5)" strokeWidth="1.5" strokeDasharray="6 3"/>
                </svg>
                <div className="dtl-map-legend">
                  <span><span style={{ background: 'var(--critical)', borderRadius: '50%', display: 'inline-block', width: 7, height: 7 }}/>  Incident</span>
                  <span><span style={{ background: 'var(--safe)', borderRadius: '50%', display: 'inline-block', width: 7, height: 7 }}/>  Fire Station</span>
                </div>
              </div>
            </div>
          </div>

          {/* Building info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>apartment</span>
                Building
              </span>
            </div>
            <div className="card-body dtl-building-body">
              <div>
                <div className="dtl-bldg-name">{inc.building}</div>
                <div className="dtl-bldg-addr">{inc.address}</div>
              </div>
              <div className="dtl-bldg-meta">
                <div><span className="label" style={{ fontSize: 9 }}>Floors</span><div className="stat-number" style={{ fontSize: 18 }}>{inc.floors}</div></div>
                <div><span className="label" style={{ fontSize: 9 }}>Camera</span><div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{inc.camId}</div></div>
              </div>
            </div>
          </div>

          {/* Owner */}
          <div className="card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="dtl-owner-avatar">{inc.ownerInitials}</div>
              <div>
                <div className="dtl-owner-name">{inc.owner}</div>
                <div className="dtl-owner-sub">Building Owner · {inc.ownerPhone}</div>
                <div className="dtl-owner-sub">{inc.ownerEmail}</div>
              </div>
              <a href={`tel:${inc.ownerPhone}`} className="dtl-call-btn">
                <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>call</span>
                Call
              </a>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit_note</span>
                Operator Notes
              </span>
            </div>
            <div className="card-body">
              <textarea
                className="dtl-notes"
                placeholder="Add notes for this incident…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ══ Right: Dispatch Actions ══ */}
        <div className="dtl-right">
          {/* Nearest fire station */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                Nearest Station
              </span>
            </div>
            <div className="card-body">
              <div className="dtl-station-name">{inc.station}</div>
              <div className="dtl-station-row">
                <div><span className="label" style={{ fontSize: 9 }}>Distance</span><div className="stat-number accent" style={{ fontSize: 22 }}>{inc.stationDist}</div></div>
                <div><span className="label" style={{ fontSize: 9 }}>ETA</span><div className="stat-number moderate" style={{ fontSize: 22 }}>{inc.stationEta}</div></div>
              </div>
              <a href="tel:101" className="dtl-call-station">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>call</span>
                Call Station — {inc.stationPhone}
              </a>
            </div>
          </div>

          {/* Dispatch units */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                Response Units
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {inc.units.map(unit => (
                <div key={unit.id} className="dtl-unit-row">
                  <div>
                    <div className="dtl-unit-name">{unit.name}</div>
                    <div className="dtl-unit-id">{unit.id} · ETA {unit.eta}</div>
                  </div>
                  {dispatched[unit.id] ? (
                    <span className="dtl-unit-dispatched">✓ Sent</span>
                  ) : (
                    <button className="dtl-dispatch-btn" onClick={() => setDispatched(d => ({ ...d, [unit.id]: true }))}>
                      Dispatch
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resolve */}
          <div className="card" style={{ border: resolved ? '1px solid rgba(74,124,47,0.3)' : '1px solid var(--border)' }}>
            <div className="card-body">
              {resolved ? (
                <div className="dtl-resolved-box">
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--safe)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div className="dtl-resolved-title">Incident Resolved</div>
                  <div className="dtl-resolved-sub">Closed by operator at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ) : (
                <>
                  <p className="dtl-resolve-hint">Mark this incident as resolved after confirming the situation is under control.</p>
                  <button className="dtl-resolve-btn" onClick={() => setResolved(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Mark as Resolved
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ERSS escalate */}
          {!resolved && (
            <div className="card" style={{ border: '1px solid var(--critical-ring)', background: 'var(--critical-dim)' }}>
              <div className="card-body">
                <div className="dtl-erss-title">
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--critical)', fontVariationSettings: "'FILL' 1" }}>campaign</span>
                  ERSS / 112
                </div>
                <p className="dtl-erss-sub">Route to national emergency dispatch instantly.</p>
                <button className="dtl-erss-btn" onClick={() => alert('Routed to ERSS/112 national emergency dispatch.')}>
                  Escalate to ERSS / 112
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
