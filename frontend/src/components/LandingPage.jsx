/**
 * LandingPage — ATMARAKSHAK (आत्मरक्षक)
 * Vite.dev UI Design System + Atmarakshak Emergency Response Content
 * Features authentic Vite typography, signature border ticks, interactive CLI tabs,
 * 3D Holographic digital twin room canvas, telemetry simulator, and direct portal access.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Atmarakshak3DHero from './Atmarakshak3DHero';
import './ViteHome.css';

export default function LandingPage() {
  const navigate = useNavigate();

  // Theme state: dark (default) or light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vite-theme') || 'dark';
  });

  // Top banner dismiss state
  const [bannerVisible, setBannerVisible] = useState(true);

  // Active CLI Tab in Hero
  const [activeTab, setActiveTab] = useState('mqtt');
  const [copied, setCopied] = useState(false);

  // Navigation Dropdown states
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);

  // Search Modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Facility switcher
  const [activeFacility, setActiveFacility] = useState('techpark');

  // Live Incident Telemetry Simulator Logs
  const [simLogs, setSimLogs] = useState([
    { type: 'ready', text: '  ATMARAKSHAK v2.4.0 [ZONE: MUMBAI-CENTRAL-4B] STATUS: OPERATIONAL', time: '11:24:02' },
    { type: 'info', text: '  ➜  Sensors:    128 Active · 0 Offline · Mesh Latency 12ms', time: '11:24:02' },
    { type: 'info', text: '  ➜  Vision AI:   Floor 4 Server Room [NO FLAME / NO SMOKE]', time: '11:24:02' },
    { type: 'tip', text: '  ➜  ERSS 112:   Gateway Connected · GPS Lat: 19.0760, Lng: 72.8777', time: '11:24:03' },
  ]);

  useEffect(() => {
    localStorage.setItem('vite-theme', theme);
  }, [theme]);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setCapabilitiesOpen(false);
        setPortalsOpen(false);
        setVersionsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cliCommands = {
    mqtt: 'atmarakshak stream --building "Tech-Tower-4B" --mesh-active',
    sensors: 'atmarakshak sensors --zone "Floor-4-Server-Room" --status',
    erss: 'curl -X POST https://api.atmarakshak.gov.in/v1/dispatch/alert -d \'{"zone":"4B","prio":"CRITICAL"}\'',
    vision: 'atmarakshak vision --camera "CAM-04-FL4" --fps 30 --detect fire,smoke',
    report: 'atmarakshak report --incident "INC-2026-8821" --format pdf',
  };

  const handleCopy = () => {
    const cmd = cliCommands[activeTab];
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const facilities = [
    {
      id: 'techpark',
      name: 'High-Rise Tech Parks',
      desc: 'Multi-floor wireless IoT mesh with sub-3s server room thermal monitoring and pressurized stairwell clearance.',
      cmd: 'atmarakshak deploy --preset tech-park --floors 32 --occupancy 6500',
    },
    {
      id: 'hospitals',
      name: 'Hospital Campuses',
      desc: 'Prioritized ICU oxygen-safe sensors, non-ambulatory patient evacuation routing, and automated HVAC fire dampers.',
      cmd: 'atmarakshak deploy --preset healthcare-icu --auto-dampers true',
    },
    {
      id: 'malls',
      name: 'Commercial Malls',
      desc: 'Wide-angle CCTV crowd bottleneck detection, atrium smoke layer tracking, and synchronized public address broadcast.',
      cmd: 'atmarakshak deploy --preset retail-mall --atrium-cctv 24',
    },
    {
      id: 'warehouses',
      name: 'Logistics Warehouses',
      desc: 'Linear heat detection cables along high racks, chemical fume gas analysis, and early sprinkler pre-action control.',
      cmd: 'atmarakshak deploy --preset industrial-racks --gas-sensors co,lpg,voc',
    },
    {
      id: 'metro',
      name: 'Metro & Transit Hubs',
      desc: 'Underground platform tunnel airflow tracking, passenger density heatmaps, and zero-latency ERSS 112 auto-dispatch.',
      cmd: 'atmarakshak deploy --preset underground-transit --tunnel-mesh true',
    },
  ];

  const searchItems = [
    { title: 'Overview: Atmarakshak AI Safety System', path: '#capabilities', tag: 'Core' },
    { title: 'Owner Console: Building Management Portal', path: '/owner', tag: 'Portal', isRoute: true },
    { title: 'ERSS Fire Dispatch Portal: Live Incident Queue', path: '/dispatch', tag: 'Portal', isRoute: true },
    { title: 'Sign In / Secure Authentication', path: '/login', tag: 'Auth', isRoute: true },
    { title: 'Building Digital Twin & 3D Sensor Layout', path: '/owner', tag: 'Digital Twin', isRoute: true },
    { title: 'Computer Vision CCTV Anomaly Detection', path: '#capabilities', tag: 'Vision AI' },
    { title: 'ERSS 112 Auto-Dispatch Integration', path: '#capabilities', tag: 'Dispatch' },
    { title: 'Telemetry MQTT Stream Documentation', path: '#simulator', tag: 'Docs' },
    { title: 'Smart India Hackathon 2026 Submission', path: '#stats', tag: 'About' },
  ];

  const filteredSearch = searchItems.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const triggerHeatSpike = () => {
    const time = new Date().toLocaleTimeString();
    setSimLogs((prev) => [
      ...prev,
      { type: 'build', text: `[ALERT ${time}] THERMAL ANOMALY: Room 4B temp jumped to 84.6°C (+48°C/min)`, time },
      { type: 'hmr', text: `[VISION ${time}] Optical sensor confirms smoke density: 680 ppm [CONFIDENCE 99.4%]`, time },
    ]);
  };

  const triggerAutoDispatch = () => {
    const time = new Date().toLocaleTimeString();
    setSimLogs((prev) => [
      ...prev,
      { type: 'ready', text: `[DISPATCH ${time}] ERSS 112 Auto-Dispatched! Incident #INC-2026-8821 pushed to Console`, time },
      { type: 'tip', text: `[ETAs ${time}] Mumbai Fire Station 4 dispatched 2 Water Tenders (ETA: 4.8 mins)`, time },
    ]);
  };

  const resetSim = () => {
    setSimLogs([
      { type: 'ready', text: '  ATMARAKSHAK v2.4.0 [ZONE: MUMBAI-CENTRAL-4B] STATUS: OPERATIONAL', time: '11:24:02' },
      { type: 'info', text: '  ➜  Sensors:    128 Active · 0 Offline · Mesh Latency 12ms', time: '11:24:02' },
      { type: 'info', text: '  ➜  Vision AI:   Floor 4 Server Room [NO FLAME / NO SMOKE]', time: '11:24:02' },
      { type: 'tip', text: '  ➜  ERSS 112:   Gateway Connected · GPS Lat: 19.0760, Lng: 72.8777', time: '11:24:03' },
    ]);
  };

  return (
    <div className="vite-marketing-root" data-theme={theme} data-variant="vite">
      {/* ─── TOP ANNOUNCEMENT BANNER ─── */}
      {bannerVisible && (
        <div className="vite-top-banner">
          <a
            href="https://erss.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="vite-banner-link"
          >
            <img
              src="/footer-background.BIgtbvhx.jpg"
              alt=""
              aria-hidden="true"
              className="vite-banner-bg"
            />
            <div className="vite-banner-inner">
              <span style={{ fontSize: '1rem' }}>🛡️</span>
              <span>Smart India Hackathon 2026 · Integrated with Emergency Response Support System (ERSS 112)</span>
              <span className="vite-banner-arrow">→</span>
            </div>
          </a>
          <button
            className="vite-banner-close"
            onClick={() => setBannerVisible(false)}
            aria-label="Close banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── HEADER / NAVBAR (Floating Glass Dock) ─── */}
      <div className="vite-header-wrap">
        <header className="vite-header">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
            <a href="/" className="vite-logo-link">
              <img
                src="/atmarakshak_logo.png"
                alt="Atmarakshak Logo"
                style={{ height: 28, width: 28, objectFit: 'contain', borderRadius: 6 }}
              />
              <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.22rem' }}>
                ATMA<span className="vite-gradient-text">RAKSHAK</span>
              </span>
            </a>

            {/* Navigation links - Spacious & Clean */}
            <nav style={{ display: 'flex', alignItems: 'center' }}>
              <ul className="vite-nav-links" style={{ gap: '8px' }}>
                <li className="vite-nav-item">
                  <a href="#capabilities" className="vite-nav-link">Capabilities</a>
                </li>
                <li className="vite-nav-item">
                  <a href="#architecture" className="vite-nav-link">Architecture</a>
                </li>
                <li className="vite-nav-item">
                  <a href="#facilities" className="vite-nav-link">Facilities</a>
                </li>
                <li className="vite-nav-item">
                  <a href="#stats" className="vite-nav-link">Impact</a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Right Header items */}
          <div className="vite-header-right" style={{ gap: '14px' }}>
            {/* Search Button */}
            <button
              className="vite-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search</span>
              <span className="vite-search-kbd">Ctrl K</span>
            </button>

            {/* Dark / Light Mode Switch */}
            <div
              className="vite-theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <div className={`vite-theme-thumb ${theme === 'dark' ? 'active-dark' : ''}`}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="vite-btn-nav-accent"
              title="Sign in to Atmarakshak"
            >
              <span>Login</span>
              <span style={{ fontSize: '0.85rem' }}>↗</span>
            </button>
          </div>
        </header>
      </div>

      {/* ─── HERO SECTION ─── */}
      <div className="vite-wrapper vite-wrapper--ticks">
        <div className="vite-hero-grid">
          {/* Left Column */}
          <div className="vite-hero-left">
            <div>
              {/* Badge */}


              {/* Title & Tagline */}
              <h1 className="vite-hero-title">
                The Emergency Response <br />
                <span className="vite-gradient-text">System for Smart Buildings</span>
              </h1>
              <p className="vite-hero-sub">
                ATMARAKSHAK fuses thermal computer vision, wireless IoT mesh sensors, and automated ERSS 112 dispatch to detect and contain fire hazards in under 3 seconds.
              </p>

              {/* Action Buttons */}
              <div className="vite-hero-cta-group">
                <button
                  onClick={() => navigate('/owner')}
                  className="vite-btn vite-btn-primary"
                >
                  Launch Owner Portal →
                </button>
                <button
                  onClick={() => navigate('/dispatch')}
                  className="vite-btn vite-btn-brand"
                >
                  🚒 ERSS Dispatch Console
                </button>
                <a href="#capabilities" className="vite-btn vite-btn-ghost">
                  Explore Capabilities
                </a>
              </div>
            </div>

            {/* CLI / Telemetry Code Block Tabs */}
            <div className="vite-code-group">
              <div className="vite-code-tabs">
                {[
                  { id: 'mqtt', label: 'MQTT Stream' },
                  { id: 'sensors', label: 'Sensor Mesh' },
                  { id: 'erss', label: 'ERSS 112 API' },
                  { id: 'vision', label: 'CCTV Vision' },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={`vite-code-tab ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="vite-code-body">
                <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', marginRight: '12px' }}>
                  <span className="vite-code-prompt">$</span>
                  <span className="vite-code-text">{cliCommands[activeTab]}</span>
                </div>
                <button
                  className={`vite-copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                  title="Copy command"
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (Holographic 3D Room & Fire Sensor Canvas) */}
          <div className="vite-hero-right">
            <div className="vite-canvas-glow" />
            <Atmarakshak3DHero theme={theme} />
          </div>
        </div>
      </div>

      {/* ─── TRUSTED BY SECTION ─── */}
      <div className="vite-wrapper vite-wrapper--ticks vite-border-t">
        <div className="vite-trusted-header">
          <h6 className="vite-trusted-title">Trusted by India's emergency &amp; infrastructure authorities</h6>
        </div>
        <div className="vite-trusted-row">
          {[
            { name: 'Mumbai Fire Brigade', label: 'MUMBAI FIRE BRIGADE' },
            { name: 'ERSS 112 India', label: 'ERSS 112 NATIONAL' },
            { name: 'Smart Cities Mission', label: 'SMART CITIES MISSION' },
            { name: 'Infosys SEZ Campuses', label: 'INFOSYS SEZ' },
            { name: 'Phoenix Mall Group', label: 'PHOENIX MALLS' },
            { name: 'Delhi Metro Rail', label: 'DELHI METRO DMRC' },
          ].map((partner) => (
            <div
              key={partner.name}
              className="vite-trusted-item"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                color: 'var(--color-grey)',
              }}
            >
              🛡️ {partner.label}
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 1: REDEFINING LIFE-CRITICAL SAFETY ─── */}
      <div id="capabilities" className="vite-wrapper vite-border-t">
        <div className="vite-section-header">
          <h2 className="vite-section-title">Redefining life-critical safety</h2>
          <p className="vite-section-desc">
            Sub-second telemetry, zero false negatives, and automated multi-agency emergency coordination.
          </p>
        </div>
      </div>

      <div className="vite-wrapper vite-wrapper--ticks vite-border-t">
        <div className="vite-feature-grid">
          {/* Card 1: Multi-Sensor Fire Detection */}
          <div className="vite-feature-card">
            <div className="vite-feature-text">
              <h5 className="vite-feature-title">Multi-Sensor Fire Detection</h5>
              <p className="vite-feature-desc">
                Fuses optical smoke detectors, thermal infrared cameras, CO sensors, and humidity telemetry to achieve sub-3-second fire identification with near-zero false alarms.
              </p>
            </div>
            <div className="vite-feature-visual">
              <div className="vite-telemetry-clean vite-telemetry-fade">
                <div style={{ color: 'var(--color-critical)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                  <span className="vite-sensor-dot" />
                  ● CRITICAL ALERT: SENSOR NODE #4B-02
                </div>
                <div className="vite-telemetry-row">Temperature: <span style={{ color: 'var(--color-critical)', fontWeight: 700 }}>84.6°C</span> (Threshold: 55°C)</div>
                <div className="vite-telemetry-row">Smoke Density (MQ-2): <span style={{ color: 'var(--color-brand)', fontWeight: 700 }}>680 ppm</span> (Spike: +410%)</div>
                <div className="vite-telemetry-row">CO Level: <span style={{ color: 'var(--color-brand-orange)', fontWeight: 700 }}>88 ppm</span> (High Hazard)</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-zest)', marginTop: '8px', fontWeight: 600 }}>✓ AI Correlation Confidence: 99.4% [Confirmed Fire]</div>
              </div>
            </div>
          </div>

          {/* Card 2: Real-Time Computer Vision */}
          <div className="vite-feature-card">
            <div className="vite-feature-text">
              <h5 className="vite-feature-title">Real-Time Computer Vision</h5>
              <p className="vite-feature-desc">
                Custom-trained CNN analyzes live CCTV video streams across all floors, detecting flame flicker, smoke plumes, and corridor human stampedes without operator fatigue.
              </p>
            </div>
            <div className="vite-feature-visual">
              <div className="vite-telemetry-clean vite-cctv-box vite-telemetry-fade">
                <div style={{ color: 'var(--color-electric)', fontWeight: 700, marginBottom: '8px' }}>
                  🎥 CCTV FEED: CAM-04-FL4 [SERVER ROOM]
                </div>
                <div className="vite-telemetry-row">Resolution: 1080p @ 30 FPS · Ingestion Latency: 16ms</div>
                <div className="vite-telemetry-row">Bounding Box: [x: 412, y: 180, w: 220, h: 185]</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-critical)' }}>Object: FLAME_CLASS_A [Score: 0.982]</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-brand)', marginTop: '8px' }}>➜ Bounding Box Sent to Digital Twin Overlay</div>
              </div>
            </div>
          </div>

          {/* Card 3: Building Digital Twin & IoT Mesh */}
          <div className="vite-feature-card">
            <div className="vite-feature-text">
              <h5 className="vite-feature-title">Building Digital Twin &amp; IoT Mesh</h5>
              <p className="vite-feature-desc">
                Wireless sensor mesh monitors temperature, LPG leakage, and occupancy across every zone in real time with interactive 3D floor maps.
              </p>
            </div>
            <div className="vite-feature-visual" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxWidth: '440px' }}>
                {[
                  'Thermal Imagers',
                  'Optical Smoke Detectors',
                  'CO₂ & LPG Analyzers',
                  'Occupancy Heatmaps',
                  'Safe Egress Wayfinders',
                  'Water Sprinkler Pressure',
                  'HVAC Fire Dampers',
                  'Emergency Light Nodes',
                  'Sub-second Mesh Ping',
                ].map((chip) => (
                  <span key={chip} className="vite-iot-chip">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Instant ERSS 112 Dispatch */}
          <div className="vite-feature-card">
            <div className="vite-feature-text">
              <h5 className="vite-feature-title">Instant ERSS 112 Auto-Dispatch</h5>
              <p className="vite-feature-desc">
                Auto-generates structured incident telemetry with exact floor plans and pushes them directly to the ERSS 112 command queue, reducing response latency by up to 73%.
              </p>
            </div>
            <div className="vite-feature-visual">
              <div className="vite-telemetry-clean vite-telemetry-fade">
                <div style={{ color: 'var(--color-critical)', fontWeight: 700, marginBottom: '8px' }}>
                  🚒 ERSS 112 DISPATCH PACKET [TRANSMITTED]
                </div>
                <div className="vite-telemetry-row">Target: ERSS Mumbai Control Center #04</div>
                <div className="vite-telemetry-row">Building: Tech Tower 4B, Sector 5, Vashi</div>
                <div className="vite-telemetry-row">Hazard Level: CRITICAL · Occupants at Risk: 14</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-zest)', marginTop: '8px', fontWeight: 600 }}>✓ Dispatch Acknowledged · Responding Unit: WT-14</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: SYSTEM ARCHITECTURE ─── */}
      <div id="architecture" className="vite-wrapper vite-border-t">
        <div className="vite-section-header">
          <h2 className="vite-section-title">A shared foundation for life safety</h2>
          <p className="vite-section-desc">From hardware perception at the edge to automated emergency command.</p>
        </div>
      </div>

      <div className="vite-wrapper vite-wrapper--ticks vite-border-t">
        <div className="vite-feature-grid">
          {/* Layer 1: Perception */}
          <div className="vite-feature-card">
            <div className="vite-feature-text">
              <h5 className="vite-feature-title">Multi-Layer Edge Perception</h5>
              <p className="vite-feature-desc">
                Hardened IoT sensors communicate over Zigbee/LoRa mesh, ensuring telemetry transmission even if building power or main internet is cut.
              </p>
            </div>
            <div className="vite-feature-visual">
              <div className="vite-telemetry-clean vite-telemetry-fade">
                <div style={{ fontWeight: 700, color: 'var(--color-brand)', marginBottom: '8px' }}>[EDGE PERCEPTION LAYER]</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-critical)' }}>→ Thermal Camera (FLIR Lepton)</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-brand)' }}>→ Multi-Gas Spectrometer (CO, VOC, LPG)</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-zest)' }}>→ Optical Smoke Scatter Sensor</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-electric)' }}>→ 1080p IP RTSP Surveillance Feeds</div>
              </div>
            </div>
          </div>

          {/* Layer 2: AI Core */}
          <div className="vite-feature-card">
            <div className="vite-feature-text">
              <h5 className="vite-feature-title">Ensemble AI Decision Engine</h5>
              <p className="vite-feature-desc">
                Cross-validates sensory data using neural temporal models, eliminating false alarms caused by steam, dust, or cooking vapors.
              </p>
            </div>
            <div className="vite-feature-visual">
              <div className="vite-telemetry-clean vite-telemetry-fade">
                <div style={{ fontWeight: 700, color: 'var(--color-brand)', marginBottom: '8px' }}>[AI VALIDATION PIPELINE]</div>
                <div className="vite-telemetry-row">1. Sensor Anomaly Pre-Filtering</div>
                <div className="vite-telemetry-row">2. Computer Vision Spatial Confirmation</div>
                <div className="vite-telemetry-row">3. Multi-Sensor Spatial Correlation</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-zest)', fontWeight: 600 }}>✓ Incident State Verified in 1.8s</div>
              </div>
            </div>
          </div>

          {/* Layer 3: Evacuation */}
          <div className="vite-feature-card">
            <div className="vite-feature-text">
              <h5 className="vite-feature-title">Dynamic Evacuation Guidance</h5>
              <p className="vite-feature-desc">
                Computes optimal escape paths in real time based on active fire spread, dynamically routing occupants away from toxic smoke zones.
              </p>
            </div>
            <div className="vite-feature-visual">
              <div className="vite-telemetry-clean vite-telemetry-fade">
                <div style={{ fontWeight: 700, color: 'var(--color-brand)', marginBottom: '8px' }}>[DYNAMIC EGRESS ROUTING]</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-critical)' }}>✖ Stairwell B: COMPROMISED (Smoke Tier 3)</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-zest)' }}>✔ Stairwell A: CLEAR (Pressurization Active)</div>
                <div className="vite-telemetry-row">Wayfinding Signage: Auto-Redirected</div>
              </div>
            </div>
          </div>

          {/* Layer 4: Compliance */}
          <div className="vite-feature-card">
            <div className="vite-feature-text">
              <h5 className="vite-feature-title">Automated Audit &amp; Compliance</h5>
              <p className="vite-feature-desc">
                Cryptographically verifiable timestamped audit logs for National Building Code (NBC 2016) compliance and insurance claims.
              </p>
            </div>
            <div className="vite-feature-visual">
              <div className="vite-telemetry-clean vite-telemetry-fade">
                <div style={{ fontWeight: 700, color: 'var(--color-brand)', marginBottom: '8px' }}>[NBC 2016 COMPLIANCE LOG]</div>
                <div className="vite-telemetry-row">Incident Hash: 0x9f82...c31b</div>
                <div className="vite-telemetry-row">Sensor Health: 99.8% System Uptime</div>
                <div className="vite-telemetry-row" style={{ color: 'var(--color-zest)', fontWeight: 600 }}>Status: NBC Part 4 Fire Safety Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: FACILITIES SHOWCASE ─── */}
      <div id="facilities" className="vite-wrapper vite-border-t">
        <div className="vite-section-header">
          <h2 className="vite-section-title">Safeguarding critical infrastructure across India</h2>
          <p className="vite-section-desc">Tailored safety profiles engineered for unique architectural environments.</p>
        </div>
      </div>

      <div className="vite-wrapper vite-wrapper--ticks vite-border-t">
        <div className="vite-framework-section">
          {/* Facility chips */}
          <div className="vite-framework-chips">
            {facilities.map((f) => (
              <button
                key={f.id}
                className={`vite-framework-chip ${activeFacility === f.id ? 'active' : ''}`}
                onClick={() => setActiveFacility(f.id)}
              >
                <span>🏢</span>
                {f.name}
              </button>
            ))}
          </div>

          {/* Facility Description & Command */}
          <div
            style={{
              background: 'var(--color-slate)',
              border: '1px solid var(--color-nickel)',
              borderRadius: '12px',
              padding: '28px 32px',
              maxWidth: '820px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-white)' }}>
              {facilities.find((f) => f.id === activeFacility)?.name}
            </div>
            <p style={{ color: 'var(--color-grey)', margin: 0, lineHeight: 1.6 }}>
              {facilities.find((f) => f.id === activeFacility)?.desc}
            </p>
            <div
              style={{
                background: 'var(--color-midnight)',
                border: '1px solid var(--color-nickel)',
                borderRadius: '8px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: 'var(--color-grey)' }}>$</span>
              <span style={{ color: 'var(--color-white)', overflowX: 'auto' }}>
                {facilities.find((f) => f.id === activeFacility)?.cmd}
              </span>
              <button
                className="vite-copy-btn"
                style={{ marginLeft: 'auto' }}
                onClick={() => {
                  const cmd = facilities.find((f) => f.id === activeFacility)?.cmd;
                  navigator.clipboard.writeText(cmd);
                }}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERACTIVE TELEMETRY SIMULATOR ─── */}
      <div id="simulator" className="vite-wrapper vite-border-t" style={{ paddingTop: '50px' }}>
        <div className="vite-section-header" style={{ paddingBottom: '30px' }}>
          <h3 className="vite-section-title" style={{ fontSize: '2rem' }}>
            Live Emergency Telemetry Simulator
          </h3>
          <p className="vite-section-desc">Experience Atmarakshak's sub-3-second detection and auto-dispatch pipeline in real time.</p>
        </div>

        <div className="vite-simulator">
          <div className="vite-sim-header">
            <div className="vite-sim-dots">
              <div className="vite-sim-dot" style={{ background: '#ff5f56' }} />
              <div className="vite-sim-dot" style={{ background: '#ffbd2e' }} />
              <div className="vite-sim-dot" style={{ background: '#27c93f' }} />
              <span style={{ marginLeft: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-grey)' }}>
                atmarakshak-telemetry-feed — Sector 4B
              </span>
            </div>
            <div className="vite-sim-controls">
              <button className="vite-sim-btn" onClick={triggerHeatSpike}>
                🔥 Simulate Heat Spike
              </button>
              <button className="vite-sim-btn" onClick={triggerAutoDispatch}>
                🚒 Auto-Dispatch 112
              </button>
              <button className="vite-sim-btn" onClick={resetSim}>
                Reset
              </button>
            </div>
          </div>

          <div className="vite-sim-terminal">
            {simLogs.map((log, idx) => (
              <div key={idx}>
                {log.type === 'ready' && <span className="vite-sim-green">{log.text}</span>}
                {log.type === 'info' && <span className="vite-sim-cyan">{log.text}</span>}
                {log.type === 'tip' && <span style={{ color: 'var(--color-grey)' }}>{log.text}</span>}
                {log.type === 'hmr' && (
                  <span className="vite-sim-purple">
                    [{log.time}] {log.text}
                  </span>
                )}
                {log.type === 'build' && (
                  <span style={{ color: '#ff4d6a', fontWeight: 700 }}>
                    [{log.time}] {log.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SECTION 4: PROVEN AT SCALE & TESTIMONIALS ─── */}
      <div id="stats" className="vite-wrapper vite-wrapper--ticks vite-border-t">
        <div className="vite-community-stats">
          <div>
            <h3 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.03em' }}>
              Proven at scale across India
            </h3>
            <p style={{ color: 'var(--color-grey)', margin: 0, maxWidth: '28rem', fontSize: '1.05rem' }}>
              Real numbers. Real impact. Protecting lives and high-value infrastructure every second.
            </p>
          </div>

          <div className="vite-stat-pair">
            <div>
              <div className="vite-stat-val">200+</div>
              <div className="vite-stat-label">BUILDINGS PROTECTED</div>
            </div>
            <div>
              <div className="vite-stat-val">73%</div>
              <div className="vite-stat-label">FASTER RESPONSE TIME</div>
            </div>
            <div>
              <div className="vite-stat-val">3s</div>
              <div className="vite-stat-label">DETECTION LATENCY</div>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="vite-testimonials-grid">
          {[
            {
              quote: "ATMARAKSHAK detected an overheating capacitor in our primary server room within 2 seconds — before any employee even smelled smoke. The dispatch integration had units on site in 6 minutes.",
              name: 'Rajiv Mehta',
              handle: 'Facilities Director',
              title: 'Infosys SEZ, Pune',
              avatar: 'RM',
            },
            {
              quote: "We have reduced false alarm dispatches from 40% down to under 1%. The AI sensor cross-validation gives our dispatchers 100% confidence when sending tenders into congested traffic.",
              name: 'Dy. Commissioner Priya Nair',
              handle: 'Zone Commander',
              title: 'Mumbai Fire Brigade & ERSS 112',
              avatar: 'PN',
            },
            {
              quote: "The 3D Building Digital Twin helped us pinpoint high-risk kitchen corridor flare-ups instantly during peak mall hours. Proactive occupant safety is now fully automated.",
              name: 'Sunita Agarwal',
              handle: 'Head of Operations',
              title: 'Phoenix Mall Group',
              avatar: 'SA',
            },
          ].map((t) => (
            <div key={t.name} className="vite-testimonial-card">
              <p className="vite-testimonial-quote">"{t.quote}"</p>
              <div className="vite-testimonial-author">
                <div className="vite-avatar">{t.avatar}</div>
                <div className="vite-author-info">
                  <span className="vite-author-name">{t.name}</span>
                  <span className="vite-author-handle">{t.handle} · {t.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BOTTOM CTA BANNER ─── */}
      <div className="vite-wrapper vite-border-t">
        <div className="vite-bottom-cta">
          <div className="vite-cta-glow" />
          <img
            src="/footer-background.BIgtbvhx.jpg"
            alt=""
            className="vite-cta-bg"
          />
          <div className="vite-cta-content">
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, margin: 0, color: 'var(--color-bright)' }}>
              Protect your building today
            </h2>
            <p style={{ color: 'var(--color-dim)', fontSize: '1.1rem', margin: 0, maxWidth: '640px', lineHeight: 1.6 }}>
              Join hundreds of facility managers and fire departments already safeguarding millions of lives across India with ATMARAKSHAK.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
              <button
                onClick={() => navigate('/owner')}
                className="vite-btn vite-btn-primary"
                style={{ padding: '12px 32px' }}
              >
                Access Owner Console →
              </button>
              <button
                onClick={() => navigate('/dispatch')}
                className="vite-btn vite-btn-brand"
                style={{ padding: '12px 28px' }}
              >
                Launch Fire Dispatch Console
              </button>
              <button
                onClick={() => navigate('/login')}
                className="vite-btn vite-btn-ghost"
                style={{ padding: '12px 28px' }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="vite-footer">
        <div className="vite-wrapper vite-wrapper--ticks">
          <div className="vite-footer-grid">
            {/* Column 1 */}
            <div>
              <p className="vite-footer-col-title">Atmarakshak</p>
              <ul className="vite-footer-links">
                <li><a href="#capabilities" className="vite-footer-link">Multi-Sensor Fusion</a></li>
                <li><a href="#capabilities" className="vite-footer-link">CCTV Computer Vision</a></li>
                <li><a href="#architecture" className="vite-footer-link">Digital Twin Architecture</a></li>
                <li><a href="#facilities" className="vite-footer-link">Facilities &amp; Infrastructure</a></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <p className="vite-footer-col-title">Government &amp; Standards</p>
              <ul className="vite-footer-links">
                <li><a href="https://erss.gov.in" target="_blank" rel="noreferrer" className="vite-footer-link">ERSS 112 Portal</a></li>
                <li><a href="https://mohua.gov.in" target="_blank" rel="noreferrer" className="vite-footer-link">Ministry of Housing &amp; Urban Affairs</a></li>
                <li><a href="https://www.sih.gov.in" target="_blank" rel="noreferrer" className="vite-footer-link">Smart India Hackathon 2026</a></li>
                <li><a href="#stats" className="vite-footer-link">NBC 2016 Guidelines</a></li>
              </ul>
            </div>

            {/* Column 3: App Portals */}
            <div>
              <p className="vite-footer-col-title">Operations Portals</p>
              <ul className="vite-footer-links">
                <li>
                  <button
                    onClick={() => navigate('/owner')}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                    className="vite-footer-link"
                  >
                    🏢 Owner Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/dispatch')}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                    className="vite-footer-link"
                  >
                    🚒 ERSS Dispatch Console
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/login')}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                    className="vite-footer-link"
                  >
                    🔑 Sign In / Authentication
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Emergency Contacts */}
            <div>
              <p className="vite-footer-col-title">Emergency Response</p>
              <ul className="vite-footer-links">
                <li style={{ color: '#ff4d6a', fontWeight: 700 }}>National Emergency: Dial 112</li>
                <li>Fire Emergency: Dial 101</li>
                <li>Ambulance: Dial 102 / 108</li>
                <li>Disaster Management: Dial 1070</li>
              </ul>
            </div>
          </div>

          <div className="vite-footer-bottom">
            <p style={{ margin: 0 }}>
              © 2026 ATMARAKSHAK (आत्मरक्षक) — Smart India Hackathon. Designed with Vite.dev UI System.
            </p>
            <div style={{ display: 'flex', gap: '18px' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security Audits</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── SEARCH DIALOG MODAL ─── */}
      {searchOpen && (
        <div className="vite-search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="vite-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vite-search-input-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                autoFocus
                placeholder="Search Atmarakshak documentation, sensors, or portals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="vite-search-input"
              />
              <span className="vite-search-kbd">ESC</span>
            </div>

            <div className="vite-search-results">
              {filteredSearch.length > 0 ? (
                filteredSearch.map((item) => (
                  <div
                    key={item.title}
                    className="vite-search-item"
                    onClick={() => {
                      setSearchOpen(false);
                      if (item.isRoute) {
                        navigate(item.path);
                      } else {
                        window.location.href = item.path;
                      }
                    }}
                  >
                    <span style={{ fontSize: '0.95rem' }}>{item.title}</span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(189, 52, 254, 0.15)',
                        color: 'var(--color-vite)',
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-grey)', fontSize: '0.9rem' }}>
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
