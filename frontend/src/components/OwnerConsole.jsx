/**
 * OwnerConsole — Hierarchical drill-down dashboard
 * Levels: Owner → Organization → Building → Live Monitoring → Incident → Management → History
 * Style: GIC design language (Fraunces, Manrope, parchment canvas, hairline borders, signal-blue CTAs)
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, Building2, Camera, Flame,
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  Clock, MapPin, Users, Eye, FileText, Bell,
  ChevronRight, RefreshCw, Loader2, X, Search,
  TrendingUp, AlertCircle, CheckCircle, ZapOff
} from 'lucide-react';
import {
  useIncidentData, frameImageUrl, deriveSeverity, getEvidenceFrames, aggregateStats
} from '../hooks/useIncidentData';
import {
  useOwnerData,
  OWNER_PROFILE, OWNER_BUILDINGS, OWNER_CAMERAS,
  OWNER_COMPLAINTS, OWNER_ALERTS, PEOPLE_SAFETY
} from '../hooks/useOwnerData';

// ═══════════════════════════════════════════════════════════════════
// GIC DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════
const G = {
  parchment:  '#fefffc',
  paper:      '#ffffff',
  linen:      '#f9faf7',
  inkBlack:   '#171717',
  graphite:   '#2c2c2c',
  charcoal:   '#444141',
  ash:        '#646464',
  fog:        '#b4b8b4',
  mist:       '#dee2de',
  twilight:   '#282834',
  dusk:       '#1f1f29',
  signal:     '#41a1cf',
  cerulean:   '#0081c0',
  // semantic
  fire:       '#e11d48',
  fireDim:    '#fef2f2',
  fireRing:   '#fecaca',
  amber:      '#d97706',
  amberDim:   '#fffbeb',
  green:      '#16a34a',
  greenDim:   '#f0fdf4',
};

// ═══════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

/** Breadcrumb trail */
function Breadcrumb({ crumbs, onNavigate }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={13} color={G.fog} />}
          {i < crumbs.length - 1 ? (
            <button onClick={() => onNavigate(c.level, c.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500,
              color: G.signal, letterSpacing: '-0.01em',
            }}>{c.label}</button>
          ) : (
            <span style={{
              fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600,
              color: G.graphite, letterSpacing: '-0.01em',
            }}>{c.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** Section page header */
function PageHeader({ title, subtitle, actions, breadcrumb, onBack, level }) {
  const levelColors = {
    owner:    G.graphite,
    org:      G.cerulean,
    building: G.amber,
    live:     G.fire,
    incident: G.fire,
    manage:   G.amber,
    history:  G.graphite,
  };
  return (
    <div style={{ borderBottom: `1px solid ${G.mist}`, paddingBottom: 24, marginBottom: 32 }}>
      {breadcrumb}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginTop: breadcrumb ? 16 : 0, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {onBack && (
            <button onClick={onBack} style={{
              background: 'none', border: `1px solid ${G.mist}`, borderRadius: 8,
              width: 36, height: 36, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: G.ash,
              flexShrink: 0, marginTop: 4,
            }}>
              <ArrowLeft size={15} />
            </button>
          )}
          <div>
            <h1 style={{
              fontFamily: "'Fraunces',Georgia,serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.8px',
              color: levelColors[level] || G.graphite, margin: 0,
            }}>{title}</h1>
            {subtitle && <p style={{
              fontFamily: "'Manrope',sans-serif", fontSize: 15, fontWeight: 400,
              color: G.ash, marginTop: 6, letterSpacing: '-0.01em',
            }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{actions}</div>}
      </div>
    </div>
  );
}

/** GIC white content card */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: G.paper, border: `1px solid ${G.mist}`,
      borderRadius: 12, boxShadow: '0 1px 1px rgba(0,0,0,0.06),0 4px 5px rgba(0,0,0,0.04)',
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Outlined signal-blue CTA */
function BtnOutline({ children, onClick, icon, small = false, style = {} }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? `${G.signal}12` : 'transparent',
        border: `1px solid ${G.signal}`, borderRadius: 8,
        padding: small ? '5px 12px' : '8px 16px',
        fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500,
        color: G.signal, letterSpacing: '-0.01em', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'background 0.15s', ...style,
      }}>
      {children}
      {icon !== false && (
        <span style={{ width: 18, height: 18, borderRadius: '50%',
          border: `1px solid ${G.signal}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowRight size={10} />
        </span>
      )}
    </button>
  );
}

/** Dark Dusk filled button */
function BtnDark({ children, onClick, small = false, disabled = false, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? G.fog : G.dusk, border: `1px solid ${G.twilight}`,
      borderRadius: 8, padding: small ? '6px 14px' : '9px 18px',
      fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500,
      color: '#fff', letterSpacing: '-0.01em', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      opacity: disabled ? 0.6 : 1, transition: 'opacity 0.15s', ...style,
    }}>
      {children}
    </button>
  );
}

/** Severity / status badge */
function Badge({ label, color = G.signal, bg }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color, background: bg || `${color}15`,
      border: `1px solid ${color}40`, borderRadius: 999,
      padding: '2px 9px', display: 'inline-block', lineHeight: 1.5,
    }}>{label}</span>
  );
}

function SevBadge({ sev }) {
  const map = {
    CRITICAL: { color: G.fire,  label: 'Critical' },
    HIGH:     { color: '#d97706', label: 'High' },
    MODERATE: { color: G.amber, label: 'Moderate' },
    LOW:      { color: G.green, label: 'Low' },
    SAFE:     { color: G.green, label: 'Safe' },
    UNKNOWN:  { color: G.fog,   label: 'Unknown' },
  };
  const s = map[sev?.toUpperCase()] || map.UNKNOWN;
  return <Badge label={s.label} color={s.color} />;
}

/** Safety status dot */
function SafetyDot({ status }) {
  const c = status === 'CRITICAL' ? G.fire : status === 'ATTENTION' ? G.amber : G.green;
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block',
    boxShadow: `0 0 0 3px ${c}25`, flexShrink: 0 }} />;
}

/** Horizontal divider */
const Divider = ({ my = 24 }) => (
  <div style={{ height: 1, background: G.mist, margin: `${my}px 0` }} />
);

/** KPI chip */
function KpiChip({ label, value, sub, valueColor = G.graphite, icon }) {
  return (
    <Card style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 500,
          color: G.ash, letterSpacing: '-0.01em' }}>{label}</span>
        {icon && <span style={{ color: G.fog }}>{icon}</span>}
      </div>
      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
        fontWeight: 400, fontSize: 36, lineHeight: 1, color: valueColor }}>{value}</div>
      {sub && <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>{sub}</div>}
    </Card>
  );
}

/** Frame image (real from backend) */
function FrameThumb({ incidentId, frameIndex, style = {} }) {
  const [ok, setOk] = useState(false);
  const url = incidentId ? frameImageUrl(incidentId, frameIndex) : null;
  return (
    <div style={{ background: G.linen, borderRadius: 6, overflow: 'hidden',
      border: `1px solid ${G.mist}`, ...style, position: 'relative' }}>
      {url && <img src={url} alt="" onLoad={() => setOk(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover',
          opacity: ok ? 1 : 0, transition: 'opacity 0.3s', display: 'block' }} />}
      {(!url || !ok) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: G.fog }}>
          <Camera size={18} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MOCK INCIDENTS (7-level system needs full incident data)
// ═══════════════════════════════════════════════════════════════════
const INCIDENTS = [
  {
    id: 'INC-00142', orgId: 'ORG-001', buildingId: 'BLD-ARJ-B-042',
    camId: 'CAM-02', camCode: 'ARJ-B-CAM-02',
    type: 'Fire', severity: 'CRITICAL', confidence: 97.4,
    location: 'East Corridor, 2nd Floor', floor: '2',
    timestamp: '2026-08-30T15:46:14Z', timestampDisplay: '30 Aug 2026, 15:46 IST',
    status: 'Active', framesConfirmed: 5, framesTotal: 5,
    evidenceCount: 6, humanCount: 0, objectCount: 2,
    notes: '', resolution: null,
    incidentIdBackend: 'INC-20260830-230331',
  },
  {
    id: 'INC-00141', orgId: 'ORG-001', buildingId: 'BLD-SHL-A-011',
    camId: 'CAM-06', camCode: 'SHL-A-CAM-02',
    type: 'Smoke', severity: 'HIGH', confidence: 72.1,
    location: 'Kitchen Block, 3rd Floor', floor: '3',
    timestamp: '2026-08-29T13:51:04Z', timestampDisplay: '29 Aug 2026, 13:51 IST',
    status: 'Investigating', framesConfirmed: 4, framesTotal: 5,
    evidenceCount: 3, humanCount: 2, objectCount: 1,
    notes: 'Owner investigating kitchen steam vs actual smoke.',
    resolution: null,
    incidentIdBackend: null,
  },
  {
    id: 'INC-00139', orgId: 'ORG-001', buildingId: 'BLD-ARJ-B-042',
    camId: 'CAM-03', camCode: 'ARJ-B-CAM-03',
    type: 'Water Leak', severity: 'MODERATE', confidence: 91.0,
    location: 'Server Room B, 1st Floor', floor: '1',
    timestamp: '2026-08-28T11:24:40Z', timestampDisplay: '28 Aug 2026, 11:24 IST',
    status: 'Resolved', framesConfirmed: 5, framesTotal: 5,
    evidenceCount: 4, humanCount: 0, objectCount: 3,
    notes: 'HVAC auto-shutdown applied. Plumber called. Resolved.',
    resolution: 'Leak fixed by maintenance. No damage to server equipment.',
    incidentIdBackend: null,
  },
  {
    id: 'INC-00137', orgId: 'ORG-001', buildingId: 'BLD-WRH-D-007',
    camId: 'CAM-14', camCode: 'WRH-D-CAM-04',
    type: 'Person', severity: 'LOW', confidence: 84.0,
    location: 'Generator Room, Ground Floor', floor: 'G',
    timestamp: '2026-09-02T22:18:00Z', timestampDisplay: '2 Sep 2026, 22:18 IST',
    status: 'Resolved', framesConfirmed: 5, framesTotal: 5,
    evidenceCount: 2, humanCount: 1, objectCount: 0,
    notes: 'Security responded. Authorised maintenance personnel.',
    resolution: 'False positive — authorised staff. Cleared.',
    incidentIdBackend: null,
  },
];

// Mock organisation (single org for now)
const ORGS = [
  {
    id: 'ORG-001', name: 'Mehra Properties Ltd.',
    buildings: 3, cameras: 18, activeIncidents: 2,
    resolvedIncidents: 12, overallSafetyScore: 74,
    since: '2021-04-01',
  },
];

// ═══════════════════════════════════════════════════════════════════
// LEVEL 1 — OWNER DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function OwnerDashboard({ navigate }) {
  const ownerData = useOwnerData();
  const { kpis, incidents, loading, alerts } = ownerData;
  const unread = OWNER_ALERTS.filter(a => !a.read).length;
  const activeFire = INCIDENTS.filter(i => i.status === 'Active').length;

  return (
    <div>
      <PageHeader
        level="owner"
        title={`Good morning, ${OWNER_PROFILE.name.split(' ')[0]}.`}
        subtitle="Here's the safety overview across all your properties."
        actions={
          <>
            {unread > 0 && <Badge label={`${unread} unread alerts`} color={G.fire} />}
            <BtnDark onClick={() => navigate('org', 'ORG-001')} small>
              View Organisation <ArrowRight size={13} />
            </BtnDark>
          </>
        }
      />

      {/* Overall safety score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 32 }}>
        <KpiChip label="Organisations" value={ORGS.length}
          sub="Under ownership" icon={<Building2 size={16} />} />
        <KpiChip label="Total Buildings" value={kpis.totalBuildings}
          sub="Across all orgs" icon={<Building2 size={16} />} />
        <KpiChip label="Active Incidents" value={activeFire}
          sub="Require attention" valueColor={activeFire > 0 ? G.fire : G.green}
          icon={<Flame size={16} />} />
        <KpiChip label="System Status" value="Online"
          sub="All services operational" valueColor={G.green}
          icon={<ShieldCheck size={16} />} />
      </div>

      {/* Two-col: Orgs + Active incidents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Organisations */}
        <div>
          <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
            fontWeight: 400, fontSize: 22, color: G.graphite, marginBottom: 14 }}>
            Organisations
          </h2>
          {ORGS.map(org => (
            <Card key={org.id} style={{ padding: '20px 22px', cursor: 'pointer' }}
              onClick={() => navigate('org', org.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                    fontWeight: 400, fontSize: 20, color: G.graphite, marginBottom: 6 }}>
                    {org.name}
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {[
                      { l: 'Buildings',  v: org.buildings },
                      { l: 'Cameras',    v: org.cameras },
                      { l: 'Active',     v: org.activeIncidents },
                      { l: 'Resolved',   v: org.resolvedIncidents },
                    ].map(s => (
                      <div key={s.l}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18,
                          fontWeight: 700, color: G.graphite }}>{s.v}</div>
                        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11,
                          color: G.ash }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>
                      Safety score
                    </span>
                    <span style={{
                      fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                      fontSize: 28, fontWeight: 400,
                      color: org.overallSafetyScore >= 80 ? G.green : org.overallSafetyScore >= 60 ? G.amber : G.fire,
                    }}>{org.overallSafetyScore}%</span>
                  </div>
                  <BtnOutline onClick={() => navigate('org', org.id)} small>Manage</BtnOutline>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Active incidents */}
        <div>
          <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
            fontWeight: 400, fontSize: 22, color: G.graphite, marginBottom: 14 }}>
            Active Incidents
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INCIDENTS.filter(i => i.status === 'Active' || i.status === 'Investigating').map(inc => (
              <Card key={inc.id} style={{ padding: '16px 18px', cursor: 'pointer' }}
                onClick={() => navigate('incident', inc.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <SevBadge sev={inc.severity} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11, color: G.ash }}>{inc.id}</span>
                    </div>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14,
                      fontWeight: 600, color: G.graphite, marginBottom: 2 }}>
                      {inc.type} — {inc.location}
                    </div>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>
                      {inc.timestampDisplay}
                    </div>
                  </div>
                  <ChevronRight size={16} color={G.fog} />
                </div>
              </Card>
            ))}
            {INCIDENTS.filter(i => i.status === 'Active' || i.status === 'Investigating').length === 0 && (
              <Card style={{ padding: '24px', textAlign: 'center' }}>
                <CheckCircle size={28} color={G.green} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: G.ash }}>
                  No active incidents
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL 2 — ORGANISATION DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function OrgDashboard({ orgId, navigate, breadcrumb }) {
  const org = ORGS.find(o => o.id === orgId) || ORGS[0];
  const orgBuildings = OWNER_BUILDINGS;
  const orgIncidents = INCIDENTS;

  const totalOnline  = OWNER_CAMERAS.filter(c => c.status === 'ONLINE').length;
  const totalOffline = OWNER_CAMERAS.filter(c => c.status === 'OFFLINE').length;
  const activeCount  = orgIncidents.filter(i => i.status === 'Active').length;
  const resolved     = orgIncidents.filter(i => i.status === 'Resolved').length;

  return (
    <div>
      <PageHeader level="org" title={org.name}
        subtitle={`Organisation overview · Member since ${org.since}`}
        breadcrumb={breadcrumb}
        onBack={() => navigate('owner')}
        actions={<BtnOutline onClick={() => navigate('owner')} small icon={false}>← Back</BtnOutline>}
      />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        <KpiChip label="Total Buildings" value={orgBuildings.length}
          sub="Under this org" icon={<Building2 size={16} />} />
        <KpiChip label="Total Cameras" value={OWNER_CAMERAS.length}
          sub={`${totalOnline} online · ${totalOffline} offline`}
          icon={<Camera size={16} />} />
        <KpiChip label="Active Alerts" value={activeCount}
          valueColor={activeCount > 0 ? G.fire : G.green}
          sub="Unresolved incidents" icon={<Flame size={16} />} />
        <KpiChip label="Resolved" value={resolved}
          sub="This period" valueColor={G.green} icon={<CheckCircle2 size={16} />} />
      </div>

      {/* Buildings grid */}
      <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
        fontWeight: 400, fontSize: 22, color: G.graphite, marginBottom: 16 }}>
        Buildings
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {orgBuildings.map(b => {
          const bCams = OWNER_CAMERAS.filter(c => c.buildingId === b.id);
          const bInc  = INCIDENTS.filter(i => i.buildingId === b.id && i.status !== 'Resolved');
          return (
            <Card key={b.id} style={{ padding: '20px 22px', cursor: 'pointer' }}
              onClick={() => navigate('building', b.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyDot status={b.safetyStatus} />
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11,
                    fontWeight: 600, color: G.ash, textTransform: 'uppercase',
                    letterSpacing: '0.05em' }}>{b.type}</span>
                </div>
                {bInc.length > 0 && <Badge label={`${bInc.length} active`} color={G.fire} />}
              </div>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                fontWeight: 400, fontSize: 17, color: G.graphite, marginBottom: 4, lineHeight: 1.3 }}>
                {b.name}
              </div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash,
                marginBottom: 14, lineHeight: 1.5 }}>{b.address}</div>
              <div style={{ display: 'flex', gap: 18, borderTop: `1px solid ${G.mist}`,
                paddingTop: 14, flexWrap: 'wrap' }}>
                {[
                  { l: 'Floors',   v: b.floors },
                  { l: 'Cameras',  v: bCams.length },
                  { l: 'Online',   v: bCams.filter(c=>c.status==='ONLINE').length },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16,
                      fontWeight: 700, color: G.graphite }}>{s.v}</div>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: G.ash }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <BtnOutline onClick={() => navigate('building', b.id)} small style={{ width: '100%', justifyContent: 'center' }}>
                  View Building
                </BtnOutline>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent incidents */}
      <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
        fontWeight: 400, fontSize: 22, color: G.graphite, marginBottom: 16 }}>
        Recent Incidents
      </h2>
      <IncidentTable incidents={INCIDENTS.slice(0, 4)} navigate={navigate} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL 3 — BUILDING DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function BuildingDashboard({ buildingId, navigate, breadcrumb }) {
  const building = OWNER_BUILDINGS.find(b => b.id === buildingId) || OWNER_BUILDINGS[0];
  const cameras   = OWNER_CAMERAS.filter(c => c.buildingId === buildingId);
  const incidents = INCIDENTS.filter(i => i.buildingId === buildingId);
  const active    = incidents.filter(i => i.status !== 'Resolved');

  // Group cameras by floor
  const byFloor = cameras.reduce((acc, c) => {
    if (!acc[c.floor]) acc[c.floor] = [];
    acc[c.floor].push(c);
    return acc;
  }, {});

  const camStatusColor = s => s === 'ONLINE' ? G.green : s === 'OFFLINE' ? G.fire : G.amber;
  const aiColor = a => a === 'FIRE' ? G.fire : a === 'SMOKE' ? G.amber : a === 'NORMAL' ? G.green : G.fog;

  return (
    <div>
      <PageHeader level="building" title={building.name}
        subtitle={building.address}
        breadcrumb={breadcrumb}
        onBack={() => navigate('org', 'ORG-001')}
        actions={
          active.length > 0
            ? <Badge label={`${active.length} active incident${active.length > 1 ? 's' : ''}`} color={G.fire} />
            : <Badge label="All Clear" color={G.green} />
        }
      />

      {/* Building info + Safety */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 32 }}>
        <Card style={{ padding: '22px 24px' }}>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
            color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Building Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              { l: 'Type',           v: building.type },
              { l: 'Occupancy',      v: building.occupancyType },
              { l: 'Floors',         v: building.floors },
              { l: 'Units',          v: building.units },
              { l: 'Last Inspection',v: building.lastInspection },
              { l: 'Fire Exits',     v: building.fireExits },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: G.ash, marginBottom: 2 }}>{s.l}</div>
                <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, fontWeight: 600, color: G.graphite }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: '22px 24px' }}>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
            color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Safety Equipment
          </div>
          {[
            { l: 'Fire Alarm',          v: building.fireAlarm,       icon: '🔔' },
            { l: 'Sprinkler System',     v: building.sprinkler,       icon: '💧' },
            { l: 'Fire Hydrant',         v: building.fireHydrant,     icon: '🚒' },
            { l: 'Fire Extinguishers',   v: `${building.fireExtinguishers} units`, icon: '🧯', raw: true },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: `1px solid ${G.mist}` }}>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: G.charcoal }}>
                {s.icon} {s.l}
              </span>
              {s.raw
                ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: G.graphite }}>{s.v}</span>
                : <span style={{ color: s.v ? G.green : G.fire, display: 'flex', alignItems: 'center' }}>
                    {s.v ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  </span>
              }
            </div>
          ))}
        </Card>
      </div>

      {/* Current Alerts */}
      {active.length > 0 && (
        <>
          <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
            fontWeight: 400, fontSize: 22, color: G.fire, marginBottom: 14 }}>
            Current Alerts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {active.map(inc => (
              <Card key={inc.id} style={{ padding: '16px 18px', borderColor: `${G.fire}40`,
                background: G.fireDim, cursor: 'pointer' }}
                onClick={() => navigate('incident', inc.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Flame size={18} color={G.fire} />
                    <div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14,
                        fontWeight: 700, color: G.fire }}>
                        {inc.type} — {inc.location}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                        color: G.ash, marginTop: 2 }}>
                        {inc.id} · {inc.timestampDisplay}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <SevBadge sev={inc.severity} />
                    <BtnDark onClick={() => navigate('incident', inc.id)} small>Manage →</BtnDark>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Cameras by floor */}
      <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
        fontWeight: 400, fontSize: 22, color: G.graphite, marginBottom: 16 }}>
        Cameras by Floor
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {Object.entries(byFloor).map(([floor, cams]) => (
          <Card key={floor} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${G.mist}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600,
                color: G.graphite }}>Floor {floor}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G.ash }}>
                {cams.length} camera{cams.length > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cams.map(cam => (
                <div key={cam.id} style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '10px 12px',
                  background: cam.hasIncident ? G.fireDim : G.linen,
                  border: `1px solid ${cam.hasIncident ? `${G.fire}40` : G.mist}`,
                  borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => navigate('live', cam.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%',
                      background: camStatusColor(cam.status), flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13,
                        fontWeight: 600, color: G.graphite }}>{cam.label}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                        color: G.ash }}>{cam.code}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge label={cam.aiStatus}
                      color={aiColor(cam.aiStatus)} />
                    <Badge label={cam.status}
                      color={camStatusColor(cam.status)} />
                    <ChevronRight size={14} color={G.fog} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Incident history */}
      <h2 style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
        fontWeight: 400, fontSize: 22, color: G.graphite, marginBottom: 16 }}>
        Incident History
      </h2>
      <IncidentTable incidents={incidents} navigate={navigate} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL 4 — LIVE MONITORING
// ═══════════════════════════════════════════════════════════════════
function LiveMonitoring({ camId, navigate, breadcrumb }) {
  const cam = OWNER_CAMERAS.find(c => c.id === camId) || OWNER_CAMERAS[0];
  const inc = INCIDENTS.find(i => i.camId === cam.id && i.status !== 'Resolved');
  const { summary } = useIncidentData();
  const backendId = inc?.incidentIdBackend;

  const frames = summary?.frames ?? [];
  const evidFrames = getEvidenceFrames(summary, 4);
  const confirmed = frames.filter(f => f.fire_count > 0).length || (inc ? inc.framesConfirmed : 0);
  const total = Math.max(5, confirmed, inc?.framesTotal || 5);

  return (
    <div>
      <PageHeader level="live" title="Live Monitoring"
        subtitle={`${cam.label} · ${cam.code} · Floor ${cam.floor}`}
        breadcrumb={breadcrumb}
        onBack={() => navigate('building', cam.buildingId)}
        actions={
          inc
            ? <BtnDark onClick={() => navigate('incident', inc.id)} small>
                View Incident <ArrowRight size={13} />
              </BtnDark>
            : null
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Left — CCTV + detection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Camera feed */}
          <Card>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${G.mist}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {inc && <span style={{ width: 8, height: 8, borderRadius: '50%',
                  background: G.fire, animation: 'pulse 1.5s infinite', flexShrink: 0 }} />}
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13,
                  fontWeight: 600, color: G.graphite }}>{cam.label}</span>
                <Badge label={cam.status} color={cam.status === 'ONLINE' ? G.green : G.fire} />
              </div>
              <Badge label={cam.aiStatus}
                color={cam.aiStatus === 'FIRE' ? G.fire : cam.aiStatus === 'SMOKE' ? G.amber : G.green} />
            </div>
            {/* Frame grid 2×2 */}
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                {[0,1,2,3].map(i => {
                  const fi = frames[i]?.frame_index ?? i;
                  return (
                    <div key={i} style={{ position: 'relative', aspectRatio: '16/9',
                      background: '#0d0906', borderRadius: 6, overflow: 'hidden',
                      border: `1px solid ${G.mist}` }}>
                      {backendId && <img src={frameImageUrl(backendId, fi)} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      {!backendId && <div style={{ position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, #1a0a04 0%, #2d1208 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={20} color="rgba(255,255,255,0.2)" />
                      </div>}
                      {/* HUD */}
                      <div style={{ position: 'absolute', top: 6, left: 6 }}>
                        <span style={{ background: inc ? 'rgba(225,29,72,0.85)' : 'rgba(0,0,0,0.6)',
                          color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                          padding: '2px 6px', borderRadius: 3, fontWeight: 700,
                          animation: inc ? 'blink 1.5s infinite' : 'none' }}>
                          {inc ? '● REC' : cam.id}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', bottom: 5, right: 6 }}>
                        <span style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.6)',
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 8,
                          padding: '1px 5px', borderRadius: 3 }}>
                          Frame {fi}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Temporal verification */}
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Temporal Verification Engine
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: total }).map((_, i) => (
                  <div key={i} style={{
                    width: 32, height: 10, borderRadius: 3,
                    background: i < confirmed
                      ? (inc?.type === 'Fire' ? G.fire : G.amber)
                      : G.mist,
                    boxShadow: i < confirmed ? `0 0 5px ${G.fire}60` : 'none',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                fontWeight: 700, color: inc ? G.fire : G.green }}>
                {confirmed}/{total} confirmed
              </span>
            </div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>
              {confirmed >= 5
                ? '⚠ Hazard confirmed — 5+ consecutive frames verified'
                : 'Monitoring — awaiting 5 consecutive frame confirmations'}
            </div>
          </Card>
        </div>

        {/* Right — detection data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Detection status */}
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              YOLO Detection
            </div>
            {[
              { l: 'Hazard Type',   v: cam.aiStatus, badge: true },
              { l: 'Confidence',    v: inc ? `${inc.confidence}%` : '—' },
              { l: 'Fire Detected', v: cam.aiStatus === 'FIRE' ? 'Yes' : 'No' },
              { l: 'Smoke Detected',v: cam.aiStatus === 'SMOKE' ? 'Yes' : 'No' },
              { l: 'Humans',        v: inc?.humanCount ?? 0 },
              { l: 'Objects',       v: inc?.objectCount ?? 0 },
              { l: 'Sample Rate',   v: '3.0 FPS' },
              { l: 'Model',         v: 'YOLOv8x' },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '8px 0',
                borderBottom: `1px solid ${G.mist}` }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: G.ash }}>
                  {r.l}
                </span>
                {r.badge
                  ? <Badge label={r.v}
                      color={r.v === 'FIRE' ? G.fire : r.v === 'SMOKE' ? G.amber : r.v === 'NORMAL' ? G.green : G.fog} />
                  : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                      fontWeight: 700, color: G.graphite }}>{String(r.v)}</span>
                }
              </div>
            ))}
          </Card>

          {/* If hazard confirmed, show incident link */}
          {inc && (
            <Card style={{ padding: '16px 18px', background: G.fireDim, borderColor: `${G.fire}40` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Flame size={16} color={G.fire} />
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13,
                  fontWeight: 700, color: G.fire }}>Hazard Confirmed</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                color: G.ash, marginBottom: 12 }}>{inc.id}</div>
              <BtnDark onClick={() => navigate('incident', inc.id)} style={{ width: '100%', justifyContent: 'center' }}>
                View Incident Details <ArrowRight size={13} />
              </BtnDark>
            </Card>
          )}

          {/* Camera info */}
          <Card style={{ padding: '16px 18px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Camera Info
            </div>
            {[
              { l: 'ID',       v: cam.code },
              { l: 'Location', v: cam.room },
              { l: 'Floor',    v: cam.floor },
              { l: 'Building', v: cam.building?.split('—')[1]?.trim() },
              { l: 'Last Seen',v: cam.lastSeen },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: `1px solid ${G.mist}` }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>{r.l}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                  color: G.graphite, textAlign: 'right', maxWidth: 160 }}>{r.v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL 5 — INCIDENT CREATED / DETAIL
// ═══════════════════════════════════════════════════════════════════
function IncidentDetail({ incidentId, navigate, breadcrumb }) {
  const inc = INCIDENTS.find(i => i.id === incidentId) || INCIDENTS[0];
  const { summary, hologram } = useIncidentData();
  const evidFrames = getEvidenceFrames(summary, 6);
  const backendId  = inc.incidentIdBackend;

  const typeColor = inc.type === 'Fire' ? G.fire : inc.type === 'Smoke' ? G.amber :
                    inc.type === 'Water Leak' ? G.cerulean : G.graphite;

  return (
    <div>
      <PageHeader level="incident"
        title={`${inc.type} Incident`}
        subtitle={`${inc.id} · ${inc.timestampDisplay}`}
        breadcrumb={breadcrumb}
        onBack={() => navigate('building', inc.buildingId)}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <SevBadge sev={inc.severity} />
            {inc.status !== 'Resolved' && (
              <BtnDark onClick={() => navigate('manage', inc.id)} small>
                Manage Incident <ArrowRight size={13} />
              </BtnDark>
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Incident summary card */}
          <Card>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${G.mist}`,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8,
                background: `${typeColor}15`, border: `1px solid ${typeColor}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={18} color={typeColor} />
              </div>
              <div>
                <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                  fontWeight: 400, fontSize: 20, color: typeColor }}>
                  {inc.type} confirmed — {inc.location}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G.ash, marginTop: 2 }}>
                  {inc.id} · {inc.camCode}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { l: 'Incident ID',     v: inc.id },
                { l: 'Type',            v: inc.type },
                { l: 'Severity',        v: inc.severity },
                { l: 'Confidence',      v: `${inc.confidence}%` },
                { l: 'Location',        v: inc.location },
                { l: 'Floor',           v: inc.floor },
                { l: 'Camera',          v: inc.camCode },
                { l: 'Status',          v: inc.status },
              ].map(r => (
                <div key={r.l}>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: G.ash, marginBottom: 3 }}>{r.l}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: G.graphite }}>
                    {r.v}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Evidence frames */}
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Evidence Images — {(evidFrames.length || inc.evidenceCount)} frames
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(evidFrames.length > 0
                ? evidFrames
                : Array.from({ length: inc.evidenceCount }, (_, i) => ({ frame_index: i }))
              ).map((f, i) => (
                <FrameThumb key={i}
                  incidentId={backendId}
                  frameIndex={f.frame_index ?? i}
                  style={{ aspectRatio: '16/9' }}
                />
              ))}
            </div>
          </Card>

          {/* Temporal verification */}
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Temporal Verification
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: inc.framesTotal }).map((_, i) => (
                  <div key={i} style={{
                    width: 36, height: 10, borderRadius: 3,
                    background: i < inc.framesConfirmed ? G.fire : G.mist,
                    boxShadow: i < inc.framesConfirmed ? `0 0 5px ${G.fire}60` : 'none',
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                fontWeight: 700, color: G.fire }}>
                {inc.framesConfirmed}/{inc.framesTotal} confirmed
              </span>
            </div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>
              YOLOv8x · 3.0 FPS extraction · 5+ consecutive frames required
            </div>
          </Card>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* People */}
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              People at Risk
            </div>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
              fontWeight: 400, fontSize: 48, color: inc.humanCount > 0 ? G.fire : G.green,
              lineHeight: 1, marginBottom: 4 }}>
              {inc.humanCount}
            </div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: G.ash }}>
              {inc.humanCount === 0
                ? 'No persons detected in frame'
                : `${inc.humanCount} person${inc.humanCount > 1 ? 's' : ''} detected`}
            </div>
            {(() => {
              const ps = PEOPLE_SAFETY.find(p => p.incidentId === inc.id);
              if (!ps) return null;
              return (
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Possibly Trapped', v: ps.possiblyTrapped, c: G.fire },
                    { l: 'Evacuated',        v: ps.evacuated,       c: G.green },
                    { l: 'Rescued',          v: ps.rescued,         c: G.cerulean },
                    { l: 'Unknown',          v: ps.unknown,         c: G.amber },
                  ].map(s => (
                    <div key={s.l} style={{ background: G.linen, borderRadius: 8, padding: '10px 12px',
                      border: `1px solid ${G.mist}` }}>
                      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                        fontSize: 22, fontWeight: 400, color: s.c }}>{s.v}</div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: G.ash }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>

          {/* Timestamp */}
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Timestamp
            </div>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
              fontWeight: 400, fontSize: 18, color: G.graphite, lineHeight: 1.4 }}>
              {inc.timestampDisplay}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
              color: G.ash, marginTop: 6 }}>{inc.timestamp}</div>
          </Card>

          {/* Actions */}
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {inc.status !== 'Resolved' && (
                <BtnDark onClick={() => navigate('manage', inc.id)} style={{ width: '100%', justifyContent: 'center' }}>
                  Manage this Incident <ArrowRight size={13} />
                </BtnDark>
              )}
              <BtnOutline onClick={() => navigate('history', inc.buildingId)}
                style={{ width: '100%', justifyContent: 'center' }}>
                View Incident History
              </BtnOutline>
              <BtnOutline onClick={() => navigate('live', inc.camId)}
                style={{ width: '100%', justifyContent: 'center' }}>
                Open Live Feed
              </BtnOutline>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL 6 — INCIDENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
function IncidentManagement({ incidentId, navigate, breadcrumb }) {
  const inc = INCIDENTS.find(i => i.id === incidentId) || INCIDENTS[0];
  const [status,   setStatus]   = useState(inc.status);
  const [notes,    setNotes]    = useState(inc.notes || '');
  const [saved,    setSaved]    = useState(false);
  const [resolved, setResolved] = useState(inc.status === 'Resolved');

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  function handleResolve() {
    setResolved(true);
    setStatus('Resolved');
  }

  const ACTIONS = [
    { id: 'acknowledge', label: 'Acknowledge',  icon: <Eye size={15} />,           desc: 'Confirm you have seen this incident.' },
    { id: 'investigate', label: 'Investigate',  icon: <Search size={15} />,         desc: 'Mark as under investigation by your team.' },
    { id: 'escalate',    label: 'Escalate',     icon: <AlertTriangle size={15} />, desc: 'Route to ERSS / 112 emergency dispatch.' },
  ];

  return (
    <div>
      <PageHeader level="manage"
        title="Incident Management"
        subtitle={`${inc.id} · ${inc.type} — ${inc.location}`}
        breadcrumb={breadcrumb}
        onBack={() => navigate('incident', inc.id)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left — actions + notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status */}
          <Card style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
                color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Current Status
              </div>
              <SevBadge sev={inc.severity} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Active','Investigating','Contained','Resolved'].map(s => (
                <button key={s} onClick={() => { setStatus(s); if (s === 'Resolved') setResolved(true); }}
                  style={{
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500,
                    border: `1px solid ${status === s ? G.signal : G.mist}`,
                    background: status === s ? `${G.signal}15` : G.paper,
                    color: status === s ? G.signal : G.charcoal,
                    transition: 'all 0.15s',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </Card>

          {/* Quick actions */}
          <Card style={{ padding: '20px 22px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ACTIONS.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '14px 16px',
                  background: G.linen, border: `1px solid ${G.mist}`, borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: G.ash }}>{a.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14,
                        fontWeight: 600, color: G.graphite }}>{a.label}</div>
                      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12,
                        color: G.ash }}>{a.desc}</div>
                    </div>
                  </div>
                  <BtnOutline onClick={() => setStatus(
                    a.id === 'acknowledge' ? 'Active' :
                    a.id === 'investigate' ? 'Investigating' : status
                  )} small>
                    {a.label}
                  </BtnOutline>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          <Card style={{ padding: '20px 22px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Operator Notes
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this incident…"
              style={{
                width: '100%', minHeight: 120, resize: 'vertical',
                background: G.linen, border: `1px solid ${G.mist}`, borderRadius: 8,
                padding: '10px 14px', fontFamily: "'Manrope',sans-serif",
                fontSize: 14, color: G.charcoal, outline: 'none',
                lineHeight: 1.6, transition: 'border-color 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = G.signal}
              onBlur={e => e.currentTarget.style.borderColor = G.mist}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
              {saved && <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12,
                color: G.green, alignSelf: 'center' }}>✓ Saved</span>}
              <BtnOutline onClick={handleSave} small>Save Notes</BtnOutline>
            </div>
          </Card>

          {/* Resolve */}
          {!resolved ? (
            <Card style={{ padding: '20px 22px', background: G.fireDim, borderColor: `${G.fire}40` }}>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                fontWeight: 400, fontSize: 22, color: G.fire, marginBottom: 8 }}>
                Mark as Resolved
              </div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: G.charcoal,
                marginBottom: 16, lineHeight: 1.6 }}>
                Confirm that the hazard has been addressed and the incident is fully resolved.
                This will close the incident and log the resolution timestamp.
              </div>
              <BtnDark onClick={handleResolve} style={{ background: G.green, borderColor: G.green }}>
                <CheckCircle2 size={15} /> Confirm Resolved
              </BtnDark>
            </Card>
          ) : (
            <Card style={{ padding: '20px 22px', background: G.greenDim, borderColor: `${G.green}40` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={22} color={G.green} />
                <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
                  fontWeight: 400, fontSize: 20, color: G.green }}>
                  Incident Resolved
                </div>
              </div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: G.ash, marginTop: 8 }}>
                Logged at {new Date().toLocaleTimeString('en-IN')} IST
              </div>
            </Card>
          )}
        </div>

        {/* Right — incident summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Incident Summary
            </div>
            {[
              { l: 'ID',          v: inc.id },
              { l: 'Type',        v: inc.type },
              { l: 'Location',    v: inc.location },
              { l: 'Confidence',  v: `${inc.confidence}%` },
              { l: 'Severity',    v: inc.severity },
              { l: 'Humans',      v: inc.humanCount },
              { l: 'Detected at', v: inc.timestampDisplay },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: `1px solid ${G.mist}` }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>{r.l}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                  fontWeight: 700, color: G.graphite, textAlign: 'right' }}>{String(r.v)}</span>
              </div>
            ))}
          </Card>

          {/* Evidence thumbnail */}
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600,
              color: G.ash, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Evidence
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Array.from({ length: Math.min(4, inc.evidenceCount) }, (_, i) => (
                <FrameThumb key={i} incidentId={inc.incidentIdBackend}
                  frameIndex={i} style={{ aspectRatio: '16/9' }} />
              ))}
            </div>
            <BtnOutline onClick={() => navigate('incident', inc.id)}
              small style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
              View All Evidence
            </BtnOutline>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL 7 — INCIDENT HISTORY
// ═══════════════════════════════════════════════════════════════════
function IncidentHistory({ buildingId, navigate, breadcrumb }) {
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');
  const building = buildingId ? OWNER_BUILDINGS.find(b => b.id === buildingId) : null;
  const all = buildingId ? INCIDENTS.filter(i => i.buildingId === buildingId) : INCIDENTS;
  const filtered = all.filter(inc => {
    const matchSearch = !search || inc.id.toLowerCase().includes(search.toLowerCase())
      || inc.location.toLowerCase().includes(search.toLowerCase())
      || inc.type.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || inc.status === filter || inc.severity === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <PageHeader level="history"
        title="Incident History"
        subtitle={building ? `${building.name} — all past incidents` : 'All buildings — complete incident log'}
        breadcrumb={breadcrumb}
        onBack={() => building ? navigate('building', buildingId) : navigate('org', 'ORG-001')}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: G.fog, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search incidents…"
            style={{
              width: '100%', background: G.paper, border: `1px solid ${G.mist}`,
              borderRadius: 8, padding: '8px 12px 8px 36px',
              fontFamily: "'Manrope',sans-serif", fontSize: 13, color: G.charcoal,
              outline: 'none',
            }}
            onFocus={e => e.currentTarget.style.borderColor = G.signal}
            onBlur={e => e.currentTarget.style.borderColor = G.mist}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['All','Active','Resolved','Fire','Smoke','CRITICAL','MODERATE'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 500,
              border: `1px solid ${filter === f ? G.signal : G.mist}`,
              background: filter === f ? `${G.signal}15` : G.paper,
              color: filter === f ? G.signal : G.charcoal,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { l: 'Total',      v: all.length,                                              c: G.graphite },
          { l: 'Active',     v: all.filter(i=>i.status==='Active').length,               c: G.fire     },
          { l: 'Resolved',   v: all.filter(i=>i.status==='Resolved').length,             c: G.green    },
          { l: 'Avg Confidence', v: `${(all.reduce((a,i)=>a+i.confidence,0)/Math.max(all.length,1)).toFixed(0)}%`, c: G.amber },
        ].map(s => (
          <KpiChip key={s.l} label={s.l} value={s.v} valueColor={s.c} />
        ))}
      </div>

      {/* Incident table */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${G.mist}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600,
            color: G.graphite }}>{filtered.length} incident{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <IncidentTable incidents={filtered} navigate={navigate} showBuilding={!buildingId} />
      </Card>
    </div>
  );
}

// ── Shared incident table used at multiple levels ─────────────────────────
function IncidentTable({ incidents, navigate, showBuilding = false }) {
  if (!incidents.length) return (
    <div style={{ padding: 32, textAlign: 'center', fontFamily: "'Manrope',sans-serif",
      fontSize: 14, color: G.ash }}>
      No incidents to display.
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {incidents.map((inc, i) => {
        const typeColor = inc.type === 'Fire' ? G.fire : inc.type === 'Smoke' ? G.amber :
                          inc.type === 'Water Leak' ? G.cerulean : G.graphite;
        return (
          <div key={inc.id} onClick={() => navigate('incident', inc.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              borderBottom: i < incidents.length - 1 ? `1px solid ${G.mist}` : 'none',
              cursor: 'pointer', transition: 'background 0.12s',
              background: 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = G.linen}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: `${typeColor}12`, border: `1px solid ${typeColor}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={16} color={typeColor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14,
                  fontWeight: 600, color: G.graphite }}>
                  {inc.type} — {inc.location}
                </span>
                <SevBadge sev={inc.severity} />
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: G.ash }}>
                  {inc.id}
                </span>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>
                  {inc.timestampDisplay}
                </span>
                {showBuilding && (
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: G.ash }}>
                    {OWNER_BUILDINGS.find(b => b.id === inc.buildingId)?.name?.split('—')[1]?.trim()}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Badge
                label={inc.status}
                color={inc.status === 'Active' ? G.fire : inc.status === 'Resolved' ? G.green : G.amber}
              />
              <ChevronRight size={15} color={G.fog} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NAVIGATION ENGINE
// ═══════════════════════════════════════════════════════════════════
const LEVEL_ORDER = ['owner','org','building','live','incident','manage','history'];

function buildBreadcrumbs(stack, navigate) {
  return stack.map((entry, i) => ({
    label: entry.label,
    level: entry.level,
    id: entry.id,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ═══════════════════════════════════════════════════════════════════
export default function OwnerConsole() {
  // Navigation stack: [{level, id, label}]
  const [stack, setStack] = useState([{ level: 'owner', id: null, label: 'Owner Dashboard' }]);
  const current = stack[stack.length - 1];

  function navigate(level, id) {
    // Generate a human-readable label
    let label = level;
    if (level === 'owner')    label = 'Owner Dashboard';
    if (level === 'org')      label = ORGS.find(o => o.id === id)?.name || 'Organisation';
    if (level === 'building') label = OWNER_BUILDINGS.find(b => b.id === id)?.name?.split('—')[0]?.trim() || 'Building';
    if (level === 'live')     label = OWNER_CAMERAS.find(c => c.id === id)?.label || 'Live Feed';
    if (level === 'incident') label = id || 'Incident';
    if (level === 'manage')   label = 'Manage';
    if (level === 'history')  label = 'History';

    // If navigating to an ancestor level, pop stack back
    const existingIdx = stack.findIndex(s => s.level === level && (s.id === id || !id));
    if (existingIdx >= 0) {
      setStack(stack.slice(0, existingIdx + 1));
    } else {
      setStack([...stack, { level, id, label }]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBreadcrumbNav(level, id) {
    const idx = stack.findLastIndex(s => s.level === level);
    if (idx >= 0) setStack(stack.slice(0, idx + 1));
    else navigate(level, id);
  }

  const breadcrumb = stack.length > 1 ? (
    <Breadcrumb
      crumbs={stack.map(s => ({ label: s.label, level: s.level, id: s.id }))}
      onNavigate={handleBreadcrumbNav}
    />
  ) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: G.parchment,
      fontFamily: "'Manrope',sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        background: G.paper, borderBottom: `1px solid ${G.mist}`,
        padding: '0 32px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('owner')} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ShieldCheck size={18} color={G.graphite} strokeWidth={1.5} />
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontStyle: 'italic',
              fontSize: 17, fontWeight: 400, color: G.graphite }}>
              <em style={{ color: '#d97706' }}>Atma</em>rakshak
            </span>
          </button>
          <div style={{ width: 1, height: 18, background: G.mist }} />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 500,
            color: G.ash }}>Owner Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {OWNER_ALERTS.filter(a => !a.read).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%',
                background: G.fire, animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                color: G.fire, fontWeight: 700 }}>
                {OWNER_ALERTS.filter(a => !a.read).length} alerts
              </span>
            </div>
          )}
          <div style={{ width: 1, height: 18, background: G.mist }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%',
              background: G.linen, border: `1px solid ${G.mist}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 700,
              color: G.graphite }}>
              {OWNER_PROFILE.initials}
            </div>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13,
              fontWeight: 500, color: G.graphite }}>{OWNER_PROFILE.name}</span>
          </div>
          <a href="/" style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12,
            color: G.ash, textDecoration: 'none' }}>← Logout</a>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
        {current.level === 'owner' && (
          <OwnerDashboard navigate={navigate} />
        )}
        {current.level === 'org' && (
          <OrgDashboard orgId={current.id} navigate={navigate} breadcrumb={breadcrumb} />
        )}
        {current.level === 'building' && (
          <BuildingDashboard buildingId={current.id} navigate={navigate} breadcrumb={breadcrumb} />
        )}
        {current.level === 'live' && (
          <LiveMonitoring camId={current.id} navigate={navigate} breadcrumb={breadcrumb} />
        )}
        {current.level === 'incident' && (
          <IncidentDetail incidentId={current.id} navigate={navigate} breadcrumb={breadcrumb} />
        )}
        {current.level === 'manage' && (
          <IncidentManagement incidentId={current.id} navigate={navigate} breadcrumb={breadcrumb} />
        )}
        {current.level === 'history' && (
          <IncidentHistory buildingId={current.id} navigate={navigate} breadcrumb={breadcrumb} />
        )}
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: G.paper, borderTop: `1px solid ${G.mist}`,
        padding: '8px 32px', display: 'flex', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.fog }}>
          Atmarakshak v2.4 · YOLOv8x · ERSS/112 · API: localhost:3001
        </span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: G.fog }}>
          {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(1.3); }
        }
        @keyframes blink {
          0%,100% { opacity:1; }
          50%      { opacity:0.3; }
        }
      `}</style>
    </div>
  );
}
