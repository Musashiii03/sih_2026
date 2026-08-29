import React, { useState, useEffect } from 'react';
import IsometricHologram from './IsometricHologram';

// ── Mock incident data ────────────────────────────────────────────
const INCIDENT = {
  id: 'ALERT_CAM03_FIRE_140211',
  camId: 'CAM-03',
  hazard: 'Fire',
  location: 'East Corridor, 2nd Floor',
  building: 'Arjun Tech Park — Block B',
  severity: 'CRITICAL',
  confidence: 97.4,
  surfacePct: 34,
  humanCount: 4,
  framesConfirmed: 5,
  framesTotal: 5,
  timestamp: '14:02:11',
  owner: {
    name: 'Rajesh Mehra',
    role: 'Building Owner',
    phone: '+91-98200-11234',
    email: 'r.mehra@arjuntechpark.in',
    initials: 'RM',
  },
  building_info: {
    name: 'Arjun Tech Park — Block B',
    address: 'Plot 14, MIDC Phase II, Andheri East, Mumbai — 400093',
    floors: 6,
    cameras: 5,
    buildingId: 'BLD-ARJ-B-042',
  },
  nearest_fire: {
    station: 'Andheri East Fire Station',
    distance: '2.1 km',
    eta: '~6 min',
    phone: '101',
  },
  notifications: [
    { id: 1, msg: 'Push notification sent to owner', channel: 'push', icon: 'notifications_active', time: '14:02:11', status: 'read' },
    { id: 2, msg: 'SMS alert dispatched',            channel: 'sms',  icon: 'sms',                 time: '14:02:14', status: 'delivered' },
    { id: 3, msg: 'Email incident report sent',      channel: 'email', icon: 'mail',               time: '14:02:16', status: 'delivered' },
    { id: 4, msg: 'Follow-up push notification',     channel: 'push', icon: 'notifications_active', time: '14:02:30', status: 'delivered' },
    { id: 5, msg: 'Auto-escalated to ERSS/112',     channel: 'push', icon: 'campaign',            time: '14:02:56', status: 'pending' },
  ],
};

// ── Camera Feed ──────────────────────────────────────────────────
function CctvFeed() {
  return (
    <div className="oc-camera-wrap">
      {/* Dark fire-glow background */}
      <div className="oc-camera-bg" />
      {/* Simulated fire SVG */}
      <svg className="oc-camera-svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="ocFireGlow" cx="55%" cy="55%" r="30%">
            <stop offset="0%"   stopColor="#C93A1C" stopOpacity="0.8" />
            <stop offset="60%"  stopColor="#C8841A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ocSmokeGlow" cx="55%" cy="30%" r="25%">
            <stop offset="0%"   stopColor="#7A5C3E" stopOpacity="0.55" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="60" y="60" width="520" height="240" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="60" y1="200" x2="580" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <rect x="120" y="90" width="80" height="110" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <rect x="220" y="90" width="60" height="80"  fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <ellipse cx="350" cy="210" rx="90" ry="60" fill="url(#ocFireGlow)" />
        <ellipse cx="350" cy="145" rx="55" ry="70" fill="url(#ocSmokeGlow)" />
        <ellipse cx="350" cy="295" rx="120" ry="18" fill="rgba(201,58,28,0.14)" />
      </svg>
      {/* Scanlines */}
      <div className="oc-scanlines" />
      {/* Detection bounding box */}
      <div className="oc-bbox" style={{ left: '38%', top: '28%', width: '34%', height: '48%' }}>
        <span className="oc-bbox-label">FIRE · 97.4%</span>
      </div>
      <div className="oc-bbox oc-bbox-person" style={{ left: '18%', top: '50%', width: '9%', height: '26%' }}>
        <span className="oc-bbox-label oc-bbox-label-person">PERSON</span>
      </div>
      {/* HUD overlay */}
      <div className="oc-hud">
        <div className="oc-hud-top">
          <span className="oc-hud-pill oc-hud-pill-live">● REC LIVE</span>
          <span className="oc-hud-pill">{INCIDENT.camId} · 2.4 FPS</span>
        </div>
        <div className="oc-hud-bot">
          <span className="oc-hud-pill">East Corridor — 2F</span>
          <span className="oc-hud-pill">{INCIDENT.timestamp} UTC+5:30</span>
        </div>
      </div>
    </div>
  );
}

