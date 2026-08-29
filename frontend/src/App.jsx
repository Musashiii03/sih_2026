import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import OwnerConsole from './components/OwnerConsole';
import DispatchConsole from './components/DispatchConsole';
import IncidentDashboard from './components/IncidentDashboard';

// ══════════════════════════════════════════════════
// OWNER SIDEBAR — only visible on /owner routes
// ══════════════════════════════════════════════════
function OwnerSidebar() {
  return (
    <nav className="atma-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name"><em>Atma</em>rakshak</div>
          <div className="sidebar-brand-sub">Owner Portal</div>
        </div>
      </div>

      <ul className="sidebar-nav">
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            <span className="sidebar-nav-label">Owner Console</span>
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="sidebar-divider"/>
        <div className="sidebar-status">
          <span className="material-symbols-outlined" style={{ color: 'var(--safe)', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="sidebar-status-text">System Operational</span>
        </div>
        {/* Switch portal link */}
        <a href="/dispatch" className="sidebar-switch-link">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>local_fire_department</span>
          Fire Dispatch Portal →
        </a>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════
// DISPATCH SIDEBAR — only visible on /dispatch routes
// ══════════════════════════════════════════════════
function DispatchSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="atma-sidebar dispatch-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon dispatch-icon">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: 'var(--critical)' }}>local_fire_department</span>
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name dispatch-name">ERSS Dispatch</div>
          <div className="sidebar-brand-sub">Mumbai Central · Zone A</div>
        </div>
      </div>

      <ul className="sidebar-nav">
        <li>
          <NavLink to="/dispatch" end className={({ isActive }) => `sidebar-nav-btn dispatch-btn${isActive ? ' active-dispatch' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="sidebar-nav-label">Incident Queue</span>
            <span className="sidebar-badge">2</span>
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="sidebar-divider"/>
        <div className="sidebar-status">
          <span className="material-symbols-outlined" style={{ color: 'var(--critical)', fontVariationSettings: "'FILL' 1" }}>warning</span>
          <span className="sidebar-status-text" style={{ color: 'var(--critical)' }}>2 Active Alerts</span>
        </div>
        <a href="/owner" className="sidebar-switch-link">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>admin_panel_settings</span>
          Owner Portal →
        </a>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════
// OWNER LAYOUT SHELL
// ══════════════════════════════════════════════════
function OwnerLayout() {
  return (
    <div className="atma-layout">
      <div className="atma-main-full">
        <Routes>
          <Route path="/" element={<OwnerConsole />} />
        </Routes>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// DISPATCH LAYOUT SHELL
// ══════════════════════════════════════════════════
function DispatchLayout() {
  return (
    <div className="atma-layout">
      <div className="atma-main-full">
        <Routes>
          <Route path="/"              element={<DispatchConsole />} />
          <Route path="/:incidentId"   element={<IncidentDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ROOT — landing page router
// ══════════════════════════════════════════════════
function Landing() {
  return (
    <div className="landing-root">
      <div className="landing-logo">
        <span className="material-symbols-outlined" style={{ fontSize: 52, color: 'var(--accent)', fontVariationSettings: "'FILL' 1" }}>shield</span>
      </div>
      <h1 className="landing-title"><em>Atma</em>rakshak</h1>
      <p className="landing-sub">आत्मरक्षक · Emergency Detection &amp; Dispatch System</p>
      <div className="landing-cards">
        <a href="/owner" className="landing-card">
          <span className="material-symbols-outlined lc-icon" style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          <div className="lc-title">Owner Portal</div>
          <div className="lc-desc">Monitor your property, receive fire alerts, and manage incident responses for your building.</div>
          <div className="lc-arrow">Access Portal →</div>
        </a>
        <a href="/dispatch" className="landing-card dispatch-card">
          <span className="material-symbols-outlined lc-icon" style={{ color: 'var(--critical)', fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          <div className="lc-title">Fire Dispatch</div>
          <div className="lc-desc">ERSS / 112 operator console — manage active incidents, dispatch units, and coordinate response.</div>
          <div className="lc-badge">2 Active</div>
          <div className="lc-arrow" style={{ color: 'var(--critical)' }}>Enter Dispatch →</div>
        </a>
      </div>
      <p className="landing-version">Atmarakshak v2.4 · YOLOv8x Detection · ERSS/112 Integration</p>
    </div>
  );
}

// ══════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Landing />} />
        <Route path="/owner/*"    element={<OwnerLayout />} />
        <Route path="/dispatch/*" element={<DispatchLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
