import React from 'react';

/**
 * IsometricHologram — data-driven SVG isometric room view
 *
 * Props:
 *   hologramData  — the hologram_data JSON from the backend (or null → renders placeholder)
 *   humanCount    — fallback person count when hologramData is null
 */

// ── Coordinate mapping ────────────────────────────────────────────────────
// We project 3D room coords (x, y, z) in meters → 2D SVG screen coords.
// Isometric projection: screen_x = cx + (x - y) * scale_h
//                       screen_y = cy + (x + y) * scale_v - z * scale_z
const SVG_W = 400, SVG_H = 260;
const CX = 200, CY = 130;         // vanishing centre
const SH = 22, SV = 11, SZ = 20; // scale factors (px per metre)

function iso(x, y, z, roomW = 8, roomD = 6) {
  // Shift so room centre is at origin
  const rx = x - roomW / 2;
  const ry = y - roomD / 2;
  return {
    sx: CX + (rx - ry) * SH,
    sy: CY + (rx + ry) * SV - z * SZ,
  };
}

// ── Furniture block (isometric box) ───────────────────────────────────────
function FurnitureBox({ item, roomW, roomD }) {
  const { x, y, z, width_m: w = 0.6, depth_m: d = 0.6, height_m: h = 0.7, type } = item;
  const hw = w / 2, hd = d / 2;
  // 8 corners
  const corners = [
    iso(x - hw, y - hd, z,     roomW, roomD),
    iso(x + hw, y - hd, z,     roomW, roomD),
    iso(x + hw, y + hd, z,     roomW, roomD),
    iso(x - hw, y + hd, z,     roomW, roomD),
    iso(x - hw, y - hd, z + h, roomW, roomD),
    iso(x + hw, y - hd, z + h, roomW, roomD),
    iso(x + hw, y + hd, z + h, roomW, roomD),
    iso(x - hw, y + hd, z + h, roomW, roomD),
  ];
  const pt = c => `${c.sx},${c.sy}`;
  return (
    <g opacity="0.85">
      {/* Top face */}
      <polygon points={`${pt(corners[4])} ${pt(corners[5])} ${pt(corners[6])} ${pt(corners[7])}`}
        fill="rgba(49,35,22,0.9)" stroke="rgba(217,164,65,0.35)" strokeWidth="0.8" />
      {/* Left face */}
      <polygon points={`${pt(corners[0])} ${pt(corners[3])} ${pt(corners[7])} ${pt(corners[4])}`}
        fill="rgba(37,26,17,0.9)" stroke="rgba(217,164,65,0.25)" strokeWidth="0.8" />
      {/* Right face */}
      <polygon points={`${pt(corners[1])} ${pt(corners[2])} ${pt(corners[6])} ${pt(corners[5])}`}
        fill="rgba(44,30,18,0.9)" stroke="rgba(217,164,65,0.2)" strokeWidth="0.8" />
      {/* Label */}
      <text x={corners[6].sx + 3} y={corners[6].sy - 2}
        fill="rgba(179,157,133,0.7)" fontSize="7" fontFamily="JetBrains Mono,monospace">
        {type}
      </text>
    </g>
  );
}

// ── Person marker ─────────────────────────────────────────────────────────
function PersonMarker({ person, roomW, roomD, index }) {
  const { x, y, z = 0, state = 'stationary', person_id } = person;
  const pos = iso(x, y, z, roomW, roomD);
  const col = state === 'moving' ? '#DFA23D' : '#8FAF3E';
  return (
    <g filter="url(#isoGlow)">
      {/* Shadow */}
      <ellipse cx={pos.sx} cy={pos.sy + 5} rx="5" ry="2.5" fill={`${col}40`} />
      {/* Body line */}
      <line x1={pos.sx} y1={pos.sy} x2={pos.sx} y2={pos.sy - 10}
        stroke={col} strokeWidth="2.5" strokeLinecap="round" />
      {/* Head */}
      <circle cx={pos.sx} cy={pos.sy - 14} r="4.5" fill={col} opacity="0.9" />
      {/* Label */}
      <text x={pos.sx + 7} y={pos.sy - 10} fill={col} fontSize="7"
        fontFamily="JetBrains Mono,monospace" fontWeight="700">
        {person_id || `P${index + 1}`}
      </text>
    </g>
  );
}

