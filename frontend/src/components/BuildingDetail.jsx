/**
 * BuildingDetail Component
 * Dashboard view for a specific building showing cameras, hologram, and fire station info
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Video, Layers, MapPin, Phone, Truck, Building2, AlertTriangle, Radio } from 'lucide-react';
import CctvStreamPlayer from './CctvStreamPlayer';
import IsometricHologram from './IsometricHologram';
import DispatchMap from './DispatchMap';
import './BuildingDetail.css';

export default function BuildingDetail({ building, onBack }) {
  const [viewMode, setViewMode] = useState('cctv'); // 'cctv' or 'hologram'
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [nearestStation, setNearestStation] = useState(null);

  useEffect(() => {
    if (building) {
      fetchCameras();
      fetchNearestStation();
    }
  }, [building]);

  const fetchCameras = async () => {
    try {
      const response = await fetch(`/api/cameras?building_id=${building.id}`);
      if (response.ok) {
        const data = await response.json();
        const cameraList = data.data?.cameras || [];
        setCameras(cameraList);
        if (cameraList.length > 0) {
          setSelectedCamera(cameraList[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
    }
  };

  const fetchNearestStation = async () => {
    // Mock data for now - in production this would fetch from API
    setNearestStation({
      name: 'Central Fire Station',
      distance: '2.4 km',
      eta: '~7 min',
      phone: '+91-101',
      address: 'MG Road, Sector 14'
    });
  };

  if (!building) return null;

  return (
    <div className="building-detail-container">
      {/* Header */}
      <div className="building-detail-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        
        <div className="building-header-content">
          <div className="building-header-main">
            <div className="building-header-icon">
              <Building2 size={28} />
            </div>
            <div>
              <h1 className="building-detail-title">{building.name}</h1>
              <p className="building-detail-subtitle">
                {building.building_type} · {building.number_of_floors} Floors · {building.number_of_units} Units
              </p>
            </div>
          </div>
          
          <div className="building-header-stats">
            <div className="stat-pill">
              <span className="stat-label">Status</span>
              <span className={`stat-value ${building.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                {building.status}
              </span>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Cameras</span>
              <span className="stat-value">{cameras.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="building-detail-content">
        {/* Left Column - Video/Hologram */}
        <div className="building-main-column">
          {/* Central Display Card - Matches Dispatch Dashboard */}
          <div className="dc-card">
            {/* Header with Mode Selector */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #323633' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`dc-mode-pill ${viewMode === 'cctv' ? 'active' : ''}`}
                    onClick={() => setViewMode('cctv')}
                  >
                    <Radio size={12} />
                    <span>OPTICAL CCTV</span>
                  </button>
                  <button
                    className={`dc-mode-pill ${viewMode === 'hologram' ? 'active' : ''}`}
                    onClick={() => setViewMode('hologram')}
                  >
                    <Layers size={12} />
                    <span>HOLOGRAM</span>
                  </button>
                </div>

                {viewMode === 'cctv' && selectedCamera && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#8b928a' }}>
                    CAMERA: <strong style={{ color: '#eae7df' }}>{selectedCamera.camera_code}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Video/Hologram Display */}
            <div style={{ padding: 14 }}>
              {viewMode === 'cctv' ? (
                selectedCamera ? (
                  <CctvStreamPlayer
                    cameraId={selectedCamera.camera_code}
                    streamUrl={selectedCamera.stream_url}
                  />
                ) : (
                  <div className="no-camera-placeholder">
                    <Video size={48} style={{ opacity: 0.3 }} />
                    <p>No cameras available for this building</p>
                  </div>
                )
              ) : (
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633', background: '#121413' }}>
                  <IsometricHologram buildingId={building.id} theme="dark" minHeight="380px" maxHeight="440px" />
                </div>
              )}
            </div>
          </div>

          {/* Camera Grid */}
          {cameras.length > 0 && (
            <div className="camera-grid-section">
              <div className="section-header">
                <h3 className="section-title">Available Cameras</h3>
                <span className="section-badge">{cameras.length} ONLINE</span>
              </div>
              <div className="camera-grid">
                {cameras.map(camera => (
                  <div
                    key={camera.id}
                    className={`camera-card ${selectedCamera?.id === camera.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedCamera(camera);
                      setViewMode('cctv');
                    }}
                  >
                    <div className="camera-card-header">
                      <Video size={16} />
                      <span className="camera-code">{camera.camera_code}</span>
                      <span className={`camera-status ${camera.status === 'ONLINE' ? 'online' : 'offline'}`} />
                    </div>
                    <div className="camera-card-body">
                      <p className="camera-name">{camera.name}</p>
                      <p className="camera-location">{camera.location || 'No location'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Transit & Station Info */}
        <div className="building-side-column">
          {/* Live Transit Routing */}
          <div className="side-panel">
            <div className="side-panel-header">
              <MapPin size={18} className="panel-icon" />
              <span className="panel-title">Live Transit Routing</span>
            </div>
            <div className="map-container">
              <DispatchMap 
                buildingLocation={building.address}
                incidentId={null}
              />
            </div>
          </div>

          {/* Nearest Fire Command */}
          <div className="side-panel">
            <div className="side-panel-header">
              <Truck size={18} className="panel-icon" />
              <span className="panel-title">Nearest Fire Command</span>
            </div>
            {nearestStation ? (
              <div className="station-info">
                <div className="station-main">
                  <h4 className="station-name">{nearestStation.name}</h4>
                  <p className="station-address">{nearestStation.address}</p>
                </div>
                
                <div className="station-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Distance</span>
                    <span className="metric-value">{nearestStation.distance}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">ETA</span>
                    <span className="metric-value">{nearestStation.eta}</span>
                  </div>
                </div>

                <a href={`tel:${nearestStation.phone}`} className="station-call-btn">
                  <Phone size={18} />
                  <span>Call Station</span>
                  <span className="station-phone">{nearestStation.phone}</span>
                </a>
              </div>
            ) : (
              <div className="no-station-info">
                <AlertTriangle size={32} style={{ opacity: 0.3 }} />
                <p>No fire station data available</p>
              </div>
            )}
          </div>

          {/* Fire Safety Features */}
          {(building.has_fire_alarm || building.has_sprinkler || building.has_fire_extinguishers || 
            building.has_fire_exit || building.has_fire_hydrant) && (
            <div className="side-panel">
              <div className="side-panel-header">
                <AlertTriangle size={18} className="panel-icon" />
                <span className="panel-title">Fire Safety Features</span>
              </div>
              <div className="safety-features-list">
                {building.has_fire_alarm && (
                  <div className="safety-feature-item">
                    <div className="feature-indicator active" />
                    <span>Fire Alarm System</span>
                  </div>
                )}
                {building.has_sprinkler && (
                  <div className="safety-feature-item">
                    <div className="feature-indicator active" />
                    <span>Sprinkler System</span>
                  </div>
                )}
                {building.has_fire_extinguishers && (
                  <div className="safety-feature-item">
                    <div className="feature-indicator active" />
                    <span>Fire Extinguishers</span>
                  </div>
                )}
                {building.has_fire_exit && (
                  <div className="safety-feature-item">
                    <div className="feature-indicator active" />
                    <span>Fire Exits</span>
                  </div>
                )}
                {building.has_fire_hydrant && (
                  <div className="safety-feature-item">
                    <div className="feature-indicator active" />
                    <span>Fire Hydrant</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
