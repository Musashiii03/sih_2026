import React, { useState } from 'react';
import { Video, Search, Flame, Droplets, Wind, ShieldCheck } from 'lucide-react';

export default function CameraList({ cameras, selectedCameraId, onSelectCamera }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCameras = cameras.filter(cam => 
    cam.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cam.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'FIRE': return <Flame size={12} color="var(--color-fire)" />;
      case 'WATER_LEAK': return <Droplets size={12} color="#3b82f6" />;
      case 'SMOKE': return <Wind size={12} color="var(--color-ember)" />;
      default: return <ShieldCheck size={12} color="var(--color-signal-green)" />;
    }
  };

  return (
    <aside className="sidebar-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Video size={16} />
          Facility Sectors
        </div>
        <span className="panel-badge">7 ZONES</span>
      </div>

      <div className="search-box">
        <div className="search-input-wrapper">
          <Search size={14} />
          <input 
            type="text" 
            placeholder="SEARCH SECTORS..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="camera-list">
        {filteredCameras.map((cam) => {
          const isSelected = cam.id === selectedCameraId;
          const isFire = cam.status === 'FIRE';

          return (
            <div 
              key={cam.id}
              className={`camera-card ${isSelected ? 'active' : ''} ${isFire ? 'has-fire' : ''}`}
              onClick={() => onSelectCamera(cam.id)}
            >
              <div className="camera-thumb">
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: isFire 
                    ? 'rgba(230, 57, 70, 0.15)' 
                    : 'var(--color-mist)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Video size={18} color={isFire ? 'var(--color-fire)' : 'var(--color-ink)'} />
                </div>
              </div>

              <div className="camera-info">
                <div className="camera-name-row">
                  <span className="camera-id">{cam.id}</span>
                  <span className={`camera-hazard-badge ${isFire ? 'fire' : 'normal'}`}>
                    {cam.status}
                  </span>
                </div>
                <div className="camera-location">{cam.location}</div>
                <div className="camera-meta">
                  <span>{cam.personnelCount} Personnel</span>
                  <span style={{ color: isFire ? 'var(--color-fire)' : 'inherit', fontWeight: 600 }}>
                    {cam.temp}°C {getStatusIcon(cam.status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
