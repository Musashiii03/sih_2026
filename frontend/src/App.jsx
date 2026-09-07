import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import OwnerConsole from './components/OwnerConsole';
import DispatchConsole from './components/DispatchConsole';
import LoginPage from './components/LoginPage';
import ThemeToggle from './components/ThemeToggle';

// ══════════════════════════════════════════════════
// OWNER SIDEBAR — visible on /owner routes
// ══════════════════════════════════════════════════
function OwnerSidebar() {
  return (
    <nav className="atma-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/atmarakshak_logo.png"
            alt="Atmarakshak Logo"
            style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }}
          />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name"><em>Atma</em>rakshak</div>
          <div className="sidebar-brand-sub">Owner Portal</div>
        </div>
      </div>

      <ul className="sidebar-nav">
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="sidebar-nav-label">Overview</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="sidebar-nav-label">Incidents</span>
            <span className="sidebar-alert-dot" />
          </NavLink>
        </li>
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            <span className="sidebar-nav-label">Cameras</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
            <span className="sidebar-nav-label">Buildings</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            <span className="sidebar-nav-label">People Safety</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            <span className="sidebar-nav-label">Analytics</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>report</span>
            <span className="sidebar-nav-label">Complaints</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
            <span className="sidebar-nav-label">Alerts</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/owner" end className={({ isActive }) => `sidebar-nav-btn${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
            <span className="sidebar-nav-label">Reports</span>
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
          <Route path="/:incidentId"   element={<DispatchConsole />} />
        </Routes>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/owner/*"    element={<OwnerLayout />} />
        <Route path="/dispatch/*" element={<DispatchLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
