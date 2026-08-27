import React from 'react';
import { Users, ArrowUpRight } from 'lucide-react';

export default function EntityBreakdown({ camera }) {
  const personnel = [
    { id: 'P-01', sector: 'Sector [MR]', distance: '3.4m', status: 'CRITICAL', color: 'critical' },
    { id: 'P-03', sector: 'Sector [BC]', distance: '5.8m', status: 'HIGH', color: 'high' },
    { id: 'P-02', sector: 'Sector [BR]', distance: '6.1m', status: 'HIGH', color: 'high' },
    { id: 'P-04', sector: 'Sector [TL]', distance: '11.2m', status: 'SAFE', color: 'normal' },
  ];

  return (
    <div className="entity-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Users size={16} />
          Target Entity Breakdown
        </div>
        <span className="panel-badge">
          4 PERSONNEL ACTIVE
        </span>
      </div>

      <div className="exit-recommendation">
        <div>
          <div className="exit-title">Recommended Evacuation Route</div>
          <div className="exit-gate">
            <span className="highlight-text">GATE NORTH [TL]</span>
          </div>
        </div>
        <ArrowUpRight size={20} color="var(--color-ink)" />
      </div>

      <div className="entity-list">
        {personnel.map((p) => (
          <div key={p.id} className="entity-card">
            <div className="entity-info">
              <span className="entity-id">{p.id}</span>
              <span className="entity-sector">{p.sector}</span>
            </div>

            <div className="entity-info">
              <span className={`entity-distance ${p.color}`}>
                {p.distance}
              </span>
              <span className={`camera-hazard-badge ${p.color === 'critical' ? 'fire' : 'normal'}`}>
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