// ── Fire zone ─────────────────────────────────────────────────────────────
function FireZone({ source, spread, roomW, roomD }) {
  const s = iso(source.x, source.y, source.z ?? 0, roomW, roomD);
  return (
    <g>
      {/* Glow ellipse */}
      <ellipse cx={s.sx} cy={s.sy} rx="38" ry="20"
        fill="url(#fireGrad)" filter="url(#isoGlow)" />
      {/* Spread points */}
      {(spread || []).map((sp, i) => {
        const p = iso(sp.x, sp.y, sp.z ?? 0, roomW, roomD);
        return (
          <ellipse key={i} cx={p.sx} cy={p.sy} rx={12 + i * 4} ry={7 + i * 2}
            fill="#DFA23D" opacity={0.35 - i * 0.08} filter="url(#isoGlow)" />
        );
      })}
      {/* Flame markers */}
      {[0, 1, 2].map(i => (
        <ellipse key={i} cx={s.sx + (i - 1) * 9} cy={s.sy - i * 3} rx="4" ry="7"
          fill={i === 1 ? '#DFA23D' : '#E8593B'} opacity="0.85" filter="url(#isoGlow)" />
      ))}
      {/* Smoke plume (ellipse going upward) */}
      <ellipse cx={s.sx} cy={s.sy - 22} rx="18" ry="10"
        fill="rgba(120,90,60,0.35)" filter="url(#isoGlow)" />
      {/* Zone ring */}
      <ellipse cx={s.sx} cy={s.sy} rx="40" ry="22"
        fill="none" stroke="#E8593B" strokeWidth="1.2"
        strokeDasharray="5 3" opacity="0.6" />
      <text x={s.sx} y={s.sy - 1} textAnchor="middle"
        fill="#E8593B" fontSize="8" fontFamily="JetBrains Mono,monospace" fontWeight="700" opacity="0.9">
        FIRE
      </text>
    </g>
  );
}

