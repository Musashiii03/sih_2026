import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Cpu } from 'lucide-react';

export default function VideoFeed({ camera, soundEnabled }) {
  const canvasRef = useRef(null);
  const [visionMode, setVisionMode] = useState('RGB');
  const [verifiedFrames, setVerifiedFrames] = useState(5);
  const [fps, setFps] = useState(24);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let tick = 0;

    const render = () => {
      tick++;
      const width = canvas.width = canvas.clientWidth || 800;
      const height = canvas.height = canvas.clientHeight || 500;

      // 1. Canvas Background
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      if (visionMode === 'FLIR') {
        const gradient = ctx.createRadialGradient(
          width * 0.45, height * 0.4, 20,
          width * 0.45, height * 0.4, 220
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, '#e63946');
        gradient.addColorStop(0.5, '#ff8400');
        gradient.addColorStop(0.8, '#3b82f6');
        gradient.addColorStop(1, '#070a12');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      } else if (visionMode === 'LIDAR') {
        ctx.fillStyle = '#050810';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        ctx.fillStyle = '#30a81d';
        for (let i = 0; i < 80; i++) {
          const px = (Math.sin(tick * 0.02 + i) * 0.4 + 0.5) * width;
          const py = (Math.cos(tick * 0.015 + i * 2) * 0.4 + 0.5) * height;
          ctx.fillRect(px, py, 3, 3);
        }
      } else {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * 0.2, 0); ctx.lineTo(width * 0.2, height);
        ctx.moveTo(width * 0.8, 0); ctx.lineTo(width * 0.8, height);
        ctx.moveTo(0, height * 0.7); ctx.lineTo(width, height * 0.7);
        ctx.stroke();
      }

      // 2. YOLO Bounding Boxes
      if (camera.status === 'FIRE') {
        const boxX = width * 0.35 + Math.sin(tick * 0.05) * 4;
        const boxY = height * 0.25;
        const boxW = width * 0.3;
        const boxH = height * 0.35;

        ctx.strokeStyle = '#e63946';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = 'rgba(230, 57, 70, 0.2)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = '#e63946';
        ctx.fillRect(boxX, boxY - 24, 180, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Space Mono"';
        ctx.fillText('FLAMEOVER [C] • 99.5%', boxX + 8, boxY - 8);

        ctx.fillStyle = '#e63946';
        ctx.font = 'bold 14px "Schibsted Grotesk"';
        ctx.fillText('685°C HAZARD EPICENTER', boxX + 10, boxY + boxH - 12);
      }

      // Tracked Personnel Boxes (Signal Green Bounding Boxes)
      const personnelBoxes = [
        { label: 'P-04 [TL] • 11.2m', x: width * 0.15, y: height * 0.2, w: width * 0.12, h: height * 0.5 },
        { label: 'P-01 [MR] • 3.4m', x: width * 0.7, y: height * 0.35, w: width * 0.1, h: height * 0.45 },
        { label: 'P-02 [BR] • 6.1m', x: width * 0.82, y: height * 0.55, w: width * 0.09, h: height * 0.35 },
      ];

      personnelBoxes.forEach(p => {
        ctx.strokeStyle = '#30a81d';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#30a81d';
        ctx.fillRect(p.x, p.y - 20, 140, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Space Mono"';
        ctx.fillText(p.label, p.x + 6, p.y - 6);
      });

      // Camera reticle crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 18, centerY); ctx.lineTo(centerX + 18, centerY);
      ctx.moveTo(centerX, centerY - 18); ctx.lineTo(centerX, centerY + 18);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [camera, visionMode]);

  return (
    <div className="feed-panel" style={{ flex: 1 }}>
      <div className="feed-header">
        <div className="feed-title-section">
          <span className="live-badge">
            LIVE {fps}FPS
          </span>
          <span className="feed-name">
            {camera.id} // {camera.location}
          </span>
        </div>

        <div className="feed-controls">
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${visionMode === 'RGB' ? 'active' : ''}`}
              onClick={() => setVisionMode('RGB')}
            >
              RGB
            </button>
            <button 
              className={`mode-btn ${visionMode === 'FLIR' ? 'active' : ''}`}
              onClick={() => setVisionMode('FLIR')}
            >
              FLIR
            </button>
            <button 
              className={`mode-btn ${visionMode === 'LIDAR' ? 'active' : ''}`}
              onClick={() => setVisionMode('LIDAR')}
            >
              LiDAR
            </button>
          </div>

          <button className="action-btn secondary" style={{ width: 34, padding: 0 }} title="Maximize Stream">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <div className="video-container">
        <canvas ref={canvasRef} className="canvas-stream" />
      </div>

      <div className="temporal-hud-bar">
        <div className="temporal-info">
          <Cpu size={16} />
          <span className="temporal-label">
            TEMPORAL FILTER (5/5 FRAMES)
          </span>
          <div className="frame-pills">
            {[1, 2, 3, 4, 5].map((f) => (
              <div 
                key={f} 
                className={`frame-pill ${f <= verifiedFrames ? (camera.status === 'FIRE' ? 'filled fire' : 'filled') : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="temporal-status-text">
          {camera.status === 'FIRE' ? 'CONFIRMED ALERT FIRED' : 'STREAM SECURE'}
        </div>
      </div>
    </div>
  );
}
