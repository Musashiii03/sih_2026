import React, { useRef, useEffect } from 'react';
import { Target } from 'lucide-react';

export default function SpatialRadar({ camera }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;

    const render = () => {
      angle += 0.03;
      const width = canvas.width = canvas.clientWidth || 280;
      const height = canvas.height = canvas.clientHeight || 280;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.42;

      // 1. Dark Radar Viewport
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, width, height);

      // 2. Concentric Radar Circles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1.0].forEach(rRatio => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * rRatio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 3x3 Sector Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY); ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius); ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Sector Labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px "Space Mono"';
      ctx.fillText('TL', centerX - radius * 0.7, centerY - radius * 0.7);
      ctx.fillText('TC', centerX - 6, centerY - radius * 0.85);
      ctx.fillText('TR', centerX + radius * 0.6, centerY - radius * 0.7);
      ctx.fillText('ML', centerX - radius * 0.85, centerY + 3);
      ctx.fillText('MR', centerX + radius * 0.7, centerY + 3);
      ctx.fillText('BL', centerX - radius * 0.7, centerY + radius * 0.75);
      ctx.fillText('BC', centerX - 6, centerY + radius * 0.85);
      ctx.fillText('BR', centerX + radius * 0.6, centerY + radius * 0.75);

      // 3. Radar Beam
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + 0.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(48, 168, 29, 0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      ctx.strokeStyle = '#30a81d';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 4. Target Nodes
      if (camera.status === 'FIRE') {
        const fireX = centerX + 15;
        const fireY = centerY - 10;

        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.arc(fireX, fireY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e63946';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fireX, fireY, 12 + Math.sin(angle * 4) * 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#e63946';
        ctx.font = 'bold 9px "Space Mono"';
        ctx.fillText('FIRE ORIGIN 685°C', fireX + 16, fireY + 3);
      }

      // Personnel Nodes
      const nodes = [
        { label: '3.4m', x: centerX + 55, y: centerY - 30, color: '#e63946' },
        { label: '5.8m', x: centerX - 25, y: centerY + 45, color: '#ff8400' },
        { label: '6.1m', x: centerX + 60, y: centerY + 55, color: '#30a81d' },
        { label: '11.2m', x: centerX - 60, y: centerY - 50, color: '#30a81d' },
      ];

      nodes.forEach(node => {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (camera.status === 'FIRE') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(centerX + 15, centerY - 10);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Space Mono"';
        ctx.fillText(node.label, node.x + 8, node.y + 3);
      });

      // Exit Node
      const exitX = centerX;
      const exitY = centerY - radius + 10;
      ctx.fillStyle = '#30a81d';
      ctx.fillRect(exitX - 14, exitY - 8, 28, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px "Space Mono"';
      ctx.fillText('EXIT TC', exitX - 12, exitY + 2);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [camera]);

  return (
    <div className="radar-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Target size={16} />
          Spatial Threat Matrix
        </div>
        <span className="panel-badge">2D LI-DAR • GRID 3x3</span>
      </div>

      <div className="radar-canvas-wrapper">
        <canvas ref={canvasRef} className="radar-canvas" />
      </div>
    </div>
  );
}
