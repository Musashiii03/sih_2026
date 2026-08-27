import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import CameraList from './components/CameraList';
import VideoFeed from './components/VideoFeed';
import SpatialRadar from './components/SpatialRadar';
import EntityBreakdown from './components/EntityBreakdown';
import IncidentDatabaseView from './components/IncidentDatabaseView';
import ModelMetricsView from './components/ModelMetricsView';
import CameraConfigView from './components/CameraConfigView';
import { playEmergencyAlarm } from './utils/soundSynthesizer';
import { ShieldAlert, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCameraId, setSelectedCameraId] = useState('CAM-03');
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // 7 Facility Sectors / CCTV Feeds Data
  const [cameras, setCameras] = useState([
    {
      id: 'CAM-03',
      location: 'Warehouse A (Hazard Epicenter)',
      status: 'FIRE',
      temp: 685,
      personnelCount: 4,
      sectorZone: 'Sector 4C'
    },
    {
      id: 'CAM-05',
      location: 'Cafeteria Industrial Kitchen',
      status: 'NORMAL',
      temp: 142,
      personnelCount: 2,
      sectorZone: 'Sector 2A'
    },
    {
      id: 'CAM-01',
      location: 'Main Lobby & Security Turnstiles',
      status: 'NORMAL',
      temp: 22,
      personnelCount: 3,
      sectorZone: 'Sector 1A'
    },
    {
      id: 'CAM-07',
      location: 'Chemical Synthesis Lab',
      status: 'SMOKE',
      temp: 19,
      personnelCount: 2,
      sectorZone: 'Sector 3A'
    },
    {
      id: 'CAM-04',
      location: 'Server Infrastructure Vault',
      status: 'WATER_LEAK',
      temp: 18,
      personnelCount: 0,
      sectorZone: 'Sector 1B'
    },
    {
      id: 'CAM-02',
      location: 'Corridor & Fire Exit North',
      status: 'NORMAL',
      temp: 24,
      personnelCount: 1,
      sectorZone: 'Sector 1C'
    },
    {
      id: 'CAM-06',
      location: 'Executive Conference Wing',
      status: 'NORMAL',
      temp: 21,
      personnelCount: 0,
      sectorZone: 'Sector 2B'
    }
  ]);

  const activeCamera = cameras.find(c => c.id === selectedCameraId) || cameras[0];
  const hasActiveFire = cameras.some(c => c.status === 'FIRE');

  // Trigger siren audio if fire active and sound enabled
  useEffect(() => {
    if (hasActiveFire && soundEnabled) {
      playEmergencyAlarm('CRITICAL');
      const interval = setInterval(() => {
        playEmergencyAlarm('CRITICAL');
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [hasActiveFire, soundEnabled]);

  const handleTriggerSOS = () => {
    setSosModalOpen(true);
    if (soundEnabled) {
      playEmergencyAlarm('CRITICAL');
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Header */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onTriggerSOS={handleTriggerSOS}
        hasActiveFire={hasActiveFire}
      />

      {/* Main View Switching */}
      {activeTab === 'dashboard' && (
        <>
          {/* Top KPI Cards Row */}
          <KpiCards 
            kpiData={{
              camerasActive: '6/7',
              hazardsCount: '2',
              personnelAtRisk: '4'
            }}
          />

          {/* 3-Column Tactical Command Body */}
          <main className="dashboard-main">
            {/* Left: Camera / Sector Selector */}
            <CameraList 
              cameras={cameras}
              selectedCameraId={selectedCameraId}
              onSelectCamera={setSelectedCameraId}
            />

            {/* Center: Live CCTV Feed Matrix Canvas */}
            <VideoFeed 
              camera={activeCamera}
              soundEnabled={soundEnabled}
            />

            {/* Right: 2D Spatial Threat Matrix & Personnel Breakdown */}
            <div className="right-panel">
              <SpatialRadar camera={activeCamera} />
              <EntityBreakdown camera={activeCamera} />
            </div>
          </main>
        </>
      )}

      {activeTab === 'incidents' && <IncidentDatabaseView />}
      {activeTab === 'metrics' && <ModelMetricsView />}
      {activeTab === 'config' && <CameraConfigView />}

      {/* Emergency SOS Dispatch Modal */}
      {sosModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-panel)',
            border: '2px solid var(--color-fire)',
            borderRadius: 12,
            padding: 24,
            width: 480,
            boxShadow: '0 0 30px rgba(255, 42, 95, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ff2a5f', fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-tech)' }}>
                <ShieldAlert size={24} /> MANUAL EMERGENCY SOS DISPATCH
              </div>
              <button className="action-btn" onClick={() => setSosModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>
              Immediate emergency notification will be dispatched across local alarms, console broadcast, and building safety services.
            </div>

            <div style={{
              background: 'rgba(255, 42, 95, 0.1)',
              border: '1px solid rgba(255, 42, 95, 0.3)',
              borderRadius: 8,
              padding: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#ff2a5f'
            }}>
              LOCATION: Sector 4C Warehouse A<br />
              TELEMETRY: 685°C FLAMEOVER DETECTED<br />
              PERSONNEL AT RISK: 4 INDIVIDUALS
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                className="nav-tab" 
                onClick={() => setSosModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="nav-tab active" 
                style={{ background: '#ff2a5f', color: '#fff', border: 'none' }}
                onClick={() => {
                  alert('EMERGENCY BROADCAST SENT TO BUILDING SECURITY & FIRE SERVICES');
                  setSosModalOpen(false);
                }}
              >
                CONFIRM DISPATCH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