// ── Room shell ────────────────────────────────────────────────────────────
function RoomShell({ roomW, roomD }) {
  // Four floor corners + top edge walls
  const fl = [
    iso(0,    0,    0, roomW, roomD),
    iso(roomW,0,    0, roomW, roomD),
    iso(roomW,roomD,0, roomW, roomD),
    iso(0,    roomD,0, roomW, roomD),
  ];
  const wh = 2.6; // wall height
  const wl = [
    iso(0,    0,    wh, roomW, roomD),
    iso(roomW,0,    wh, roomW, roomD),
    iso(roomW,roomD,wh, roomW, roomD),
    iso(0,    roomD,wh, roomW, roomD),
  ];
  const pt = c => `${c.sx},${c.sy}`;
  return (
    <g>
      {/* Floor */}
      <polygon points={[fl[0],fl[1],fl[2],fl[3]].map(pt).join(' ')}
        fill="url(#floorGrad)" stroke="rgba(217,164,65,0.18)" strokeWidth="0.8" />
      {/* Back-left wall */}
      <polygon points={`${pt(fl[0])} ${pt(fl[1])} ${pt(wl[1])} ${pt(wl[0])}`}
        fill="rgba(37,26,17,0.6)" stroke="rgba(217,164,65,0.12)" strokeWidth="0.8" />
      {/* Back-right wall */}
      <polygon points={`${pt(fl[1])} ${pt(fl[2])} ${pt(wl[2])} ${pt(wl[1])}`}
        fill="rgba(31,21,13,0.6)" stroke="rgba(217,164,65,0.12)" strokeWidth="0.8" />
      {/* Grid lines on floor */}
      {[1, 2, 3, 4, 5, 6, 7].filter(v => v < roomW).map(v => {
        const a = iso(v, 0, 0, roomW, roomD);
        const b = iso(v, roomD, 0, roomW, roomD);
        return <line key={`gx${v}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke="rgba(217,164,65,0.07)" strokeWidth="0.6" />;
      })}
      {[1, 2, 3, 4, 5].filter(v => v < roomD).map(v => {
        const a = iso(0, v, 0, roomW, roomD);
        const b = iso(roomW, v, 0, roomW, roomD);
        return <line key={`gy${v}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke="rgba(217,164,65,0.07)" strokeWidth="0.6" />;
      })}
    </g>
  );
}

// ── Exit marker ───────────────────────────────────────────────────────────
function ExitMarker({ roomW, roomD }) {
  const pos = iso(0, roomD / 2, 0, roomW, roomD);
  return (
    <g>
      <rect x={pos.sx - 12} y={pos.sy - 8} width="24" height="14"
        fill="#8FAF3E" rx="2" opacity="0.85" />
      <text x={pos.sx} y={pos.sy + 2} textAnchor="middle"
        fill="#1B120C" fontSize="7" fontFamily="JetBrains Mono,monospace" fontWeight="700">
        EXIT
      </text>
    </g>
  );
}

// ── Placeholder (no data yet) ─────────────────────────────────────────────
function HologramPlaceholder({ humanCount }) {
  const persons = Array.from({ length: humanCount }, (_, i) => ({
    person_id: `P${i + 1}`,
    x: 1.5 + i * 1.2,
    y: 2.5 + (i % 2) * 0.8,
    z: 0,
  }));
  const mockFire = { source: { x: 4.5, y: 4.2, z: 0.3 }, spread: [], estimated_area_m2: 0.3 };
  const mockFurniture = [
    { x: 2.2, y: 2.2, z: 0, width_m: 1.2, depth_m: 0.6, height_m: 0.75, type: 'desk' },
    { x: 6.0, y: 3.0, z: 0, width_m: 0.5, depth_m: 0.1, height_m: 0.55, type: 'tv' },
  ];
  return (
    <HologramSvg
      roomW={8} roomD={6} roomH={3}
      fireSrc={mockFire.source} fireSpread={mockFire.spread}
      persons={persons} furniture={mockFurniture}
      fireAreaM2={mockFire.estimated_area_m2}
    />
  );
}

// ── Main SVG renderer ─────────────────────────────────────────────────────
function HologramSvg({ roomW, roomD, fireSrc, fireSpread, persons, furniture, fireAreaM2 }) {
  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ width: '100%', height: '100%' }}
      preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="fireGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#E8593B" stopOpacity="0.75" />
          <stop offset="60%"  stopColor="#DFA23D" stopOpacity="0.30" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="floorGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stopColor="#3A2010" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#1A0C06" stopOpacity="0.7" />
        </radialGradient>
        <filter id="isoGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Room */}
      <RoomShell roomW={roomW} roomD={roomD} />

      {/* Furniture (behind fire + people) */}
      {furniture.map((item, i) => (
        <FurnitureBox key={i} item={item} roomW={roomW} roomD={roomD} />
      ))}

      {/* Fire zone */}
      {fireSrc && <FireZone source={fireSrc} spread={fireSpread} roomW={roomW} roomD={roomD} />}

      {/* Persons */}
      {persons.map((p, i) => (
        <PersonMarker key={i} person={p} roomW={roomW} roomD={roomD} index={i} />
      ))}

      {/* Exit */}
      <ExitMarker roomW={roomW} roomD={roomD} />

      {/* Camera icon */}
      <text x="378" y="18" fill="rgba(217,164,65,0.55)" fontSize="7"
        fontFamily="JetBrains Mono,monospace" textAnchor="end">
        CAM VIEW
      </text>
      <circle cx="386" cy="12" r="5" fill="none" stroke="rgba(217,164,65,0.45)" strokeWidth="1" />
      <circle cx="386" cy="12" r="2" fill="rgba(232,89,59,0.8)" />

      {/* Legend */}
      <g transform={`translate(8,${SVG_H - 22})`}>
        <circle cx="4" cy="4" r="4" fill="#E8593B" opacity="0.9" />
        <text x="12" y="8" fill="rgba(245,235,221,0.5)" fontSize="7" fontFamily="JetBrains Mono,monospace">Fire Zone</text>
        <circle cx="70" cy="4" r="4" fill="#8FAF3E" opacity="0.9" />
        <text x="78" y="8" fill="rgba(245,235,221,0.5)" fontSize="7" fontFamily="JetBrains Mono,monospace">Person</text>
        <circle cx="130" cy="4" r="4" fill="#DFA23D" opacity="0.9" />
        <text x="138" y="8" fill="rgba(245,235,221,0.5)" fontSize="7" fontFamily="JetBrains Mono,monospace">Object</text>
        {fireAreaM2 > 0 && (
          <text x="190" y="8" fill="rgba(232,89,59,0.7)" fontSize="7" fontFamily="JetBrains Mono,monospace">
            ~{fireAreaM2}m²
          </text>
        )}
      </g>

      {/* Room dims */}
      <text x={SVG_W - 6} y={SVG_H - 6} textAnchor="end"
        fill="rgba(179,157,133,0.35)" fontSize="7" fontFamily="JetBrains Mono,monospace">
        {roomW}m × {roomD}m × 3m
      </text>
    </svg>
  );
}

// ── Exported component ────────────────────────────────────────────────────
export default function IsometricHologram({ hologramData, humanCount = 0 }) {
  const hasData = hologramData && hologramData.fire && hologramData.room_geometry;

  return (
    <div className="hologram-wrap" style={{ minHeight: 220 }}>
      <div className="hologram-grid" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {hasData ? (
          <HologramSvg
            roomW={hologramData.room_geometry.width_m}
            roomD={hologramData.room_geometry.depth_m}
            roomH={hologramData.room_geometry.height_m}
            fireSrc={hologramData.fire?.source}
            fireSpread={hologramData.fire?.spread || []}
            persons={hologramData.persons || []}
            furniture={hologramData.furniture || []}
            fireAreaM2={hologramData.fire?.estimated_area_m2 ?? 0}
          />
        ) : (
          <HologramPlaceholder humanCount={humanCount} />
        )}
      </div>

      {/* Metadata bar */}
      {hasData && (
        <div style={{
          position: 'absolute', bottom: 8, right: 10,
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: '0.04em',
          display: 'flex', gap: 12,
        }}>
          <span>{hologramData.metadata?.source_camera}</span>
          <span style={{ color: 'var(--accent)' }}>{hologramData.incident_id}</span>
        </div>
      )}
    </div>
  );
}
