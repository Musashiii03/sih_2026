import React from 'react';
import { Cpu, CheckCircle2, Layers, Zap } from 'lucide-react';

export default function ModelMetricsView() {
  const metrics = [
    { name: 'mAP@50 (Mean Average Precision)', score: '99.5%', impact: 'Exceeds initial >90% mAP benchmark by +9.5%', color: 'var(--color-signal-green)' },
    { name: 'Precision (Zero False Alarms)', score: '99.6%', impact: 'Total suppression of coffee steam & glare', color: 'var(--color-ink)' },
    { name: 'Recall (Hazard Safety Catch Rate)', score: '99.3%', impact: 'Guarantees true Fire/Smoke/Water events caught', color: 'var(--color-ink)' },
    { name: 'mAP@50-95 (Strict IoU Threshold)', score: '95.5%', impact: 'Exceptional bounding box localization accuracy', color: 'var(--color-ink)' },
    { name: 'Classification Loss (cls_loss)', score: '0.180', impact: 'Reduced by >81% (from initial 0.964)', color: 'var(--color-forest)' },
    { name: 'Bounding Box Loss (box_loss)', score: '0.280', impact: 'Reduced by >75% (from initial 1.146)', color: 'var(--color-fire)' }
  ];

  const datasetSpecs = [
    { classId: 'Class 0: Fire', count: '2,000 Images', label: 'Annotated Boxes', details: 'Indoor flames, socket sparks, trash bin fires across day/night vision' },
    { classId: 'Class 1: Smoke', count: '2,000 Images', label: 'Annotated Boxes', details: 'Thin wisps, smoldering clouds, ceiling smoke accumulation' },
    { classId: 'Class 2: Water_Leakage', count: '1,500 Images', label: 'Annotated Boxes', details: 'Surface puddles on tiles/carpets, ceiling drops, pipe bursts' },
    { classId: 'Class 3: Hard Negatives', count: '1,500 Images', label: 'Unannotated Backgrounds', details: 'Coffee steam, kettle vapors, floor reflections, window glare' },
  ];

  return (
    <div className="subview-container">
      <div className="subview-header">
        <div>
          <div className="subview-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={24} />
            YOLOv8x Fine-Tuned Vision Model Specs (<span className="highlight-text">Phase 1</span>)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: '#666666', marginTop: 4, textTransform: 'uppercase' }}>
            68.2M Parameters · 258.6 GFLOPs · Multi-Frame Temporal Verification Engine
          </div>
        </div>

        <div className="status-pill online">
          <Zap size={14} />
          ONNX Runtime GPU (CUDA 12.1 + PyTorch 2.5.1)
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((m, idx) => (
          <div key={idx} className="metric-chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#666666' }}>
                {m.name}
              </span>
              <CheckCircle2 size={16} color={m.color} />
            </div>
            <div style={{ fontFamily: 'var(--font-swizzy)', fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>
              {m.score}
            </div>
            <div style={{ fontSize: 12, color: '#555555' }}>
              {m.impact}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontFamily: 'var(--font-swizzy)', fontSize: 20, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} />
          7,000-Image Indoor Hazard Dataset Architecture
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Sample Count</th>
              <th>Annotation Format</th>
              <th>Covered Features & Edge Cases</th>
            </tr>
          </thead>
          <tbody>
            {datasetSpecs.map((ds, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{ds.classId}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{ds.count}</td>
                <td>
                  <span className="brand-badge">{ds.label}</span>
                </td>
                <td style={{ color: '#555555' }}>{ds.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
