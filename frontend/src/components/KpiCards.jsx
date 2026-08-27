import React from 'react';
import { Camera, Flame, Users, Cpu } from 'lucide-react';

export default function KpiCards({ kpiData }) {
  return (
    <div className="kpi-grid">
      {/* Card 1: Active Feeds */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon-wrapper">
            <Camera size={18} />
          </div>
          <span className="kpi-trend">+0%</span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-value">
            {kpiData.camerasActive}
          </span>
        </div>
        <div className="kpi-label">CAMERAS ACTIVE</div>
        <div className="kpi-subtext">7/7 RTSP Feeds Online</div>
      </div>

      {/* Card 2: Hazard Outbreaks */}
      <div className="kpi-card" style={{ borderColor: 'rgba(230, 57, 70, 0.4)' }}>
        <div className="kpi-header">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(230, 57, 70, 0.1)', color: 'var(--color-fire)', borderColor: 'var(--color-fire)' }}>
            <Flame size={18} />
          </div>
          <span className="kpi-trend highlight" style={{ background: 'var(--color-fire)', color: '#fff' }}>
            +14%
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-value" style={{ color: 'var(--color-fire)' }}>
            {kpiData.hazardsCount}
          </span>
        </div>
        <div className="kpi-label">HAZARD OUTBREAKS</div>
        <div className="kpi-subtext">1 Flashover · 1 Smoke Plume</div>
      </div>

      {/* Card 3: Personnel at Risk */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon-wrapper">
            <Users size={18} />
          </div>
          <span className="kpi-trend highlight">
            -4%
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-value">
            {kpiData.personnelAtRisk}
          </span>
        </div>
        <div className="kpi-label">PERSONNEL AT RISK</div>
        <div className="kpi-subtext">11 Total Tracked</div>
      </div>

      {/* Card 4: YOLO Accuracy Score */}
      <div className="kpi-card">
        <div className="kpi-header">
          <div className="kpi-icon-wrapper">
            <Cpu size={18} />
          </div>
          <span className="kpi-trend highlight">
            +1.5%
          </span>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-value">
            99.5%
          </span>
        </div>
        <div className="kpi-label">YOLOv8x SPATIAL SCORE</div>
        <div className="kpi-subtext">±0.2m Spatial Accuracy</div>
      </div>
    </div>
  );
}
