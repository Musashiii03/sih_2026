/**
 * IncidentDetailView Component
 * 
 * Displays full incident details with evidence frames on building dashboard
 * Fetches data from /api/incidents/dashboard/:incident_number
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  MapPin, 
  Clock, 
  Camera, 
  AlertTriangle,
  Activity,
  Users,
  ExternalLink,
  Layers,
  CheckCircle
} from 'lucide-react';
import './IncidentDetailView.css';

const API_BASE_URL = 'http://localhost:3001/api';

export default function IncidentDetailView({ incidentNumber, building, onBack, onVerifyIncident }) {
  const [incidentData, setIncidentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    if (incidentNumber) {
      fetchIncidentData();
    }
  }, [incidentNumber]);

  const fetchIncidentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/incidents/dashboard/${incidentNumber}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch incident data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setIncidentData(result.data);
        
        // Check if already verified
        if (result.data.incident?.status === 'VERIFIED') {
          setVerificationSuccess(true);
        }
        
        // Set first evidence frame as selected if available
        if (result.data.evidence_frames && result.data.evidence_frames.length > 0) {
          setSelectedFrame(result.data.evidence_frames[0]);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching incident data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIncident = async () => {
    if (!incidentData?.incident?.id) return;

    try {
      setVerifying(true);
      
      const response = await fetch(`${API_BASE_URL}/incidents/${incidentData.incident.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'VERIFIED',
          notes: 'Incident manually verified by building owner via dashboard'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to verify incident: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setVerificationSuccess(true);
        // Update incident data
        setIncidentData(prev => ({
          ...prev,
          incident: {
            ...prev.incident,
            status: 'VERIFIED',
            acknowledged_at: new Date().toISOString()
          }
        }));
        
        // Call the onVerifyIncident callback to remove alert from active alerts
        if (onVerifyIncident && incidentData.incident.incident_number) {
          onVerifyIncident(incidentData.incident.incident_number);
        }
        
        console.log('✅ Incident verified successfully');
      } else {
        throw new Error('Verification failed');
      }
    } catch (err) {
      console.error('Error verifying incident:', err);
      alert(`Failed to verify incident: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="incident-detail-loading">
        <Activity size={48} className="loading-spinner" />
        <p>Loading incident details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="incident-detail-error">
        <AlertTriangle size={48} color="#fb4934" />
        <h3>Failed to Load Incident</h3>
        <p>{error}</p>
        <button onClick={onBack} className="btn-back-error">
          <ArrowLeft size={16} />
          Back to Building
        </button>
      </div>
    );
  }

  if (!incidentData) {
    return (
      <div className="incident-detail-error">
        <AlertTriangle size={48} color="#fabd2f" />
        <h3>No Incident Data Available</h3>
        <button onClick={onBack} className="btn-back-error">
          <ArrowLeft size={16} />
          Back to Building
        </button>
      </div>
    );
  }

  const { incident, building: incidentBuilding, camera, detections, evidence_frames } = incidentData;

  // Use building prop if provided, otherwise use incident building data
  const displayBuilding = building || incidentBuilding;

  // Calculate statistics from detections
  const stats = {
    totalDetections: detections?.length || 0,
    avgConfidence: incident?.confidence_score || 0,
    fireCount: detections?.reduce((sum, d) => sum + (d.fire_count || 0), 0) || 0,
    humanCount: detections?.reduce((sum, d) => sum + (d.human_count || 0), 0) || 0,
    evidenceFrameCount: evidence_frames?.length || 0
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return '#fb4934';
      case 'HIGH': return '#fe8019';
      case 'MEDIUM': return '#fabd2f';
      case 'LOW': return '#b8bb26';
      default: return '#8b928a';
    }
  };

  return (
    <div className="incident-detail-container">
      {/* Header */}
      <div className="incident-detail-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Back to Building</span>
        </button>

        <div className="incident-header-main">
          <div className="incident-header-icon">
            <Flame size={32} color="#fb4934" />
          </div>
          <div>
            <h1 className="incident-title">Fire Incident</h1>
            <p className="incident-number">{incident?.incident_number}</p>
          </div>
        </div>

        <div className="incident-header-actions">
          {incident?.dashboard_url && (
            <a 
              href={`/dispatch/${incident.incident_number}`}
              className="btn-dispatch-view"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} />
              <span>Full Dispatch View</span>
            </a>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="incident-detail-content">
        {/* Left Column - Incident Summary */}
        <div className="incident-left-column">
          {/* Status Card */}
          <div className="incident-card">
            <div className="card-header">
              <Activity size={16} />
              <span>Incident Status</span>
            </div>
            <div className="card-body">
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">Status</span>
                  <span className={`status-badge status-${incident?.status?.toLowerCase()}`}>
                    {incident?.status || 'UNKNOWN'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Severity</span>
                  <span 
                    className="severity-badge"
                    style={{ 
                      color: getSeverityColor(incident?.severity),
                      borderColor: getSeverityColor(incident?.severity)
                    }}
                  >
                    {incident?.severity || 'UNKNOWN'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Priority</span>
                  <span className="priority-badge">
                    {incident?.priority || 'MEDIUM'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Confidence</span>
                  <span className="confidence-value">
                    {((stats.avgConfidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="incident-time">
                <Clock size={14} />
                <span>Detected: {formatDate(incident?.detected_at)}</span>
              </div>

              {/* Verify Button */}
              {incident?.status === 'DETECTED' && !verificationSuccess && (
                <button 
                  className="btn-verify-incident"
                  onClick={handleVerifyIncident}
                  disabled={verifying}
                >
                  {verifying ? (
                    <>
                      <Activity size={16} className="loading-spinner" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Verify Incident</span>
                    </>
                  )}
                </button>
              )}

              {(verificationSuccess || incident?.status === 'VERIFIED') && (
                <div className="incident-verified-badge">
                  <CheckCircle size={16} />
                  <span>Incident Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Building Info Card */}
          <div className="incident-card">
            <div className="card-header">
              <Layers size={16} />
              <span>Building Information</span>
            </div>
            <div className="card-body">
              {displayBuilding ? (
                <>
                  <h3 className="building-name">{displayBuilding.name}</h3>
                  <p className="building-type">
                    {displayBuilding.building_type} · {displayBuilding.number_of_floors} Floors
                  </p>
                  
                  {displayBuilding.address && (
                    <div className="building-address">
                      <MapPin size={14} />
                      <span>
                        {displayBuilding.address.address_line_1}, {displayBuilding.address.locality}, {displayBuilding.address.city}
                      </span>
                    </div>
                  )}

                  {/* Safety Features */}
                  <div className="safety-features">
                    <h4>Safety Features</h4>
                    <div className="safety-grid">
                      {displayBuilding.has_fire_alarm && (
                        <span className="safety-badge">🚨 Fire Alarm</span>
                      )}
                      {displayBuilding.has_sprinkler && (
                        <span className="safety-badge">💧 Sprinklers</span>
                      )}
                      {displayBuilding.has_fire_extinguishers && (
                        <span className="safety-badge">🧯 Extinguishers</span>
                      )}
                      {displayBuilding.has_fire_exit && (
                        <span className="safety-badge">🚪 Fire Exits</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p className="no-data">Building information unavailable</p>
              )}
            </div>
          </div>

          {/* Camera Info Card */}
          {camera && (
            <div className="incident-card">
              <div className="card-header">
                <Camera size={16} />
                <span>Detection Source</span>
              </div>
              <div className="card-body">
                <div className="camera-info">
                  <h4>{camera.name || camera.camera_code}</h4>
                  <p className="camera-location">
                    {camera.floor_number && `Floor ${camera.floor_number}`}
                    {camera.room_name && ` · ${camera.room_name}`}
                  </p>
                  {camera.location_description && (
                    <p className="camera-description">{camera.location_description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Detection Statistics */}
          <div className="incident-card">
            <div className="card-header">
              <Activity size={16} />
              <span>Detection Statistics</span>
            </div>
            <div className="card-body">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.totalDetections}</div>
                  <div className="stat-label">Total Detections</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.fireCount}</div>
                  <div className="stat-label">Fire Detections</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.humanCount}</div>
                  <div className="stat-label">People Detected</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.evidenceFrameCount}</div>
                  <div className="stat-label">Evidence Frames</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Evidence Frames */}
        <div className="incident-right-column">
          <div className="incident-card evidence-card">
            <div className="card-header">
              <Camera size={16} />
              <span>Evidence Frames ({evidence_frames?.length || 0})</span>
            </div>
            
            {/* Selected Frame Preview */}
            {selectedFrame && (
              <div className="selected-frame-preview">
                <img 
                  src={`${API_BASE_URL}/incidents/${incident.incident_number}/frames/${selectedFrame.file_name.replace(/\D/g, '')}`}
                  alt={`Evidence frame ${selectedFrame.file_name}`}
                  className="preview-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-frame.png';
                    e.target.alt = 'Frame unavailable';
                  }}
                />
                <div className="frame-info">
                  <p className="frame-filename">{selectedFrame.file_name}</p>
                  <p className="frame-time">{formatDate(selectedFrame.captured_at)}</p>
                  {selectedFrame.description && (
                    <p className="frame-description">{selectedFrame.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Frame Grid */}
            <div className="evidence-frames-grid">
              {evidence_frames && evidence_frames.length > 0 ? (
                evidence_frames.map((frame, idx) => {
                  const frameNumber = frame.file_name.replace(/\D/g, '');
                  const imageUrl = `${API_BASE_URL}/incidents/${incident.incident_number}/frames/${frameNumber}`;
                  
                  return (
                    <div 
                      key={frame.id || idx}
                      className={`evidence-frame-thumb ${selectedFrame?.id === frame.id ? 'selected' : ''}`}
                      onClick={() => setSelectedFrame(frame)}
                    >
                      <img 
                        src={imageUrl}
                        alt={`Frame ${frameNumber}`}
                        onError={(e) => {
                          e.target.src = '/placeholder-frame.png';
                        }}
                      />
                      <div className="frame-thumb-overlay">
                        <span className="frame-number">#{frameNumber}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-evidence">
                  <AlertTriangle size={32} color="#8b928a" />
                  <p>No evidence frames available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
