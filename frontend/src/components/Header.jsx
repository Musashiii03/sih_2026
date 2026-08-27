import React from 'react';
import { ShieldAlert, Volume2, VolumeX, AlertTriangle, Monitor, Database, BarChart3, Settings } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  soundEnabled, 
  setSoundEnabled, 
  onTriggerSOS,
  hasActiveFire 
}) {
  return (
    <header className="top-header">
      <div className="brand-section">
        <img 
          src="/atmarakshak_logo.png" 
          alt="ATMARAKSHAK Logo" 
          style={{ height: 52, width: 'auto', borderRadius: 6, objectFit: 'contain' }} 
        />
        <div>
          <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>
              <span style={{ color: 'var(--color-fire)' }}>ATMA</span>RAKSHAK
            </span>
            <span className="brand-badge">HUD v2.4</span>
          </div>
          <div className="brand-subtitle">
            <span style={{ fontWeight: 700, marginRight: 6 }}>आत्मरक्षक</span> • DETECT • VERIFY • PROTECT
          </div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Monitor size={14} />
          Command Center
        </button>

        <button 
          className={`nav-tab ${activeTab === 'incidents' ? 'active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          <Database size={14} />
          Incident Log DB
        </button>

        <button 
          className={`nav-tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <BarChart3 size={14} />
          AI Model Specs
        </button>

        <button 
          className={`nav-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={14} />
          cameras.yaml
        </button>
      </nav>

      <div className="header-status-controls">
        {hasActiveFire ? (
          <div className="status-pill danger">
            <span className="signal-dot danger"></span>
            SECTOR 4 FIRE ACTIVE
          </div>
        ) : (
          <div className="status-pill online">
            <span className="signal-dot"></span>
            SECTORS SECURE
          </div>
        )}

        <div className="status-pill online">
          RADAR: ONLINE
        </div>

        <button 
          className="action-btn secondary"
          title={soundEnabled ? "Mute Siren Audio" : "Enable Siren Audio"}
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button 
          className="action-btn danger"
          title="Manual Emergency SOS Dispatch"
          onClick={onTriggerSOS}
        >
          <AlertTriangle size={14} />
          SOS DISPATCH
        </button>
      </div>
    </header>
  );
}
