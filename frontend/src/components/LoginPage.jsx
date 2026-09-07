/**
 * LoginPage — Atmarakshak Secure Operator Access
 * Full redesign: animated radar, role selector, premium Gruvbox dark
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// ── Tiny inline keyframes injected once ──────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  @keyframes atma-radar-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes atma-radar-ping {
    0%   { transform: scale(0.6); opacity: 0.9; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  @keyframes atma-pulse-dot {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(184,187,38,0.7); }
    50%       { opacity: 0.7; box-shadow: 0 0 0 5px rgba(184,187,38,0); }
  }
  @keyframes atma-pulse-red {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(251,73,52,0.7); }
    50%       { opacity: 0.7; box-shadow: 0 0 0 5px rgba(251,73,52,0); }
  }
  @keyframes atma-pulse-amber {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(250,189,47,0.7); }
    50%       { opacity: 0.7; box-shadow: 0 0 0 5px rgba(250,189,47,0); }
  }
  @keyframes atma-scanline {
    0%   { top: 0%; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes atma-glow-breathe {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%       { opacity: 0.85; transform: scale(1.08); }
  }
  @keyframes atma-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes atma-blink-cursor {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes atma-slide-in {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes atma-shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
  @keyframes atma-progress {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes atma-grid-drift {
    0%   { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }
  .atma-input-field {
    width: 100%;
    background: rgba(29,32,33,0.8);
    border: 1px solid #3c3836;
    border-radius: 8px;
    padding: 13px 44px 13px 14px;
    color: #ebdbb2;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    caret-color: #fe8019;
  }
  .atma-input-field::placeholder { color: #504945; }
  .atma-input-field:focus {
    border-color: #fe8019;
    background: rgba(29,32,33,0.95);
    box-shadow: 0 0 0 3px rgba(254,128,25,0.15), 0 0 20px rgba(254,128,25,0.08);
  }
  .atma-submit-btn {
    width: 100%;
    padding: 14px 18px;
    background: linear-gradient(135deg, #b8bb26 0%, #8ec07c 100%);
    border: none;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: #1d2021;
    letter-spacing: 0.07em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(184,187,38,0.3);
  }
  .atma-submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #c9cb39 0%, #a4d394 100%);
    box-shadow: 0 8px 32px rgba(184,187,38,0.5), 0 0 16px rgba(184,187,38,0.25);
    transform: translateY(-2px);
  }
  .atma-submit-btn:active:not(:disabled) { transform: translateY(0); }
  .atma-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .atma-role-chip {
    flex: 1;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #3c3836;
    background: rgba(29,32,33,0.5);
    color: #928374;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .atma-role-chip:hover { border-color: #504945; color: #bdae93; }
  .atma-role-chip.active {
    border-color: #fe8019;
    background: rgba(254,128,25,0.1);
    color: #fe8019;
    box-shadow: 0 0 16px rgba(254,128,25,0.12);
  }
  .atma-demo-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #fabd2f;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.15s, gap 0.15s;
  }
  .atma-demo-btn:hover { color: #fcd05b; gap: 10px; }
  .atma-nav-link {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #665c54;
    text-decoration: none;
    letter-spacing: 0.04em;
    transition: color 0.15s;
  }
  .atma-nav-link:hover { color: #d5c4a1; }
  .atma-nav-link-red {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #cc241d;
    text-decoration: none;
    letter-spacing: 0.04em;
    transition: color 0.15s;
  }
  .atma-nav-link-red:hover { color: #fb4934; }
`;

// ── Radar Canvas Component ─────────────────────────────────────────────────
function RadarCanvas() {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);
  const angleRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Blip positions
    const blips = [
      { r: 0.28, a: 0.8,  size: 3.5, col: '#fb4934' },
      { r: 0.55, a: 2.1,  size: 2.5, col: '#fabd2f' },
      { r: 0.42, a: 3.9,  size: 3,   col: '#b8bb26' },
      { r: 0.68, a: 5.2,  size: 2,   col: '#fe8019' },
      { r: 0.22, a: 4.4,  size: 2.5, col: '#83a598' },
      { r: 0.75, a: 1.3,  size: 2,   col: '#fabd2f' },
    ];

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const R  = Math.min(W, H) * 0.46;

      ctx.clearRect(0, 0, W, H);

      // ── Rings ──
      [0.25, 0.5, 0.75, 1].forEach(frac => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * frac, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(80,73,69,${frac === 1 ? 0.5 : 0.25})`;
        ctx.lineWidth = frac === 1 ? 1 : 0.5;
        ctx.stroke();
      });

      // ── Cross-hair lines ──
      ctx.strokeStyle = 'rgba(80,73,69,0.25)';
      ctx.lineWidth = 0.5;
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(a => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      });

      // ── Sweep gradient ──
      const sweep = angleRef.current;
      const grad = ctx.createConicalGradient
        ? null // not standard
        : null;

      // Simulate sweep with a wide arc fill
      const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      sweepGrad.addColorStop(0, 'rgba(254,128,25,0.18)');
      sweepGrad.addColorStop(1, 'rgba(254,128,25,0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, sweep - 0.9, sweep, false);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // ── Sweep line ──
      ctx.save();
      ctx.strokeStyle = 'rgba(254,128,25,0.85)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#fe8019';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
      ctx.stroke();
      ctx.restore();

      // ── Blips ──
      blips.forEach(b => {
        const bx = cx + Math.cos(b.a) * R * b.r;
        const by = cy + Math.sin(b.a) * R * b.r;

        // Check if sweep just passed this blip
        const diff = ((sweep - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const brightness = diff < 0.4 ? 1 : Math.max(0, 1 - diff / (Math.PI * 1.5));

        if (brightness > 0.05) {
          ctx.save();
          ctx.globalAlpha = brightness;
          ctx.beginPath();
          ctx.arc(bx, by, b.size, 0, Math.PI * 2);
          ctx.fillStyle = b.col;
          ctx.shadowColor = b.col;
          ctx.shadowBlur = 10 * brightness;
          ctx.fill();
          ctx.restore();
        }
      });

      // ── Center dot ──
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fe8019';
      ctx.shadowColor = '#fe8019';
      ctx.shadowBlur = 12;
      ctx.fill();

      angleRef.current = (sweep + 0.012) % (Math.PI * 2);
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

// ── Status Row ─────────────────────────────────────────────────────────────
function StatusRow({ label, value, color, pulse, delay = 0 }) {
  const pulseAnim = {
    '#b8bb26': 'atma-pulse-dot',
    '#fb4934': 'atma-pulse-red',
    '#fabd2f': 'atma-pulse-amber',
  }[color] || 'atma-pulse-dot';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid rgba(80,73,69,0.3)',
        animation: `atma-fade-up 0.5s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: '#665c54',
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            animation: `${pulseAnim} 2s ease-in-out infinite`,
            animationDelay: `${delay}ms`,
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            color,
            letterSpacing: '0.08em',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ── Typing text animation ──────────────────────────────────────────────────
function TypingText({ text, speed = 45 }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, ++i));
      } else {
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <span
        style={{
          display: 'inline-block',
          width: 2,
          height: '1em',
          background: '#fe8019',
          marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'atma-blink-cursor 1s step-end infinite',
        }}
      />
    </span>
  );
}

// ── Main Login Page ────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState('owner@apex-safety.corp');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    // tiny delay so enter animation triggers
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please fill all fields.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setError('');
    setLoading(true);
    setProgress(0);

    const step = setInterval(() => {
      setProgress(p => {
        if (p >= 95) { clearInterval(step); return 95; }
        return p + Math.random() * 18;
      });
    }, 80);

    setTimeout(() => {
      clearInterval(step);
      setProgress(100);
      setLoading(false);
      setLoadingScreen(true);
      setTimeout(() => {
        navigate('/owner');
      }, 900);
    }, 1200);
  }

  function handleDemo() {
    setPassword('demobypass');
    handleSubmit();
  }

  // ── Loading screen ─────────────────────────────────────────────────────
  if (loadingScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#1d2021',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '2px solid #3c3836',
            borderTop: '2px solid #fe8019',
            animation: 'atma-radar-spin 0.8s linear infinite',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#ebdbb2', fontSize: 13, letterSpacing: '0.1em' }}>
            ESTABLISHING SECURE SESSION
          </span>
          <span style={{ color: '#665c54', fontSize: 10, letterSpacing: '0.08em' }}>
            OWNER COMMAND CONSOLE · ENCRYPTING STREAM
          </span>
        </div>
        <div
          style={{
            width: 240,
            height: 2,
            background: '#3c3836',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #fe8019, #b8bb26)',
              transition: 'width 0.1s',
            }}
          />
        </div>
      </div>
    );
  }

  // ── Main Page ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#1d2021',
          display: 'flex',
          fontFamily: "'Manrope', sans-serif",
          color: '#ebdbb2',
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {/* ═══ LEFT PANEL — Brand & Radar ═══ */}
        <div
          style={{
            flex: '0 0 55%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '44px 52px',
            boxSizing: 'border-box',
            borderRight: '1px solid #3c3836',
            overflow: 'hidden',
          }}
        >
          {/* Animated grid background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'linear-gradient(rgba(254,128,25,0.04) 1px, transparent 1px),' +
                'linear-gradient(90deg, rgba(254,128,25,0.04) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              animation: 'atma-grid-drift 8s linear infinite',
            }}
          />

          {/* Ambient fire glow */}
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '40%',
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(251,73,52,0.18) 0%, rgba(254,128,25,0.1) 35%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
              animation: 'atma-glow-breathe 5s ease-in-out infinite',
            }}
          />

          {/* CCTV scan line */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(142,192,124,0.35), transparent)',
                animation: 'atma-scanline 6s linear infinite',
              }}
            />
          </div>

          {/* TOP: Logo */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              animation: 'atma-fade-up 0.6s ease both',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'rgba(254,128,25,0.12)',
                border: '1px solid rgba(254,128,25,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src="/atmarakshak_logo.png"
                alt="Atmarakshak"
                style={{ width: 26, height: 26, objectFit: 'contain' }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fe8019',
                  letterSpacing: '0.06em',
                }}
              >
                ATMARAKSHAK
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: '#665c54',
                  letterSpacing: '0.1em',
                }}
              >
                आत्मरक्षक · v2.4.0
              </div>
            </div>
          </div>

          {/* MIDDLE: Headline + Radar */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Headline */}
            <h1
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(40px, 4vw, 56px)',
                lineHeight: 1.1,
                letterSpacing: '-1.5px',
                color: '#f2e5bc',
                margin: '0 0 16px 0',
                maxWidth: 460,
                animation: 'atma-fade-up 0.6s ease 0.1s both',
              }}
            >
              See the signal.<br />
              <span
                style={{
                  background: 'linear-gradient(120deg, #fe8019 30%, #fb4934 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Stop the hazard.
              </span>
            </h1>
            <p
              style={{
                fontSize: 14,
                color: '#928374',
                lineHeight: 1.7,
                maxWidth: 380,
                margin: '0 0 32px 0',
                animation: 'atma-fade-up 0.6s ease 0.2s both',
              }}
            >
              AI-powered fire detection, real-time camera analytics, and automated ERSS dispatch — unified in one command console.
            </p>

            {/* Radar */}
            <div
              style={{
                width: 200,
                height: 200,
                position: 'relative',
                marginBottom: 32,
                animation: 'atma-fade-up 0.6s ease 0.3s both',
              }}
            >
              <RadarCanvas />
              {/* Radar label */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: '#504945',
                  letterSpacing: '0.1em',
                  whiteSpace: 'nowrap',
                }}
              >
                ZONE · MUMBAI-CENTRAL-4B
              </div>
            </div>

            {/* Status indicators */}
            <div style={{ animation: 'atma-fade-up 0.6s ease 0.4s both' }}>
              <StatusRow label="AI DETECTION ENGINE"     value="OPERATIONAL" color="#b8bb26" delay={0}   />
              <StatusRow label="CCTV NETWORK · 128 CAMS" value="ALL ONLINE"   color="#b8bb26" delay={80}  />
              <StatusRow label="ERSS 112 GATEWAY"         value="CONNECTED"    color="#b8bb26" delay={160} />
              <StatusRow label="ACTIVE INCIDENTS"          value="2 CRITICAL"   color="#fb4934" delay={240} />
              <StatusRow label="SENSOR MESH LATENCY"       value="12ms"         color="#fabd2f" delay={320} />
            </div>
          </div>

          {/* BOTTOM: Nav links */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              animation: 'atma-fade-up 0.6s ease 0.5s both',
            }}
          >
            <Link to="/" className="atma-nav-link">← HOMEPAGE</Link>
            <span style={{ color: '#3c3836' }}>·</span>
            <Link to="/dispatch" className="atma-nav-link-red">ERSS DISPATCH →</Link>
            <span style={{ color: '#3c3836' }}>·</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: '#3c3836',
                letterSpacing: '0.06em',
              }}
            >
              SIH 2026
            </span>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Login Form ═══ */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 40px',
            background: '#282828',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {/* Subtle corner glow */}
          <div
            style={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254,128,25,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              width: '100%',
              maxWidth: 400,
              animation: 'atma-slide-in 0.55s cubic-bezier(0.16,1,0.3,1) 0.1s both',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#665c54',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#b8bb26',
                    animation: 'atma-pulse-dot 2s ease-in-out infinite',
                  }}
                />
                SECURE OPERATOR ACCESS · ZONE A
              </div>
              <h2
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: 36,
                  color: '#f2e5bc',
                  margin: 0,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.15,
                }}
              >
                <TypingText text="Sign in to command." speed={50} />
              </h2>
            </div>



            {/* Form */}
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              {/* Email */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#665c54',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  OPERATOR EMAIL
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="atma-input-field"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="operator@domain.gov.in"
                    autoComplete="username"
                    style={{ paddingLeft: 14 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 13,
                      opacity: 0.4,
                    }}
                  >
                    ✉
                  </span>
                </div>
              </div>

              {/* Password */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <label
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      fontWeight: 600,
                      color: '#665c54',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    ACCESS KEY
                  </label>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      color: '#504945',
                      cursor: 'pointer',
                      letterSpacing: '0.06em',
                    }}
                  >
                    FORGOT?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="atma-input-field"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#665c54',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 13,
                      lineHeight: 1,
                    }}
                    tabIndex={-1}
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: '#fb4934',
                    letterSpacing: '0.06em',
                    padding: '8px 12px',
                    background: 'rgba(251,73,52,0.1)',
                    border: '1px solid rgba(251,73,52,0.25)',
                    borderRadius: 6,
                  }}
                >
                  ✗ {error}
                </div>
              )}

              {/* Progress bar (loading) */}
              {loading && (
                <div
                  style={{
                    height: 2,
                    background: '#3c3836',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #fe8019, #b8bb26)',
                      transition: 'width 0.1s',
                      borderRadius: 2,
                    }}
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="atma-submit-btn"
                disabled={loading}
                style={{
                  animation: shake ? 'atma-shake 0.5s ease' : 'none',
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(29,32,33,0.4)',
                        borderTop: '2px solid #1d2021',
                        borderRadius: '50%',
                        animation: 'atma-radar-spin 0.7s linear infinite',
                      }}
                    />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    ENTER COMMAND CONSOLE
                    <span style={{ fontSize: 14 }}>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Box */}
            <div
              style={{
                marginTop: 24,
                padding: '16px 18px',
                background: 'rgba(29,32,33,0.7)',
                border: '1px solid #3c3836',
                borderRadius: 8,
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#665c54',
                    letterSpacing: '0.1em',
                  }}
                >
                  DEMO OWNER ACCESS
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    fontWeight: 700,
                    color: '#b8bb26',
                    background: 'rgba(184,187,38,0.1)',
                    border: '1px solid rgba(184,187,38,0.2)',
                    padding: '2px 7px',
                    borderRadius: 4,
                    letterSpacing: '0.08em',
                  }}
                >
                  ● READY
                </div>
              </div>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  lineHeight: 1.5,
                  marginBottom: 14,
                }}
              >
                <div style={{ color: '#d5c4a1' }}>
                  owner@apex-safety.corp
                </div>
                <div style={{ color: '#665c54' }}>password: demobypass</div>
              </div>

              <button
                type="button"
                className="atma-demo-btn"
                onClick={handleDemo}
              >
                USE SEEDED CREDENTIALS →
              </button>
            </div>

            {/* Footer note */}
            <div
              style={{
                marginTop: 24,
                textAlign: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: '#3c3836',
                letterSpacing: '0.06em',
              }}
            >
              SMART INDIA HACKATHON 2026 · TEAM ATMARAKSHAK · AES-256 ENCRYPTED
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
