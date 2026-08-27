import React, { useState } from 'react';
import { Settings, Save, Smartphone, Video, Server } from 'lucide-react';

export default function CameraConfigView() {
  const [yamlConfig, setYamlConfig] = useState(`# Atmarakshak Multi-Camera Stream Configuration (cameras.yaml)
# Supports RTSP streams, Laptop webcams (0), and Mobile Phone Wi-Fi CCTV

cameras:
  - id: CAM-01
    name: Main Lobby & Security Turnstiles
    source: 0
    fps_limit: 30
    enabled: true
    sector: Sector 1A

  - id: CAM-03
    name: Warehouse A (Hazard Epicenter)
    source: "http://192.168.1.105:8080/video"
    fps_limit: 24
    enabled: true
    sector: Sector 4C

  - id: CAM-04
    name: Server Infrastructure Vault
    source: "rtsp://admin:secret123@192.168.1.4:554/stream1"
    fps_limit: 30
    enabled: true
    sector: Sector 1B

  - id: CAM-05
    name: Cafeteria Industrial Kitchen
    source: "rtsp://admin:secret123@192.168.1.5:554/stream1"
    fps_limit: 24
    enabled: true
    sector: Sector 2A

  - id: CAM-07
    name: Chemical Synthesis Lab
    source: "http://192.168.1.108:8080/video"
    fps_limit: 30
    enabled: true
    sector: Sector 3A
`);

  const [savedAlert, setSavedAlert] = useState(false);

  const handleSave = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="subview-container">
      <div className="subview-header">
        <div>
          <div className="subview-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={24} />
            Multi-Camera Stream Configuration (<span className="highlight-text">cameras.yaml</span>)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: '#666666', marginTop: 4, textTransform: 'uppercase' }}>
            Declarative Video Ingestion Endpoints · Webcams · Wi-Fi Smartphone CCTV · RTSP NVRs
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {savedAlert && (
            <span style={{ color: 'var(--color-forest)', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
              ✓ YAML SAVED & RELOADED
            </span>
          )}
          <button className="action-btn" onClick={handleSave}>
            <Save size={14} />
            SAVE YAML CONFIG
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#666666' }}>
            service_runner.py Stream Ingestion Engine YAML
          </div>
          <textarea 
            value={yamlConfig}
            onChange={(e) => setYamlConfig(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--color-canvas)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              padding: 16,
              borderRadius: 'var(--radius-cards)',
              border: '1px solid var(--color-hairline)',
              outline: 'none',
              resize: 'none',
              lineHeight: '1.6'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#666666' }}>
            Supported Input Protocols
          </div>

          <div className="entity-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
              <Video size={16} /> Laptop Built-in Webcam
            </div>
            <div style={{ fontSize: 12, color: '#555555' }}>
              Direct integer index (<code style={{ background: 'var(--color-mist)', padding: '2px 6px', borderRadius: 4 }}>source: 0</code>). USB 1080p stream.
            </div>
          </div>

          <div className="entity-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
              <Smartphone size={16} /> Wi-Fi Smartphone CCTV
            </div>
            <div style={{ fontSize: 12, color: '#555555' }}>
              HTTP stream URL (<code style={{ background: 'var(--color-mist)', padding: '2px 6px', borderRadius: 4 }}>http://&lt;PHONE_IP&gt;:8080/video</code>).
            </div>
          </div>

          <div className="entity-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
              <Server size={16} /> Enterprise RTSP NVR
            </div>
            <div style={{ fontSize: 12, color: '#555555' }}>
              Commercial RTSP URL (<code style={{ background: 'var(--color-mist)', padding: '2px 6px', borderRadius: 4 }}>rtsp://user:pass@ip:554/stream</code>).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
