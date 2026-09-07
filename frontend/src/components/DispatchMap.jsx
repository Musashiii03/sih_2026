import React, { useEffect, useRef } from 'react';

/**
 * DispatchMap — SVG warm-toned map with:
 * - incident pin (red)
 * - station pin (marigold)
 * - route line with ETA and actual distance from DB
 * - grid overlay
 */
export default function DispatchMap({ inc, dashboardData }) {
  // Fixed pin positions for visual clarity
  const incidentPin = { x: 170, y: 120 };
  const stationPin  = { x: 80,  y: 70  };

  // Get actual distance from dashboardData or fallback to inc
  const actualDistance = dashboardData?.building?.nearest_fire_station?.distance_km 
    ? `${dashboardData.building.nearest_fire_station.distance_km} km`
    : inc?.stationDist || '2.1 km';
  
  const eta = dashboardData?.building?.nearest_fire_station?.distance_km
    ? `~${Math.ceil(dashboardData.building.nearest_fire_station.distance_km * 3)} min`
    : inc?.stationEta || '~6 min';

  const stationName = dashboardData?.building?.nearest_fire_station?.fire_station_name || 'Station';
  const incidentLocation = dashboardData?.building?.name || 'Incident Site';

  return (
    <div className="map-placeholder" style={{ minHeight: 220, borderRadius: 10, border: '1px solid var(--border-strong)' }}>
      <div className="map-grid" />
      <svg
        viewBox="0 0 280 220"
        style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="incGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#E8593B" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="staGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#D9A441" stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="mapGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="6" markerHeight="6"
            refX="3" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#D9A441" opacity="0.8" />
          </marker>
        </defs>

        {/* ── Road network (warm-tinted) ── */}
        {/* Main roads */}
        <line x1="0" y1="80"  x2="280" y2="80"  stroke="rgba(217,164,65,0.15)" strokeWidth="6" />
        <line x1="0" y1="140" x2="280" y2="140" stroke="rgba(217,164,65,0.12)" strokeWidth="5" />
        <line x1="80" y1="0"  x2="80"  y2="220" stroke="rgba(217,164,65,0.15)" strokeWidth="6" />
        <line x1="170" y1="0" x2="170" y2="220" stroke="rgba(217,164,65,0.12)" strokeWidth="5" />

        {/* Secondary roads */}
        <line x1="0" y1="30"  x2="280" y2="30"  stroke="rgba(217,164,65,0.06)" strokeWidth="2" />
        <line x1="0" y1="180" x2="280" y2="180" stroke="rgba(217,164,65,0.06)" strokeWidth="2" />
        <line x1="125" y1="0" x2="125" y2="220" stroke="rgba(217,164,65,0.07)" strokeWidth="3" />
        <line x1="220" y1="0" x2="220" y2="220" stroke="rgba(217,164,65,0.06)" strokeWidth="2" />

        {/* ── City blocks ── */}
        {[
          [20,  40,  50, 30], [90, 40,  25, 30], [130, 40, 30, 30],
          [20,  95,  50, 35], [90, 95,  25, 35], [130, 95, 30, 35],
          [185, 95,  25, 35], [220, 40, 50, 30], [185, 40, 25, 30],
          [20, 150,  50, 20], [90, 150, 25, 20], [130,150, 30, 20],
          [185,150,  25, 20], [220,150, 50, 20],
          [20, 185,  50, 25], [90, 185, 80, 25], [185,185, 85, 25],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h}
            fill={i % 3 === 0 ? 'rgba(49,35,22,0.7)' : i % 3 === 1 ? 'rgba(37,26,17,0.7)' : 'rgba(44,30,18,0.7)'}
            stroke="rgba(217,164,65,0.08)" strokeWidth="0.5"
            rx="2"
          />
        ))}

        {/* ── Route line (dashed, animated) ── */}
        <line
          x1={stationPin.x} y1={stationPin.y}
          x2={incidentPin.x} y2={incidentPin.y}
          stroke="#D9A441"
          strokeWidth="2.5"
          strokeDasharray="8 4"
          opacity="0.8"
          markerEnd="url(#arrowhead)"
          filter="url(#mapGlow)"
        />

        {/* ETA label on route */}
        <text
          x={(stationPin.x + incidentPin.x) / 2 + 8}
          y={(stationPin.y + incidentPin.y) / 2 - 6}
          fill="#D9A441"
          fontSize="8"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
        >
          {eta}
        </text>
        <text
          x={(stationPin.x + incidentPin.x) / 2 + 8}
          y={(stationPin.y + incidentPin.y) / 2 + 5}
          fill="rgba(217,164,65,0.6)"
          fontSize="7"
          fontFamily="JetBrains Mono, monospace"
        >
          {actualDistance}
        </text>

        {/* ── Incident pin ── */}
        <ellipse
          cx={incidentPin.x} cy={incidentPin.y + 12}
          rx="20" ry="6" fill="url(#incGlow)"
        />
        {/* Pin body */}
        <path
          d={`M${incidentPin.x},${incidentPin.y - 20} 
              C${incidentPin.x - 10},${incidentPin.y - 20} ${incidentPin.x - 10},${incidentPin.y - 5}
              ${incidentPin.x},${incidentPin.y + 8}
              C${incidentPin.x + 10},${incidentPin.y - 5} ${incidentPin.x + 10},${incidentPin.y - 20}
              ${incidentPin.x},${incidentPin.y - 20}`}
          fill="#E8593B"
          filter="url(#mapGlow)"
        />
        <circle cx={incidentPin.x} cy={incidentPin.y - 12} r="4" fill="#fff" opacity="0.9" />
        <text
          x={incidentPin.x} y={incidentPin.y + 22}
          textAnchor="middle" fill="#E8593B"
          fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="700"
        >INCIDENT</text>

        {/* ── Station pin ── */}
        <ellipse
          cx={stationPin.x} cy={stationPin.y + 12}
          rx="18" ry="5" fill="url(#staGlow)"
        />
        <path
          d={`M${stationPin.x},${stationPin.y - 20}
              C${stationPin.x - 9},${stationPin.y - 20} ${stationPin.x - 9},${stationPin.y - 5}
              ${stationPin.x},${stationPin.y + 8}
              C${stationPin.x + 9},${stationPin.y - 5} ${stationPin.x + 9},${stationPin.y - 20}
              ${stationPin.x},${stationPin.y - 20}`}
          fill="#D9A441"
          filter="url(#mapGlow)"
        />
        <circle cx={stationPin.x} cy={stationPin.y - 12} r="3.5" fill="#1B120C" opacity="0.9" />
        <text
          x={stationPin.x} y={stationPin.y + 22}
          textAnchor="middle" fill="#D9A441"
          fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="700"
        >STATION</text>

        {/* ── Compass ── */}
        <text x="258" y="16" fill="rgba(245,235,221,0.3)" fontSize="8"
          fontFamily="JetBrains Mono, monospace" fontWeight="700">N</text>
        <line x1="262" y1="18" x2="262" y2="28" stroke="rgba(245,235,221,0.2)" strokeWidth="1" />

        {/* ── Scale bar ── */}
        <line x1="20" y1="208" x2="60" y2="208" stroke="rgba(245,235,221,0.25)" strokeWidth="1.5" />
        <text x="28" y="216" fill="rgba(245,235,221,0.3)" fontSize="7"
          fontFamily="JetBrains Mono, monospace">1 km</text>

        {/* ── Coordinate info (if available from DB) ── */}
        {dashboardData?.building?.address?.latitude && (
          <g>
            <text x="10" y="12" fill="rgba(245,235,221,0.25)" fontSize="6"
              fontFamily="JetBrains Mono, monospace">
              INCIDENT: {dashboardData.building.address.latitude.toFixed(4)}°, {dashboardData.building.address.longitude.toFixed(4)}°
            </text>
          </g>
        )}
        {dashboardData?.building?.nearest_fire_station?.latitude && (
          <g>
            <text x="10" y="20" fill="rgba(245,235,221,0.25)" fontSize="6"
              fontFamily="JetBrains Mono, monospace">
              STATION: {dashboardData.building.nearest_fire_station.latitude.toFixed(4)}°, {dashboardData.building.nearest_fire_station.longitude.toFixed(4)}°
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
