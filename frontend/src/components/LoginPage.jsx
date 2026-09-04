/**
 * LoginPage — GIC design language applied to Atmarakshak
 *
 * Visual language:
 *  - Warm parchment canvas (#fefffc), white card surfaces (#ffffff)
 *  - Fraunces (display serif, weight 400) for all headings
 *  - Manrope (sans, weight 400/500/600) for all body/UI
 *  - JetBrains Mono for IDs, timestamps, monospace data
 *  - 1px #dee2de hairline borders on cards
 *  - Signal blue (#41a1cf) outline-only CTAs
 *  - No filled chromatic buttons except the one dark Dusk (#1f1f29) button
 *  - Generous whitespace, editorial rhythm
 */

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Flame } from 'lucide-react';

// ── Design tokens (GIC palette, scoped to this component) ─────────────────
const T = {
  parchment:   '#fefffc',
  paper:       '#ffffff',
  linen:       '#f9faf7',
  inkBlack:    '#171717',
  graphite:    '#2c2c2c',
  charcoal:    '#444141',
  ash:         '#646464',
  fog:         '#b4b8b4',
  mist:        '#dee2de',
  twilight:    '#282834',
  dusk:        '#1f1f29',
  signalBlue:  '#41a1cf',
  cerulean:    '#0081c0',
};

// ── Role cards data ────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'owner',
    title: 'Building Owner',
    description: 'Monitor your properties, receive real-time fire alerts, manage incident responses and safety compliance across all buildings.',
    href: '/owner',
    cta: 'Access Owner Portal',
    badge: null,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.5"
        stroke={T.graphite}>
        <path d="M3 21h18M9 21V11.5M15 21V11.5M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'dispatch',
    title: 'Fire Dispatch',
    description: 'ERSS / 112 operator console — triage active incidents, coordinate unit dispatch, and track resolution across the jurisdiction.',
    href: '/dispatch',
    cta: 'Enter Dispatch Console',
    badge: '2 Active',
    badgeColor: '#e11d48',
    icon: (
      <Flame size={24} color="#e11d48" strokeWidth={1.5} />
    ),
  },
];

// ── Shared input style (GIC: linen fill, bottom-border only) ──────────────
const inputStyle = {
  display: 'block',
  width: '100%',
  background: T.linen,
  border: 'none',
  borderBottom: `1px solid ${T.charcoal}`,
  borderRadius: 0,
  padding: '10px 0',
  fontFamily: "'Manrope', sans-serif",
  fontSize: 15,
  fontWeight: 400,
  color: T.charcoal,
  letterSpacing: '-0.01em',
  outline: 'none',
  transition: 'border-color 0.15s',
};

// ── Login Form ─────────────────────────────────────────────────────────────
function LoginForm({ role, onBack }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const roleInfo = ROLES.find(r => r.id === role);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    // Simulate auth — just navigate after 600ms
    setTimeout(() => {
      window.location.href = roleInfo.href;
    }, 600);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Back link */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 500,
        color: T.ash, letterSpacing: '-0.01em',
        display: 'flex', alignItems: 'center', gap: 6,
        padding: 0, alignSelf: 'flex-start',
        transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = T.graphite}
        onMouseLeave={e => e.currentTarget.style.color = T.ash}
      >
        ← Back to portal select
      </button>

      {/* Role header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {roleInfo.icon}
          <span style={{
            fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 500,
            color: T.ash, letterSpacing: '-0.01em',
          }}>
            {roleInfo.title}
          </span>
        </div>
        <h2 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 40, lineHeight: 1.1,
          letterSpacing: '-0.8px',
          color: T.graphite, margin: 0,
        }}>
          Sign in to continue
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Email */}
        <div>
          <label style={{
            display: 'block', fontFamily: "'Manrope', sans-serif",
            fontSize: 13, fontWeight: 500, color: T.ash,
            letterSpacing: '-0.01em', marginBottom: 6,
          }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@organisation.in"
            required
            style={{ ...inputStyle }}
            onFocus={e => e.currentTarget.style.borderBottomColor = T.graphite}
            onBlur={e => e.currentTarget.style.borderBottomColor = T.charcoal}
          />
        </div>

        {/* Password */}
        <div style={{ position: 'relative' }}>
          <label style={{
            display: 'block', fontFamily: "'Manrope', sans-serif",
            fontSize: 13, fontWeight: 500, color: T.ash,
            letterSpacing: '-0.01em', marginBottom: 6,
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ ...inputStyle, paddingRight: 36 }}
              onFocus={e => e.currentTarget.style.borderBottomColor = T.graphite}
              onBlur={e => e.currentTarget.style.borderBottomColor = T.charcoal}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{
                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.fog, padding: 4,
              }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Forgot */}
        <div style={{ textAlign: 'right', marginTop: -14 }}>
          <button type="button" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Manrope', sans-serif", fontSize: 13,
            color: T.signalBlue, padding: 0,
            letterSpacing: '-0.01em',
          }}>
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} style={{
          width: '100%',
          background: T.dusk,
          border: `1px solid ${T.twilight}`,
          borderRadius: 8,
          padding: '11px 16px',
          fontFamily: "'Manrope', sans-serif",
          fontSize: 15,
          fontWeight: 500,
          color: '#ffffff',
          letterSpacing: '-0.15px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading ? 'Signing in…' : (
            <>
              {roleInfo.cta}
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 20, height: 20, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.3)',
              }}>
                <ArrowRight size={11} />
              </span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: T.mist }} />
        <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: T.fog }}>or</span>
        <div style={{ flex: 1, height: 1, background: T.mist }} />
      </div>

      {/* SSO / demo access */}
      <button
        type="button"
        onClick={() => { window.location.href = roleInfo.href; }}
        style={{
          background: 'transparent',
          border: `1px solid ${T.signalBlue}`,
          borderRadius: 8,
          padding: '9px 16px',
          fontFamily: "'Manrope', sans-serif",
          fontSize: 15, fontWeight: 500,
          color: T.signalBlue,
          letterSpacing: '-0.15px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${T.signalBlue}12`}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        Continue as demo user
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 20, borderRadius: '50%',
          border: `1px solid ${T.signalBlue}60`,
        }}>
          <ArrowRight size={11} />
        </span>
      </button>
    </div>
  );
}

