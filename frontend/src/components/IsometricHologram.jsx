import React, { useEffect, useRef } from 'react';

/**
 * IsometricHologram — Rich 3D isometric multi-floor building model
 * Features: ground + 2nd floor walls, windows, roof, animated fire zone,
 * animated person markers, exit markers — warm light theme.
 */
export default function IsometricHologram({ humanCount = 4 }) {
  const fireRef = useRef(null);

  // Person spots on the 2nd floor isometric plane
  const personSpots = [
    { x: 152, y: 148 },
    { x: 174, y: 162 },
    { x: 120, y: 158 },
    { x: 198, y: 144 },
    { x: 96,  y: 152 },
    { x: 210, y: 168 },
  ];
  const persons = personSpots.slice(0, humanCount);

  return (
    <div className="hologram-wrap" style={{ minHeight: 300, padding: 0, overflow: 'hidden' }}>
      {/* Warm grid overlay */}
      <div className="hologram-grid" />

      {/* Corner label */}
      <div style={{
        position: 'absolute', top: 10, left: 14, zIndex: 5,
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.10em', textTransform: 'uppercase',
        color: 'var(--accent)', opacity: 0.8
      }}>
        3D · Arjun Tech Park · Block B
      </div>

      <svg
        viewBox="0 0 480 310"
        style={{ width: '100%', height: '100%', minHeight: 300, position: 'relative', zIndex: 1, display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Fire zone glow — warm ember */}
          <radialGradient id="hazardGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#C93A1C" stopOpacity="0.85" />
            <stop offset="45%"  stopColor="#E07030" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F5A020" stopOpacity="0" />
          </radialGradient>

          {/* Floor surface — warm stone */}
          <linearGradient id="floorTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#F5ECD8" />
            <stop offset="100%" stopColor="#EDE0C4" />
          </linearGradient>

          {/* Ground floor top */}
          <linearGradient id="gFloorTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#EDE0C4" />
            <stop offset="100%" stopColor="#E0D0B0" />
          </linearGradient>

          {/* Wall face — left deep warm */}
          <linearGradient id="wallLeft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#5C3D1E" />
            <stop offset="100%" stopColor="#7A5230" />
          </linearGradient>

          {/* Wall face — right lighter warm */}
          <linearGradient id="wallRight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#7A5230" />
            <stop offset="100%" stopColor="#9A6B40" />
          </linearGradient>

          {/* Roof gradient */}
          <linearGradient id="roofFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#F0E4CA" />
            <stop offset="100%" stopColor="#E0D0B0" />
          </linearGradient>

          {/* Window glass */}
          <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#D4EEFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A8D4F5" stopOpacity="0.5" />
          </linearGradient>

          {/* Window fire glow */}
          <linearGradient id="windowFire" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#FF8040" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C93A1C" stopOpacity="0.7" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Soft shadow filter */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(44,26,14,0.25)" />
          </filter>

          {/* Person glow */}
          <filter id="personGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ══════════════════════════════════════
            GROUND FLOOR — building footprint
        ══════════════════════════════════════ */}

        {/* Ground floor top face */}
        <polygon
          points="240,130 390,215 240,300 90,215"
          fill="url(#gFloorTop)"
          stroke="rgba(44,26,14,0.15)"
          strokeWidth="1"
        />

        {/* Ground floor left wall */}
        <polygon
          points="90,215 90,255 240,340 240,300"
          fill="url(#wallLeft)"
          stroke="rgba(44,26,14,0.20)"
          strokeWidth="1"
        />

        {/* Ground floor right wall */}
        <polygon
          points="390,215 390,255 240,340 240,300"
          fill="url(#wallRight)"
          stroke="rgba(44,26,14,0.18)"
          strokeWidth="1"
        />

        {/* Ground floor — left wall windows (3) */}
        {[0, 1, 2].map(i => {
          const wx = 110 + i * 44;
          const wy = 232 + i * 25;
          return (
            <g key={`gw-l-${i}`}>
              <polygon
                points={`${wx},${wy} ${wx+16},${wy-9} ${wx+16},${wy+6} ${wx},${wy+15}`}
                fill="url(#windowGlass)"
                stroke="rgba(44,26,14,0.25)"
                strokeWidth="0.8"
              />
              {/* Window pane divider */}
              <line x1={wx+8} y1={wy-4} x2={wx+8} y2={wy+11} stroke="rgba(44,26,14,0.20)" strokeWidth="0.6" />
              <line x1={wx} y1={wy+3} x2={wx+16} y2={wy-3} stroke="rgba(44,26,14,0.20)" strokeWidth="0.6" />
            </g>
          );
        })}

        {/* Ground floor — right wall windows (3) */}
        {[0, 1, 2].map(i => {
          const wx = 360 - i * 44;
          const wy = 232 + i * 25;
          return (
            <g key={`gw-r-${i}`}>
              <polygon
                points={`${wx},${wy-9} ${wx-16},${wy} ${wx-16},${wy+15} ${wx},${wy+6}`}
                fill="url(#windowGlass)"
                stroke="rgba(44,26,14,0.25)"
                strokeWidth="0.8"
              />
              <line x1={wx-8} y1={wy-4} x2={wx-8} y2={wy+11} stroke="rgba(44,26,14,0.20)" strokeWidth="0.6" />
              <line x1={wx-16} y1={wy+3} x2={wx} y2={wy-3} stroke="rgba(44,26,14,0.20)" strokeWidth="0.6" />
            </g>
          );
        })}

        {/* Ground entrance door (left face) */}
        <g>
          <polygon
            points="164,258 180,249 180,271 164,280"
            fill="#4A7C2F"
            opacity="0.85"
            stroke="rgba(44,26,14,0.3)"
            strokeWidth="1"
          />
          <text x="166" y="261" fill="#fff" fontSize="6" fontFamily="JetBrains Mono, monospace" fontWeight="700" transform="rotate(-30, 166, 261)">EXIT</text>
        </g>

        {/* ══════════════════════════════════════
            2ND FLOOR — elevated building block
        ══════════════════════════════════════ */}

        {/* 2nd floor top face (interior room where fire is) */}
        <polygon
          points="240,60 370,135 240,210 110,135"
          fill="url(#floorTop)"
          stroke="rgba(44,26,14,0.12)"
          strokeWidth="1"
        />

        {/* Floor interior grid lines */}
        {[0.25, 0.5, 0.75].map((t, i) => {
          const lx1 = 110 + t * (370 - 110);
          const ly1 = 135 - t * (135 - 60);
          const lx2 = 110 + t * (370 - 110);
          const ly2 = 135 + t * (210 - 135);
          // Cross lines
          const cx1 = 110 + t * (240 - 110);
          const cy1 = 135 - t * (135 - 60) + t * (135 - 60) * 0;
          return (
            <g key={`fg-${i}`}>
              <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke="rgba(44,26,14,0.07)" strokeWidth="0.8" />
              <line
                x1={110 + t * (240 - 110)} y1={60 + t * (210 - 60)}
                x2={370 - t * (370 - 240)} y2={60 + t * (210 - 60)}
                stroke="rgba(44,26,14,0.07)" strokeWidth="0.8"
              />
            </g>
          );
        })}

        {/* 2nd floor left wall */}
        <polygon
          points="110,135 110,175 240,250 240,210"
          fill="url(#wallLeft)"
          stroke="rgba(44,26,14,0.22)"
          strokeWidth="1"
        />

        {/* 2nd floor right wall */}
        <polygon
          points="370,135 370,175 240,250 240,210"
          fill="url(#wallRight)"
          stroke="rgba(44,26,14,0.20)"
          strokeWidth="1"
        />

        {/* 2nd floor — left wall windows with fire glow */}
        {[0, 1].map(i => {
          const wx = 128 + i * 52;
          const wy = 152 + i * 30;
          const isFire = i === 1;
          return (
            <g key={`2w-l-${i}`}>
              <polygon
                points={`${wx},${wy} ${wx+18},${wy-10} ${wx+18},${wy+8} ${wx},${wy+18}`}
                fill={isFire ? "url(#windowFire)" : "url(#windowGlass)"}
                stroke="rgba(44,26,14,0.25)"
                strokeWidth="0.8"
                opacity={isFire ? 1 : 0.9}
              />
              {isFire && (
                <polygon
                  points={`${wx},${wy} ${wx+18},${wy-10} ${wx+18},${wy+8} ${wx},${wy+18}`}
                  fill="none"
                  stroke="#FF8040"
                  strokeWidth="1.5"
                  opacity="0.7"
                  filter="url(#glow)"
                />
              )}
              <line x1={wx+9} y1={wy-5} x2={wx+9} y2={wy+13} stroke="rgba(44,26,14,0.20)" strokeWidth="0.6" />
              <line x1={wx} y1={wy+4} x2={wx+18} y2={wy-2} stroke="rgba(44,26,14,0.20)" strokeWidth="0.6" />
            </g>
          );
        })}

        {/* 2nd floor — right wall windows */}
        {[0, 1].map(i => {
          const wx = 352 - i * 52;
          const wy = 152 + i * 30;
          return (
            <g key={`2w-r-${i}`}>
              <polygon
                points={`${wx},${wy-10} ${wx-18},${wy} ${wx-18},${wy+18} ${wx},${wy+8}`}
                fill="url(#windowGlass)"
                stroke="rgba(44,26,14,0.25)"
                strokeWidth="0.8"
              />
              <line x1={wx-9} y1={wy-5} x2={wx-9} y2={wy+13} stroke="rgba(44,26,14,0.20)" strokeWidth="0.6" />
              <line x1={wx-18} y1={wy+4} x2={wx} y2={wy-2} stroke="rgba(44,26,14,0.20)" strokeWidth="0.6" />
            </g>
          );
        })}

        {/* ══════════════════════════════════════
            ROOF
        ══════════════════════════════════════ */}
        <polygon
          points="240,20 370,95 240,170 110,95"
          fill="url(#roofFill)"
          stroke="rgba(44,26,14,0.18)"
          strokeWidth="1.2"
          filter="url(#softShadow)"
        />

        {/* Roof ridge line */}
        <line x1="240" y1="20" x2="240" y2="170" stroke="rgba(44,26,14,0.12)" strokeWidth="1" strokeDasharray="6 4" />
        <line x1="110" y1="95" x2="370" y2="95" stroke="rgba(44,26,14,0.12)" strokeWidth="1" strokeDasharray="6 4" />

        {/* Roof edge highlight */}
        <polyline
          points="110,95 240,20 370,95"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Roof solar panels / AC unit detail */}
        <polygon points="222,70 250,55 258,60 230,75" fill="rgba(44,26,14,0.12)" stroke="rgba(44,26,14,0.20)" strokeWidth="0.7" />
        <polygon points="246,82 274,67 282,72 254,87" fill="rgba(44,26,14,0.10)" stroke="rgba(44,26,14,0.18)" strokeWidth="0.7" />

        {/* ══════════════════════════════════════
            FLOOR SEPARATION LINE (between floors)
        ══════════════════════════════════════ */}
        <polyline
          points="110,135 240,60 370,135 240,210 110,135"
          fill="none"
          stroke="rgba(200,132,26,0.35)"
          strokeWidth="1.5"
          strokeDasharray="none"
        />

        {/* ══════════════════════════════════════
            HAZARD ZONE (fire) on 2nd floor
        ══════════════════════════════════════ */}
        {/* Fire floor glow */}
        <ellipse cx="258" cy="168" rx="58" ry="28"
          fill="url(#hazardGlow)"
          filter="url(#glow)"
          style={{ animation: 'fire-flicker 1.6s ease-in-out infinite' }}
        />

        {/* Fire zone dashed ring */}
        <ellipse cx="258" cy="168" rx="58" ry="28"
          fill="none"
          stroke="#C93A1C"
          strokeWidth="1.5"
          strokeDasharray="7 4"
          opacity="0.75"
        />

        {/* Fire flames — 3 stacked */}
        {[
          { cx: 248, cy: 162, rx: 7, ry: 11 },
          { cx: 260, cy: 158, rx: 5, ry: 9 },
          { cx: 271, cy: 163, rx: 6, ry: 10 },
        ].map((f, i) => (
          <ellipse key={i}
            cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry}
            fill={i === 1 ? '#E07030' : '#C93A1C'}
            opacity="0.82"
            filter="url(#glow)"
            style={{ animation: `fire-flicker ${1.4 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
          />
        ))}

        {/* Fire zone label */}
        <text x="258" y="156" textAnchor="middle"
          fill="#C93A1C" fontSize="8" fontFamily="JetBrains Mono, monospace"
          fontWeight="700" letterSpacing="1.2" opacity="0.95"
        >
          FIRE ZONE
        </text>

        {/* ══════════════════════════════════════
            PERSON MARKERS (olive-green, animated)
        ══════════════════════════════════════ */}
        {persons.map((p, i) => (
          <g key={i} style={{ animation: `person-bob 2.${i}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}>
            {/* Shadow */}
            <ellipse cx={p.x} cy={p.y + 9} rx="5" ry="2.5" fill="rgba(44,26,14,0.18)" />
            {/* Body */}
            <line x1={p.x} y1={p.y} x2={p.x} y2={p.y + 7}
              stroke="#4A7C2F" strokeWidth="3" strokeLinecap="round" />
            {/* Arms */}
            <line x1={p.x - 4} y1={p.y + 2} x2={p.x + 4} y2={p.y + 2}
              stroke="#4A7C2F" strokeWidth="2" strokeLinecap="round" />
            {/* Head */}
            <circle cx={p.x} cy={p.y - 5} r="4.5" fill="#4A7C2F" opacity="0.92" filter="url(#personGlow)" />
            {/* Label */}
            <text x={p.x + 8} y={p.y - 1} fill="#4A7C2F" fontSize="7"
              fontFamily="JetBrains Mono, monospace" fontWeight="700">
              P{i + 1}
            </text>
          </g>
        ))}

        {/* ══════════════════════════════════════
            DESK FURNITURE — 2nd floor
        ══════════════════════════════════════ */}
        {/* Desk top */}
        <polygon points="130,112 158,97 168,103 140,118" fill="#D4C4A0" stroke="rgba(44,26,14,0.20)" strokeWidth="0.8" />
        {/* Desk left */}
        <polygon points="130,112 130,121 140,127 140,118" fill="#B8A07A" stroke="rgba(44,26,14,0.15)" strokeWidth="0.8" />
        {/* Desk right */}
        <polygon points="140,118 168,103 168,112 140,127" fill="#C8B08A" stroke="rgba(44,26,14,0.15)" strokeWidth="0.8" />

        {/* Filing cabinet */}
        <polygon points="310,105 328,96 334,100 316,109" fill="#C8B88A" stroke="rgba(44,26,14,0.20)" strokeWidth="0.8" />
        <polygon points="310,105 310,118 316,122 316,109" fill="#B09070" stroke="rgba(44,26,14,0.15)" strokeWidth="0.8" />
        <polygon points="316,109 334,100 334,113 316,122" fill="#BCA07A" stroke="rgba(44,26,14,0.15)" strokeWidth="0.8" />
        {/* Drawer lines */}
        <line x1="310" y1="109" x2="316" y2="106" stroke="rgba(44,26,14,0.25)" strokeWidth="0.7" />
        <line x1="316" y1="109" x2="334" y2="100" stroke="rgba(44,26,14,0.20)" strokeWidth="0.7" />
        <line x1="310" y1="113" x2="316" y2="110" stroke="rgba(44,26,14,0.25)" strokeWidth="0.7" />

        {/* ══════════════════════════════════════
            CAMERA ICON — roof corner
        ══════════════════════════════════════ */}
        <g>
          <circle cx="352" cy="38" r="9" fill="rgba(200,132,26,0.15)" stroke="rgba(200,132,26,0.50)" strokeWidth="1.2" />
          <circle cx="352" cy="38" r="4" fill="rgba(200,132,26,0.7)" />
          <circle cx="352" cy="38" r="2" fill="rgba(200,132,26,0.95)" />
          <text x="352" y="55" fill="rgba(200,132,26,0.80)" fontSize="7.5"
            fontFamily="JetBrains Mono, monospace" textAnchor="middle" fontWeight="700">CAM-03</text>
        </g>

        {/* ══════════════════════════════════════
            FLOOR LABEL BADGES
        ══════════════════════════════════════ */}
        {/* 2nd Floor label */}
        <g>
          <rect x="60" y="124" width="44" height="14" rx="3"
            fill="rgba(200,132,26,0.18)" stroke="rgba(200,132,26,0.35)" strokeWidth="0.8" />
          <text x="82" y="134" textAnchor="middle"
            fill="#C8841A" fontSize="7.5" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            2F FIRE
          </text>
        </g>

        {/* Ground floor label */}
        <g>
          <rect x="60" y="204" width="44" height="14" rx="3"
            fill="rgba(74,124,47,0.15)" stroke="rgba(74,124,47,0.30)" strokeWidth="0.8" />
          <text x="82" y="214" textAnchor="middle"
            fill="#4A7C2F" fontSize="7.5" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            GF SAFE
          </text>
        </g>

        {/* ══════════════════════════════════════
            LEGEND
        ══════════════════════════════════════ */}
        <g>
          <rect x="10" y="282" width="200" height="22" rx="4"
            fill="rgba(255,253,249,0.85)" stroke="rgba(44,26,14,0.12)" strokeWidth="0.8" />
          <circle cx="26" cy="293" r="4" fill="#C93A1C" opacity="0.9" />
          <text x="34" y="297" fill="rgba(44,26,14,0.65)" fontSize="7.5" fontFamily="JetBrains Mono, monospace">Fire Zone</text>
          <circle cx="94" cy="293" r="4" fill="#4A7C2F" opacity="0.9" />
          <text x="102" y="297" fill="rgba(44,26,14,0.65)" fontSize="7.5" fontFamily="JetBrains Mono, monospace">Person Detected</text>
        </g>
      </svg>

      {/* Caption */}
      <div style={{
        position: 'absolute', bottom: 10, right: 14,
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: '0.05em',
        background: 'rgba(255,253,249,0.85)',
        padding: '2px 8px', borderRadius: 4,
        border: '1px solid rgba(44,26,14,0.10)'
      }}>
        East Corridor · Floor 2 · Block B
      </div>
    </div>
  );
}