// ── Temporal filmstrip ────────────────────────────────────────────
function Filmstrip({ confirmed, total }) {
  return (
    <div className="oc-filmstrip-wrap">
      <div className="oc-filmstrip">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`oc-film-frame${i < confirmed ? ' fire' : ''}`} />
        ))}
      </div>
      <span className="oc-film-label">{confirmed}/{total} positive frames</span>
    </div>
  );
}

// ── SVG Countdown Ring ────────────────────────────────────────────
function CountdownRing({ onAcknowledge, onEscalate }) {
  const [seconds, setSeconds] = useState(45);
  const [done, setDone] = useState(false);
  const TOTAL = 45;
  const r = 46;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    if (seconds <= 0) { setDone(true); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const pct = seconds / TOTAL;
  const dashOffset = circ * (1 - pct);
  const ringColor = seconds <= 10 ? 'var(--critical)' : seconds <= 20 ? 'var(--moderate)' : 'var(--accent)';
  const numColor  = seconds <= 10 ? 'var(--critical)' : seconds <= 20 ? 'var(--moderate)' : 'var(--text)';

  if (done) {
    return (
      <div className="oc-escalated-box">
        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--critical)' }}>campaign</span>
        <div className="oc-escalated-title">AUTO-ESCALATED</div>
        <div className="oc-escalated-sub">Routed to ERSS / 112 emergency dispatch.</div>
      </div>
    );
  }

  return (
    <div className="oc-ring-wrap">
      <div className="oc-ring">
        <svg width="120" height="120" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r={r} fill="transparent" stroke="var(--border-strong)" strokeWidth="5" />
          {/* Progress */}
          <circle
            cx="50" cy="50" r={r}
            fill="transparent"
            stroke={ringColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s' }}
          />
        </svg>
        <div className="oc-ring-inner">
          <span className="oc-ring-number" style={{ color: numColor }}>{seconds}</span>
          <span className="oc-ring-label">SEC</span>
        </div>
      </div>
      <p className="oc-ring-sub">Auto-escalates if no response in time.</p>
      <button className="oc-btn-ack" onClick={onAcknowledge}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        I'm handling this
      </button>
      <button className="oc-btn-escalate" onClick={onEscalate}>
        <span className="material-symbols-outlined">campaign</span>
        Escalate now
      </button>
    </div>
  );
}

// ── Owner Console Root ────────────────────────────────────────────
export default function OwnerConsole() {
  const inc = INCIDENT;
  const [ackDone, setAckDone] = useState(false);

  return (
    <div className="oc-root">
      {/* ── Page Header ── */}
      <header className="oc-header">
        <div>
          <h1 className="oc-header-title">OWNER CONSOLE</h1>
          <div className="oc-header-sub">
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>location_city</span>
            {inc.building_info.name}
          </div>
        </div>
        <div className="oc-live-pill">
          <span className="oc-live-dot" />
          <span>Live Monitoring</span>
        </div>
      </header>

      {/* ── 8 + 4 Grid ── */}
      <div className="oc-grid">

        {/* ═══ Left col (8) ═══ */}
        <div className="oc-left">

          {/* Hero incident card */}
          <section className="oc-hero-card">
            <div className="oc-hero-accent-bar" />
            <div className="oc-hero-inner">
              {/* Card top row */}
              <div className="oc-hero-top">
                <div className="oc-hero-top-left">
                  <span className="badge badge-critical">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span>
                    {inc.severity}
                  </span>
                  <span className="oc-incident-id">{inc.id}</span>
                </div>
                <span className="oc-timestamp">{inc.timestamp}</span>
              </div>

              {/* Fire headline */}
              <h2 className="oc-headline">
                Fire confirmed —{' '}
                <span style={{ color: 'var(--critical)' }}>{inc.location}</span>
              </h2>

              {/* Camera + Temporal verification side by side */}
              <div className="oc-camera-row">
                {/* Camera feed */}
                <CctvFeed />

                {/* Verification + stats */}
                <div className="oc-verify-col">
                  <div>
                    <div className="oc-section-label">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>timeline</span>
                      Temporal Verification
                    </div>
                    <Filmstrip confirmed={inc.framesConfirmed} total={inc.framesTotal} />
                    <p className="oc-verify-sub">5/5 positive frames analyzed</p>
                  </div>

                  {/* Stats 3-col */}
                  <div className="oc-stats-grid">
                    <div className="oc-stat">
                      <div className="stat-number critical" style={{ fontSize: 28 }}>{inc.confidence}%</div>
                      <div className="label">Confidence</div>
                    </div>
                    <div className="oc-stat">
                      <div className="stat-number critical" style={{ fontSize: 28 }}>High</div>
                      <div className="label">Severity</div>
                    </div>
                    <div className="oc-stat">
                      <div className="stat-number accent" style={{ fontSize: 28 }}>{inc.humanCount}</div>
                      <div className="label">Humans</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ════ Spatial Analysis — full professional panel ════ */}
          <section className="sa-card">
            {/* ── Top header bar ── */}
            <div className="sa-header">
              <div className="sa-header-left">
                <div className="sa-header-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 18, color: 'var(--accent)' }}>view_in_ar</span>
                </div>
                <div>
                  <div className="sa-title">Spatial Analysis</div>
                  <div className="sa-subtitle">Arjun Tech Park — Block B · Live occupancy &amp; hazard mapping</div>
                </div>
              </div>
              <div className="sa-header-right">
                <span className="sa-live-tag">
                  <span className="sa-live-blink" />
                  LIVE
                </span>
                <span className="sa-updated">Updated 2s ago</span>
              </div>
            </div>

            {/* ── Stats strip ── */}
            <div className="sa-stats-strip">
              {[
                { icon: 'local_fire_department', label: 'Active Zones',  value: '1',   color: 'var(--critical)', bg: 'var(--critical-dim)' },
                { icon: 'person',                label: 'Occupants',     value: '4',   color: 'var(--accent)',   bg: 'var(--accent-dim)'   },
                { icon: 'videocam',              label: 'Cameras Online', value: '5/5', color: 'var(--safe)',     bg: 'var(--safe-dim)'     },
                { icon: 'stairs',                label: 'Floors',        value: '6',   color: 'var(--text)',     bg: 'var(--bg-card-hover)' },
                { icon: 'thermostat',            label: 'Temp (2F)',     value: '62°C', color: 'var(--critical)', bg: 'var(--critical-dim)' },
              ].map((s, i) => (
                <div key={i} className="sa-stat-chip" style={{ '--chip-color': s.color, '--chip-bg': s.bg }}>
                  <span className="material-symbols-outlined sa-stat-icon" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <div>
                    <div className="sa-stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div className="sa-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main body: floor tabs + 3D view + camera list ── */}
            <div className="sa-body">

              {/* Left: Floor selector */}
              <div className="sa-floors">
                <div className="sa-floors-title">FLOORS</div>
                {[
                  { label: 'Roof',  sub: 'Clear',       color: 'var(--safe)',     active: false },
                  { label: '2F',    sub: '🔥 FIRE',     color: 'var(--critical)', active: true  },
                  { label: '1F',    sub: 'Evacuating',  color: 'var(--moderate)', active: false },
                  { label: 'GF',    sub: 'Clear',       color: 'var(--safe)',     active: false },
                  { label: 'B1',    sub: 'Clear',       color: 'var(--safe)',     active: false },
                ].map((f, i) => (
                  <div key={i} className={`sa-floor-btn${f.active ? ' active' : ''}`} style={{ '--floor-color': f.color }}>
                    <div className="sa-floor-label">{f.label}</div>
                    <div className="sa-floor-sub" style={{ color: f.color }}>{f.sub}</div>
                  </div>
                ))}
                <div className="sa-floor-legend">
                  <div className="sa-floor-legend-item"><span style={{ background: 'var(--critical)' }} />Fire</div>
                  <div className="sa-floor-legend-item"><span style={{ background: 'var(--moderate)' }} />Evacuating</div>
                  <div className="sa-floor-legend-item"><span style={{ background: 'var(--safe)' }} />Clear</div>
                </div>
              </div>

              {/* Centre: 3D building model */}
              <div className="sa-model-wrap">
                <div className="sa-model-label-top">
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>layers</span>
                  2nd Floor Active — East Corridor
                </div>
                <IsometricHologram humanCount={inc.humanCount} />
                <div className="sa-model-compass">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="rgba(255,253,249,0.9)" stroke="var(--border-strong)" strokeWidth="1"/>
                    <polygon points="16,4 13,16 16,14 19,16" fill="var(--critical)" />
                    <polygon points="16,28 13,16 16,18 19,16" fill="var(--text-dim)" />
                    <text x="16" y="7" textAnchor="middle" fontSize="5" fill="var(--critical)" fontFamily="JetBrains Mono" fontWeight="700">N</text>
                  </svg>
                </div>
              </div>

              {/* Right: Camera + Occupant list */}
              <div className="sa-sidebar">
                <div className="sa-sidebar-section">
                  <div className="sa-sidebar-title">
                    <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>videocam</span>
                    Camera Status
                  </div>
                  {[
                    { id: 'CAM-01', loc: 'GF Lobby',      status: 'safe',     fps: '3.2' },
                    { id: 'CAM-02', loc: '1F Stairwell',  status: 'moderate', fps: '2.8' },
                    { id: 'CAM-03', loc: '2F East Corr.', status: 'critical', fps: '2.4' },
                    { id: 'CAM-04', loc: '2F West Corr.', status: 'safe',     fps: '3.0' },
                    { id: 'CAM-05', loc: 'Roof Access',   status: 'safe',     fps: '3.5' },
                  ].map(cam => (
                    <div key={cam.id} className={`sa-cam-item${cam.status === 'critical' ? ' critical' : ''}`}>
                      <div className={`sa-cam-dot ${cam.status}`} />
                      <div className="sa-cam-info">
                        <div className="sa-cam-id">{cam.id}</div>
                        <div className="sa-cam-loc">{cam.loc}</div>
                      </div>
                      <div className="sa-cam-fps">{cam.fps}<span>fps</span></div>
                    </div>
                  ))}
                </div>

                <div className="sa-sidebar-section">
                  <div className="sa-sidebar-title">
                    <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>person_search</span>
                    Occupant Tracking
                  </div>
                  {[
                    { id: 'P1', zone: '2F East', dist: '3m from fire', risk: 'HIGH' },
                    { id: 'P2', zone: '2F East', dist: '6m from fire', risk: 'HIGH' },
                    { id: 'P3', zone: '2F East', dist: '9m from fire', risk: 'MOD'  },
                    { id: 'P4', zone: '2F West', dist: '15m from fire',risk: 'LOW'  },
                  ].map(p => (
                    <div key={p.id} className="sa-person-item">
                      <div className="sa-person-avatar">{p.id}</div>
                      <div className="sa-person-info">
                        <div className="sa-person-zone">{p.zone}</div>
                        <div className="sa-person-dist">{p.dist}</div>
                      </div>
                      <span className={`sa-risk-badge ${p.risk.toLowerCase()}`}>{p.risk}</span>
                    </div>
                  ))}
                </div>

                {/* Evacuation route status */}
                <div className="sa-evac-box">
                  <div className="sa-sidebar-title">
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--safe)', fontVariationSettings: "'FILL' 1" }}>emergency_home</span>
                    Evacuation Routes
                  </div>
                  {[
                    { route: 'Stairwell A', status: 'Clear', ok: true },
                    { route: 'Stairwell B', status: 'Blocked', ok: false },
                    { route: 'Fire Exit GF', status: 'Open', ok: true },
                  ].map((r, i) => (
                    <div key={i} className="sa-evac-row">
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: r.ok ? 'var(--safe)' : 'var(--critical)', fontVariationSettings: "'FILL' 1" }}>
                        {r.ok ? 'check_circle' : 'cancel'}
                      </span>
                      <span className="sa-evac-name">{r.route}</span>
                      <span className="sa-evac-status" style={{ color: r.ok ? 'var(--safe)' : 'var(--critical)' }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>


          {/* Notification log */}
          <section className="oc-comm-card-wide">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>history</span>
                {' '}Communication Log
              </span>
              <span className="badge badge-moderate">{inc.notifications.length} messages</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <ul className="oc-comm-list">
                {inc.notifications.map((n, i) => (
                  <li key={n.id} className="oc-comm-item">
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 16, marginTop: 2, flexShrink: 0,
                        color: n.status === 'read' ? 'var(--accent)' : n.status === 'delivered' ? 'var(--safe)' : 'var(--text-dim)'
                      }}
                    >
                      {n.icon}
                    </span>
                    <span className="oc-comm-msg">{n.msg}</span>
                    <div className="oc-comm-right">
                      <div className="oc-comm-time">{n.time}</div>
                      <div className={`oc-comm-status ${n.status}`}>{n.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* ═══ Right col (4) ═══ */}
        <div className="oc-right">

          {/* Action Center / Countdown */}
          <section className="oc-action-card">
            {ackDone ? (
              <div className="oc-ack-done">
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--safe)', fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <div className="oc-ack-title">Acknowledged</div>
                <div className="oc-ack-sub">You've taken ownership. Escalation paused.</div>
              </div>
            ) : (
              <CountdownRing
                onAcknowledge={() => setAckDone(true)}
                onEscalate={() => alert('Escalated to ERSS / 112 dispatch immediately.')}
              />
            )}
          </section>

          {/* Nearest fire station */}
          <section className="card oc-info-card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>local_fire_department</span>
                {' '}Nearest Responder
              </span>
            </div>
            <div className="card-body">
              <div className="oc-fire-row">
                <span className="oc-fire-station">{inc.nearest_fire.station}</span>
                <span className="oc-fire-dist-badge">{inc.nearest_fire.distance}</span>
              </div>
              <div className="oc-fire-eta">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
                ETA {inc.nearest_fire.eta}
              </div>
              <div className="oc-fire-phone">
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--safe)' }}>call</span>
                Emergency: <strong style={{ color: 'var(--safe)' }}>{inc.nearest_fire.phone}</strong>
              </div>
            </div>
          </section>

          {/* Building info */}
          <section className="card oc-info-card">
            <div className="card-header">
              <span className="card-title">
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>apartment</span>
                {' '}Building Info
              </span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="label" style={{ fontSize: 9 }}>Building</div>
                <div className="oc-info-val">{inc.building_info.name}</div>
              </div>
              <div>
                <div className="label" style={{ fontSize: 9 }}>Address</div>
                <div className="oc-info-sub">{inc.building_info.address}</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div className="label" style={{ fontSize: 9 }}>Floors</div>
                  <div className="stat-number" style={{ fontSize: 22 }}>{inc.building_info.floors}</div>
                </div>
                <div>
                  <div className="label" style={{ fontSize: 9 }}>Cameras</div>
                  <div className="stat-number safe" style={{ fontSize: 22 }}>{inc.building_info.cameras}/5</div>
                </div>
              </div>
            </div>
          </section>

          {/* Owner card */}
          <section className="card oc-info-card">
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="oc-owner-avatar">{inc.owner.initials}</div>
              <div>
                <div className="oc-info-val">{inc.owner.name}</div>
                <div className="oc-info-sub" style={{ marginTop: 3 }}>{inc.owner.role}</div>
                <div className="oc-info-sub">{inc.owner.phone}</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="oc-footer">
        <span>Atmarakshak v2.4 · ERSS/112 Integration Active · YOLOv8x Detection Engine</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#" className="oc-footer-link">Privacy Policy</a>
          <a href="#" className="oc-footer-link">System Health</a>
          <a href="#" className="oc-footer-link">Support</a>
        </div>
      </footer>
    </div>
  );
}
