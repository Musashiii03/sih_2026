/**
 * LoginPage — Atmarakshak Secure Operator Access
 * Modeled exactly after the video authentication screen (at 00:13)
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, Eye, EyeOff, Flame, CheckCircle, Activity, Lock, Cpu, Wifi } from 'lucide-react';
import './ApexConsole.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@atmarakshak.corp');
  const [password, setPassword] = useState('demobypass');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(false);

  function handleSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setLoadingScreen(true);
      setTimeout(() => {
        navigate('/owner');
      }, 700);
    }, 550);
  }

  function handleUseSeeded() {
    setEmail('owner@apex-safety.corp');
    setPassword('demobypass');
    handleSubmit();
  }

  if (loadingScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#161817',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#8b928a',
          letterSpacing: '0.1em',
          fontSize: 13,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="apex-pulse-dot" />
          <span style={{ color: '#eae7df' }}>[ LOADING OPERATIONS CONSOLE... ]</span>
        </div>
        <div style={{ fontSize: 11, color: '#646b63' }}>ESTABLISHING ENCRYPTED TELEMETRY STREAM</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#1c1e1d',
        display: 'flex',
        fontFamily: "'Manrope', sans-serif",
        color: '#eae7df',
        overflow: 'hidden',
      }}
    >
      {/* ─── LEFT: EDITORIAL BRAND PANEL ─── */}
      <div
        style={{
          flex: '0 0 52%',
          background: '#161817',
          borderRight: '1px solid #323633',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), ' +
              'linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Top brand */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
            <div className="apex-brand-icon" style={{ padding: 3, overflow: 'hidden' }}>
              <img
                src="/atmarakshak_logo.png"
                alt="Atmarakshak Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fe8019',
                  letterSpacing: '0.08em',
                }}
              >
                Atmarakshak
              </div>
            </div>
          </div>

          {/* Hero Headline */}
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 52,
              lineHeight: 1.12,
              letterSpacing: '-1px',
              color: '#f7f5ed',
              margin: '0 0 20px 0',
              maxWidth: 440,
            }}
          >
            See the signal.<br />
            Stop the hazard.
          </h1>
          <p
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#8b928a',
              margin: 0,
              maxWidth: 420,
            }}
          >
            One console for every building, camera, detection, and incident response decision across your safety network.
          </p>
        </div>

        {/* Middle Real-Time Status Indicators */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
          {[
            { label: 'AI DETECTION ENGINE', status: 'READY', color: '#4ade80' },
            { label: 'CAMERA NETWORK', status: 'ONLINE', color: '#4ade80' },
            { label: 'INCIDENT ROUTING', status: 'STANDBY', color: '#fabd2f' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
              }}
            >
              <span style={{ color: '#8b928a', letterSpacing: '0.06em' }}>{item.label}</span>
              <span style={{ color: item.color, fontWeight: 700, letterSpacing: '0.08em' }}>{item.status}</span>
            </div>
          ))}
        </div>

        {/* Bottom footer link */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            to="/"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#646b63',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#eae7df')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#646b63')}
          >
            ← RETURN TO HOMEPAGE
          </Link>
          <span style={{ color: '#323633' }}>·</span>
          <Link
            to="/dispatch"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#fb4934',
              textDecoration: 'none',
            }}
          >
            ERSS 112 DISPATCH CONSOLE →
          </Link>
        </div>
      </div>

      {/* ─── RIGHT: OPERATOR ACCESS FORM ─── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
          background: '#1c1e1d',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', maxWidth: 390 }}>
          {/* Card Title */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: '#8b928a',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              SECURE OPERATOR ACCESS
            </div>
            <h2
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 34,
                fontStyle: 'italic',
                fontWeight: 400,
                color: '#f5f4ed',
                margin: 0,
                letterSpacing: '-0.5px',
              }}
            >
              Sign in to command
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Operator Email */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#8b928a',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                OPERATOR EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#232624',
                  border: '1px solid #323633',
                  borderRadius: 6,
                  padding: '11px 14px',
                  color: '#f5f4ed',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#fe8019')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#323633')}
              />
            </div>

            {/* Access Key */}
            <div style={{ position: 'relative' }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#8b928a',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                ACCESS KEY
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: '#232624',
                    border: '1px solid #323633',
                    borderRadius: 6,
                    padding: '11px 40px 11px 14px',
                    color: '#f5f4ed',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#fe8019')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#323633')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8b928a',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '12px 18px',
                background: '#4ade80',
                border: '1px solid #86efac',
                borderRadius: 6,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                color: '#111e15',
                letterSpacing: '0.06em',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
            >
              {loading ? (
                <span>AUTHENTICATING... →</span>
              ) : (
                <>
                  <span>ENTER COMMAND CONSOLE</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Demo Access Box (exact match to video) */}
          <div
            style={{
              marginTop: 24,
              padding: '16px 18px',
              background: '#161817',
              border: '1px solid #323633',
              borderRadius: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#8b928a',
                  letterSpacing: '0.08em',
                }}
              >
                DEMO OWNER ACCESS
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#4ade80',
                  background: 'rgba(74, 222, 128, 0.1)',
                  padding: '1px 6px',
                  borderRadius: 3,
                }}
              >
                READY
              </span>
            </div>

            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: '#eae7df',
                lineHeight: 1.4,
                marginBottom: 12,
              }}
            >
              <div>owner@apex-safety.corp</div>
              <div style={{ color: '#8b928a' }}>password: demobypass</div>
            </div>

            <button
              type="button"
              onClick={handleUseSeeded}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: '#fabd2f',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>USE SEEDED CREDENTIALS</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
