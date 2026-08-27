import React, { useState } from 'react';
import { Database, Search, Download, CheckCircle, ShieldAlert } from 'lucide-react';

export default function IncidentDatabaseView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  const [incidents, setIncidents] = useState([
    {
      id: 'ALERT_CAM-03_FIRE_2026-08-27_234501',
      cameraId: 'CAM-03',
      cameraName: 'Warehouse A (Hazard Epicenter)',
      hazardClass: 'Fire',
      severity: 'CRITICAL',
      confidence: 99.5,
      zone: 'Sector 4C',
      areaCoverage: '14.2%',
      timestamp: '2026-08-27 23:45:01',
      isResolved: false
    },
    {
      id: 'ALERT_CAM-04_WATER_2026-08-27_221015',
      cameraId: 'CAM-04',
      cameraName: 'Server Infrastructure Vault',
      hazardClass: 'Water_Leakage',
      severity: 'MODERATE',
      confidence: 98.2,
      zone: 'Sector 1B',
      areaCoverage: '5.8%',
      timestamp: '2026-08-27 22:10:15',
      isResolved: true
    },
    {
      id: 'ALERT_CAM-07_SMOKE_2026-08-27_201540',
      cameraId: 'CAM-07',
      cameraName: 'Chemical Synthesis Lab',
      hazardClass: 'Smoke',
      severity: 'HIGH',
      confidence: 94.7,
      zone: 'Sector 3A',
      areaCoverage: '8.4%',
      timestamp: '2026-08-27 20:15:40',
      isResolved: true
    },
    {
      id: 'ALERT_CAM-03_FIRE_2026-08-27_180412',
      cameraId: 'CAM-03',
      cameraName: 'Warehouse A',
      hazardClass: 'Fire',
      severity: 'CRITICAL',
      confidence: 99.2,
      zone: 'Sector 4C',
      areaCoverage: '11.0%',
      timestamp: '2026-08-27 18:04:12',
      isResolved: true
    }
  ]);

  const toggleResolve = (id) => {
    setIncidents(incidents.map(inc => 
      inc.id === id ? { ...inc, isResolved: !inc.isResolved } : inc
    ));
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.cameraName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'ALL' || inc.hazardClass === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="subview-container">
      <div className="subview-header">
        <div>
          <div className="subview-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={24} />
            SQLite Incident Log DB (<span className="highlight-text">incidents.db</span>)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: '#666666', marginTop: 4, textTransform: 'uppercase' }}>
            Forensic Evidence Logs · Temporal Verification History · Audit Telemetry
          </div>
        </div>

        <button className="action-btn">
          <Download size={14} />
          EXPORT FORENSIC CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ width: 340 }}>
          <Search size={14} />
          <input 
            type="text"
            placeholder="SEARCH INCIDENT ID OR CAMERA..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="nav-tabs">
          {['ALL', 'Fire', 'Smoke', 'Water_Leakage'].map(cls => (
            <button 
              key={cls}
              className={`nav-tab ${filterClass === cls ? 'active' : ''}`}
              onClick={() => setFilterClass(cls)}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Incident Tracking ID</th>
              <th>Camera Feed</th>
              <th>Hazard Class</th>
              <th>Severity</th>
              <th>YOLO Score</th>
              <th>Quadrant</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.map(inc => (
              <tr key={inc.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
                  {inc.id}
                </td>
                <td>{inc.cameraId} — {inc.cameraName}</td>
                <td>
                  <span className={`camera-hazard-badge ${inc.hazardClass === 'Fire' ? 'fire' : 'normal'}`}>
                    {inc.hazardClass}
                  </span>
                </td>
                <td style={{ 
                  color: inc.severity === 'CRITICAL' ? 'var(--color-fire)' : inc.severity === 'HIGH' ? 'var(--color-ember)' : 'var(--color-ink)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700 
                }}>
                  {inc.severity}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{inc.confidence}%</td>
                <td>{inc.zone} ({inc.areaCoverage})</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{inc.timestamp}</td>
                <td>
                  {inc.isResolved ? (
                    <span style={{ color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                      <CheckCircle size={14} /> RESOLVED
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-fire)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                      <ShieldAlert size={14} /> UNRESOLVED
                    </span>
                  )}
                </td>
                <td>
                  <button 
                    className="action-btn secondary" 
                    onClick={() => toggleResolve(inc.id)}
                    style={{ fontSize: 11, height: 30, padding: '0 10px' }}
                  >
                    {inc.isResolved ? 'Re-open' : 'Resolve'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
