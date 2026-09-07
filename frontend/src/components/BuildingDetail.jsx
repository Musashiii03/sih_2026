/**
 * BuildingDetail Component
 * Dashboard view for a specific building showing cameras, hologram, and fire station info
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Video, Layers, MapPin, Phone, Truck, Building2, AlertTriangle, Radio } from 'lucide-react';
import CctvStreamPlayer from './CctvStreamPlayer';
import IsometricHologram from './IsometricHologram';
import DispatchMap from './DispatchMap';
import IncidentDetailView from './IncidentDetailView';
import './BuildingDetail.css';

export default function BuildingDetail({ building, onBack, activeIncidentId, onVerifyIncident }) {
  const [viewMode, setViewMode] = useState('cctv'); // 'cctv' or 'hologram'
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [nearestStation, setNearestStation] = useState(null);
  const [showIncidentView, setShowIncidentView] = useState(false);

  // Show incident view if activeIncidentId is provided
  useEffect(() => {
    if (activeIncidentId) {
      setShowIncidentView(true);
    }
  }, [activeIncidentId]);

  useEffect(() => {
    if (building) {
      fetchCameras();
      fetchNearestStation();
    }
  }, [building]);

  const fetchCameras = async () => {
    try {
      console.log('🔄 Fetching cameras from API...');
      
      // Fetch ALL cameras regardless of building_id
      const response = await fetch(`http://localhost:3001/api/cameras?limit=100`);
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Raw API response:', data);
        
        // Handle response structure - could be data.cameras or data.data.cameras
        const cameraList = data.data?.cameras || data.cameras || [];
        
        console.log('📹 Parsed cameras:', cameraList.length, 'cameras found');
        
        if (cameraList.length > 0) {
          console.log('✅ Setting cameras:', cameraList);
          setCameras(cameraList);
          setSelectedCamera(cameraList[0]);
        } else {
          console.warn('⚠️ No cameras in API response, using mock data');
          setMockCameras();
        }
      } else {
        console.error('❌ Failed to fetch cameras. Status:', response.status);
        setMockCameras();
      }
    } catch (error) {
      console.error('❌ Error fetching cameras:', error);
      setMockCameras();
    }
  };

  const setMockCameras = () => {
    const mockCameras = [
      {
        id: 1,
        camera_code: "CAM-01",
        name: "Lobby Main Entrance",
        status: "ONLINE",
        floor_number: 0,
        room_name: "Main Lobby",
        location_description: "Covering main entrance and reception area"
      },
      {
        id: 2,
        camera_code: "CAM-02",
        name: "Floor 5 Corridor",
        status: "ONLINE",
        floor_number: 5,
        room_name: "Main Corridor",
        location_description: "Monitoring hallway and emergency exits"
      },
      {
        id: 3,
        camera_code: "CAM-03",
        name: "Parking Level B1",
        status: "ONLINE",
        floor_number: -1,
        room_name: "Basement Parking",
        location_description: "Monitoring basement parking area"
      },
      {
        id: 4,
        camera_code: "CAM-04",
        name: "Reception Area",
        status: "ONLINE",
        floor_number: 0,
        room_name: "Reception",
        location_description: "Main reception desk coverage"
      },
      {
        id: 5,
        camera_code: "CAM-05",
        name: "Server Room Floor 10",
        status: "ONLINE",
        floor_number: 10,
        room_name: "Server Room",
        location_description: "Critical server infrastructure monitoring"
      },
      {
        id: 6,
        camera_code: "CAM-06",
        name: "Building Entrance",
        status: "ONLINE",
        floor_number: 0,
        room_name: "Main Gate",
        location_description: "Residential building main entrance"
      },
      {
        id: 7,
        camera_code: "CAM-07",
        name: "Floor 15 Common Area",
        status: "ONLINE",
        floor_number: 15,
        room_name: "Common Area",
        location_description: "Common area and lift lobby"
      }
    ];
    console.log('⚠️ Using mock camera data:', mockCameras.length, 'cameras');
    setCameras(mockCameras);
    setSelectedCamera(mockCameras[0]);
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

  // If showing incident view, render IncidentDetailView instead
  if (showIncidentView && activeIncidentId) {
    return (
      <IncidentDetailView
        incidentNumber={activeIncidentId}
        building={building}
        onBack={() => {
          setShowIncidentView(false);
          // If user wants to go back further, call parent onBack
          // Otherwise stay on building detail
        }}
      />
    );
  }

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
                    <span>CAMERA VIEW</span>
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
                <div className="cctv-placeholder-container">
                  {/* Placeholder CCTV Image */}
                  <div className="cctv-placeholder">
                    <img 
                      src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80" 
                      alt="CCTV Feed Placeholder"
                      className="cctv-placeholder-image"
                      onError={(e) => {
                        // Fallback to a solid color background if image fails
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = 'linear-gradient(135deg, #1d2021 0%, #282828 100%)';
                      }}
                    />
                    <div className="cctv-placeholder-overlay">
                      <Video size={48} className="cctv-placeholder-icon" />
                      {selectedCamera ? (
                        <>
                          <p className="cctv-placeholder-text">{selectedCamera.name || 'Camera Feed'}</p>
                          <p className="cctv-placeholder-camera">{selectedCamera.camera_code}</p>
                          {(selectedCamera.floor_number || selectedCamera.room_name) && (
                            <p className="cctv-placeholder-details">
                              {selectedCamera.floor_number && `Floor ${selectedCamera.floor_number}`}
                              {selectedCamera.floor_number && selectedCamera.room_name && ' · '}
                              {selectedCamera.room_name}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="cctv-placeholder-text">Select a camera to view</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #323633', background: '#121413' }}>
                  <IsometricHologram buildingId={building.id} theme="dark" minHeight="380px" maxHeight="440px" />
                </div>
              )}
            </div>
          </div>

          {/* Cameras Section */}
          <div className="cameras-section">
            <div className="cameras-section-header">
              <h2 className="cameras-section-title">
                <Video size={20} />
                <span>Cameras</span>
              </h2>
              <span className="cameras-count-badge">
                {cameras.length} {cameras.length === 1 ? 'Camera' : 'Cameras'}
              </span>
            </div>

            {cameras.length > 0 ? (
              <div className="cameras-list">
                {cameras.map(camera => (
                  <div
                    key={camera.id}
                    className={`camera-list-item ${selectedCamera?.id === camera.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedCamera(camera);
                      setViewMode('cctv');
                    }}
                  >
                    <div className="camera-list-icon">
                      <Video size={18} />
                    </div>
                    <div className="camera-list-content">
                      <div className="camera-list-header">
                        <span className="camera-list-code">{camera.camera_code}</span>
                        <span className={`camera-list-status ${camera.status === 'ONLINE' ? 'online' : 'offline'}`}>
                          <span className="status-dot"></span>
                          {camera.status || 'ONLINE'}
                        </span>
                      </div>
                      <p className="camera-list-name">{camera.name || 'Unnamed Camera'}</p>
                      {camera.location_description && (
                        <p className="camera-list-location">{camera.location_description}</p>
                      )}
                      {(camera.floor_number || camera.room_name) && (
                        <p className="camera-list-details">
                          {camera.floor_number && `Floor ${camera.floor_number}`}
                          {camera.floor_number && camera.room_name && ' · '}
                          {camera.room_name}
                        </p>
                      )}
                    </div>
                    <div className="camera-list-arrow">
                      <Radio size={16} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-cameras-message">
                <Video size={48} style={{ opacity: 0.3 }} />
                <p>No cameras configured for this building</p>
                <small>Add cameras to monitor this facility</small>
              </div>
            )}
          </div>
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
