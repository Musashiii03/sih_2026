import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INCIDENTS, severityClass, statusColor } from '../data/incidents';
import DispatchMap from './DispatchMap';

// ── Mini CCTV thumbnail ──────────────────────────────────────────
function MiniCctv({ severity }) {
  const c = severity === 'CRITICAL' ? '#C93A1C' : severity === 'MODERATE' ? '#B87518' : '#4A7C2F';
  return (
    <div style={{ background: '#0d0906', borderRadius: 6, position: 'relative', overflow: 'hidden', aspectRatio: '16/9', border: '1px solid var(--border-strong)', flex: '0 0 110px' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 55% 45% at 55% 55%, ${c}40 0%, #1B120C90 80%)`, zIndex: 1 }} />
      <div className="cctv-scanlines" />
      {severity === 'CRITICAL' && (
        <div className="bbox" style={{ left: '38%', top: '28%', width: '30%', height: '44%' }}>
          <span className="bbox-label">FIRE</span>
        </div>
      )}
      <div style={{
        position: 'absolute', top: 5, left: 5, zIndex: 5,
        background: 'rgba(201,58,28,0.88)', borderRadius: 3, padding: '2px 6px',
        fontFamily: 'var(--font-mono)', fontSize: 8, color: '#fff', fontWeight: 700,
        display: severity === 'CRITICAL' ? 'block' : 'none', animation: 'blink 1.5s infinite'
      }}>● LIVE</div>
    </div>
  );
}

// ── Incident queue row ───────────────────────────────────────────
function QueueRow({ inc, onOpen }) {
  const typeEmoji = { fire: '🔥', smoke: '🌫️', water_leak: '💧' };
  return (
    <div className="dq-row" onClick={onOpen}>
      <MiniCctv severity={inc.severity} />
      <div className="dq-row-content">
        <div className="dq-row-top">
          <div className="dq-row-title">{typeEmoji[inc.type]} {inc.building}</div>
          <span className={severityClass(inc.severity)}>{inc.severity}</span>
        </div>
        <div className="dq-row-zone">{inc.zone}</div>
        <div className="dq-row-bot">
          <span className="dq-time">
            <span className="material-symbols-outlined" style={{ fontSize: 10, verticalAlign: 'middle' }}>schedule</span>
            {' '}{inc.timeSince}
          </span>
          <span className="dq-status" style={{ color: statusColor(inc.status) }}>● {inc.status}</span>
          <span className="dq-conf">
            <span className="material-symbols-outlined" style={{ fontSize: 10, verticalAlign: 'middle', color: 'var(--accent)' }}>analytics</span>
            {' '}{inc.confidence}%
          </span>
        </div>
      </div>
      <span className="material-symbols-outlined dq-arrow">chevron_right</span>
    </div>
  );
}

// ── Dispatch Console (queue overview) ────────────────────────────
export default function DispatchConsole() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? INCIDENTS
    : INCIDENTS.filter(i => i.severity.toLowerCase() === filter || i.status.toLowerCase() === filter);

  const active    = INCIDENTS.filter(i => i.status === 'Active').length;
  const critical  = INCIDENTS.filter(i => i.severity === 'CRITICAL').length;
  const resolved  = INCIDENTS.filter(i => i.status === 'Resolved').length;

  return (
    <div className="dc-root">
      {/* ── Header ── */}
      <header className="dc-header">
        <div>
          <h1 className="dc-title">Mumbai Central — ERSS / 112 Dispatch</h1>
          <div className="dc-sub">Zone: Greater Mumbai · Operator: Amara Singh</div>
        </div>
        <div className="dc-header-right">
          <span className="badge badge-critical">
            <span className="material-symbols-outlined" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            {active} Active
          </span>
          <div className="oc-live-pill" style={{ padding: '6px 14px' }}>
            <span className="oc-live-dot"/>
            <span>Live</span>
          </div>
          <span className="dc-time">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
          </span>
        </div>
      </header>

      {/* ── Summary stat strip ── */}
      <div className="dc-stats">
        {[
          { label: 'Total Incidents', value: INCIDENTS.length, color: 'var(--text)',     icon: 'list_alt' },
          { label: 'Active',          value: active,           color: 'var(--critical)', icon: 'emergency' },
          { label: 'Critical',        value: critical,         color: 'var(--critical)', icon: 'local_fire_department' },
          { label: 'Investigating',   value: 1,                color: 'var(--moderate)', icon: 'search' },
          { label: 'Resolved',        value: resolved,         color: 'var(--safe)',     icon: 'check_circle' },
        ].map((s, i) => (
          <div key={i} className="dc-stat">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            <div className="dc-stat-val" style={{ color: s.color }}>{s.value}</div>
            <div className="dc-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Body: incident list + mini-map ── */}
      <div className="dc-body">
        {/* Queue */}
        <div className="dc-queue">
          <div className="dc-queue-header">
            <span className="dc-queue-title">Incident Queue</span>
            <div className="dc-filters">
              {['all', 'CRITICAL', 'MODERATE', 'Resolved'].map(f => (
                <button
                  key={f}
                  className={`dc-filter-btn${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f === filter ? 'all' : f)}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>
          <div className="dc-queue-list">
            {filtered.map(inc => (
              <QueueRow
                key={inc.id}
                inc={inc}
                onOpen={() => navigate(`/dispatch/${inc.id}`)}
              />
            ))}
          </div>
          <div className="dc-queue-footer">
            Showing {filtered.length} of {INCIDENTS.length} incidents · Click any row to open full dashboard
          </div>
        </div>

        {/* Map sidebar */}
        <div className="dc-map-panel">
          <div className="dc-map-title">
            <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>map</span>
            Active Incident Map
          </div>
          <DispatchMap inc={INCIDENTS[0]} />
          <div className="dc-map-legend">
            {INCIDENTS.map(inc => (
              <div
                key={inc.id}
                className="dc-map-legend-row"
                onClick={() => navigate(`/dispatch/${inc.id}`)}
              >
                <span className="dc-map-dot" style={{ background: inc.severity === 'CRITICAL' ? 'var(--critical)' : inc.severity === 'MODERATE' ? 'var(--moderate)' : 'var(--safe)' }}/>
                <span className="dc-map-bldg">{inc.building}</span>
                <span className={severityClass(inc.severity)} style={{ padding: '1px 6px', fontSize: 9 }}>{inc.severity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="dc-footer">
        <span>🇮🇳 Routed via India's ERSS / 112 — complete incident data sent to zonal dispatch controller</span>
        <span style={{ color: 'var(--accent)' }}>Atmarakshak v2.4</span>
      </footer>
    </div>
  );
}