// ── Portal select screen ───────────────────────────────────────────────────
function PortalSelect({ onSelectRole }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Headline */}
      <div>
        <p style={{
          fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 500,
          color: T.ash, letterSpacing: '-0.01em', marginBottom: 12,
        }}>
          Select your access portal to continue
        </p>
        <h2 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontStyle: 'italic', fontWeight: 400,
          fontSize: 40, lineHeight: 1.1,
          letterSpacing: '-0.8px',
          color: T.graphite, margin: 0,
        }}>
          Who are you<br />signing in as?
        </h2>
      </div>

      {/* Role cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ROLES.map(role => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 16,
              background: T.paper,
              border: `1px solid ${T.mist}`,
              borderRadius: 12,
              padding: '18px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: '0 1px 1px rgba(0,0,0,0.06), 0 4px 5px rgba(0,0,0,0.04)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = T.twilight;
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = T.mist;
              e.currentTarget.style.boxShadow = '0 1px 1px rgba(0,0,0,0.06), 0 4px 5px rgba(0,0,0,0.04)';
            }}
          >
            {/* Icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: T.linen, border: `1px solid ${T.mist}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {role.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontFamily: "'Manrope', sans-serif", fontSize: 15, fontWeight: 600,
                  color: T.graphite, letterSpacing: '-0.15px',
                }}>
                  {role.title}
                </span>
                {role.badge && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, fontWeight: 700,
                    color: role.badgeColor ?? T.signalBlue,
                    background: `${role.badgeColor ?? T.signalBlue}15`,
                    border: `1px solid ${role.badgeColor ?? T.signalBlue}40`,
                    borderRadius: 999, padding: '2px 8px',
                    letterSpacing: '0.04em',
                  }}>
                    {role.badge}
                  </span>
                )}
              </div>
              <p style={{
                fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 400,
                color: T.ash, letterSpacing: '-0.01em', lineHeight: 1.5,
                margin: 0,
              }}>
                {role.description}
              </p>
            </div>

            {/* Arrow */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              border: `1px solid ${T.mist}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.fog, alignSelf: 'center',
            }}>
              <ArrowRight size={13} />
            </div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <p style={{
        fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 400,
        color: T.fog, letterSpacing: '-0.01em', textAlign: 'center',
        lineHeight: 1.5, margin: 0,
      }}>
        Access is restricted to authorised personnel.<br />
        All actions are logged for compliance.
      </p>
    </div>
  );
}

// ── LoginPage root ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div style={{
      minHeight: '100vh',
      background: T.parchment,
      display: 'flex',
      fontFamily: "'Manrope', sans-serif",
    }}>

      {/* ── Left — editorial panel ── */}
      <div style={{
        flex: '0 0 52%',
        background: T.dusk,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
      }}>
        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Top — brand */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{
              width: 36, height: 36,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={18} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontStyle: 'italic', fontWeight: 400,
                fontSize: 18, color: 'rgba(255,255,255,0.9)',
                letterSpacing: '-0.02em',
              }}>
                <em style={{ fontStyle: 'italic', color: '#f97316' }}>Atma</em>rakshak
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1,
              }}>
                आत्मरक्षक · v2.4
              </div>
            </div>
          </div>

          {/* Hero headline */}
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic', fontWeight: 400,
            fontSize: 54, lineHeight: 1.1,
            letterSpacing: '-1.08px',
            color: 'rgba(255,255,255,0.92)',
            margin: 0, maxWidth: 440,
          }}>
            Fire detected.<br />
            Seconds matter.
          </h1>
          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: 16, fontWeight: 400, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.45)',
            marginTop: 20, maxWidth: 380,
          }}>
            AI-powered indoor fire and smoke detection running on your CCTV network,
            with verified temporal confirmation and instant emergency routing.
          </p>
        </div>

        {/* Middle — feature list */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { label: 'YOLOv8x detection', detail: 'Fire · Smoke · Water leak · 2–5 FPS frames' },
            { label: 'Temporal verification', detail: '5+ consecutive frame confirmation, zero false alarms' },
            { label: 'ERSS / 112 routing', detail: 'Auto-escalation to nearest fire dispatch via ERSS' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '14px 0',
              borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#f97316', flexShrink: 0, marginTop: 7,
              }} />
              <div>
                <div style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 14, fontWeight: 600,
                  color: 'rgba(255,255,255,0.75)',
                  letterSpacing: '-0.01em',
                }}>{f.label}</div>
                <div style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 13, fontWeight: 400,
                  color: 'rgba(255,255,255,0.35)',
                  marginTop: 2, lineHeight: 1.4,
                }}>{f.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom — system status */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 8px #4ade8080',
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              System Operational · API: localhost:3001
            </span>
          </div>
        </div>
      </div>

      {/* ── Right — auth panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {selectedRole === null ? (
            <PortalSelect onSelectRole={setSelectedRole} />
          ) : (
            <LoginForm role={selectedRole} onBack={() => setSelectedRole(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
