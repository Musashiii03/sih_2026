/**
 * UserProfile — Atmarakshak Owner Portal
 *
 * Fetches and displays user profile data from the /api/users/:id endpoint.
 * Supports inline editing of first_name, last_name, phone.
 * Matches the ApexConsole dark industrial design language.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  CalendarDays,
  ArrowLeft,
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useTheme } from '../context/ThemeContext';
import './ApexConsole.css';

/* ─── helpers ───────────────────────────────────────────────── */

function statusColor(status) {
  switch (status) {
    case 'ACTIVE':    return '#4ade80';
    case 'INACTIVE':  return '#fabd2f';
    case 'SUSPENDED': return '#fb4934';
    case 'PENDING':   return '#83a598';
    default:          return '#767d74';
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function initials(user) {
  if (!user) return '??';
  return `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase();
}

/* ─── sub-components ─────────────────────────────────────────── */

function InfoRow({ icon: Icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '14px 0',
      borderBottom: '1px solid var(--apex-border-dim)',
    }}>
      <div style={{
        width: 36, height: 36,
        borderRadius: 8,
        background: 'rgba(254,128,25,0.08)',
        border: '1px solid rgba(254,128,25,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color="#fe8019" />
      </div>
      <div>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: accent || 'var(--apex-text-primary)' }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

function EditableField({ label, value, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value || '');

  const commit = async () => {
    if (draft.trim() === value) { setEditing(false); return; }
    await onSave(draft.trim());
    setEditing(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--apex-border-dim)',
      gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--apex-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          {label}
        </div>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{
              width: '100%',
              background: 'rgba(29,32,33,0.9)',
              border: '1px solid rgba(254,128,25,0.45)',
              borderRadius: 6,
              padding: '7px 10px',
              color: '#f0ede4',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              outline: 'none',
            }}
          />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--apex-text-primary)' }}>
            {value || '—'}
          </div>
        )}
      </div>

      {/* action buttons */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {editing ? (
          <>
            <button
              onClick={commit}
              disabled={saving}
              style={{
                background: 'rgba(74,222,128,0.12)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                color: '#4ade80',
                display: 'flex', alignItems: 'center',
              }}
            >
              {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
            </button>
            <button
              onClick={() => { setDraft(value || ''); setEditing(false); }}
              style={{
                background: 'rgba(251,73,52,0.1)',
                border: '1px solid rgba(251,73,52,0.25)',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                color: '#fb4934',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={() => { setDraft(value || ''); setEditing(true); }}
            style={{
              background: 'rgba(254,128,25,0.08)',
              border: '1px solid rgba(254,128,25,0.2)',
              borderRadius: 6,
              padding: '5px 10px',
              cursor: 'pointer',
              color: '#fe8019',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────── */

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  // Fallback: if no id in URL, try localStorage (set at login)
  const userId = id || localStorage.getItem('atma-user-id') || '1';

  const { user, loading, error, updateProfile } = useUserProfile(userId);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (text, type = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpdate = async (field, value) => {
    setSaving(true);
    const result = await updateProfile({ [field]: value });
    setSaving(false);
    if (result.success) {
      showToast(`${field.replace('_', ' ')} updated`, 'success');
    } else {
      showToast(result.error || 'Update failed', 'error');
    }
  };

  /* ── roles list ── */
  const roles = user?.roles || [];

  /* ── buildings from ownerships ── */
  const buildings = (user?.ownerships || []).flatMap(o => o.buildings || []);

  /* ── render ── */
  return (
    <div className="apex-app-root" style={{ overflow: 'auto' }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'success' ? 'rgba(74,222,128,0.12)' : toast.type === 'error' ? 'rgba(251,73,52,0.12)' : 'rgba(250,189,47,0.1)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,0.4)' : toast.type === 'error' ? 'rgba(251,73,52,0.4)' : 'rgba(250,189,47,0.35)'}`,
          borderRadius: 10,
          padding: '12px 20px',
          color: toast.type === 'success' ? '#4ade80' : toast.type === 'error' ? '#fb4934' : '#fabd2f',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          fontWeight: 600,
          backdropFilter: 'blur(12px)',
        }}>
          {toast.text}
        </div>
      )}

      {/* ── Page wrapper ── */}
      <div style={{
        marginLeft: 0,
        padding: '36px 40px',
        minHeight: '100vh',
        maxWidth: 900,
        margin: '0 auto',
        width: '100%',
      }}>

        {/* Back + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '8px 14px',
              color: 'var(--apex-text-secondary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(254,128,25,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--apex-text-primary)', fontFamily: 'Rajdhani, Manrope, sans-serif', letterSpacing: '0.04em' }}>
              USER PROFILE
            </div>
            <div style={{ fontSize: 11, color: 'var(--apex-text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
              ATMARAKSHAK OWNER PORTAL · ACCOUNT SETTINGS
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              marginLeft: 'auto',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '8px 14px',
              color: 'var(--apex-text-secondary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600,
            }}
          >
            {theme === 'dark' ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--apex-text-muted)' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#fe8019' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>Loading profile…</span>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 300, gap: 12, color: '#fb4934',
          }}>
            <AlertTriangle size={32} />
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>Failed to load profile</div>
            <div style={{ fontSize: 12, color: 'var(--apex-text-muted)' }}>{error}</div>
          </div>
        )}

        {/* ── Profile content ── */}
        {!loading && !error && user && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* LEFT: Identity card */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{
                background: 'var(--apex-bg-card)',
                border: '1px solid var(--apex-border)',
                borderRadius: 14,
                padding: '28px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* background glow */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'radial-gradient(ellipse 60% 80% at 10% 50%, rgba(254,128,25,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* Avatar */}
                <div style={{
                  width: 80, height: 80, flexShrink: 0,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(254,128,25,0.25) 0%, rgba(251,73,52,0.2) 100%)',
                  border: '2px solid rgba(254,128,25,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Rajdhani, monospace',
                  fontSize: 26, fontWeight: 700,
                  color: '#fe8019',
                  letterSpacing: '0.04em',
                  boxShadow: '0 0 32px rgba(254,128,25,0.2)',
                }}>
                  {initials(user)}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--apex-text-primary)', fontFamily: 'Rajdhani, Manrope, sans-serif', letterSpacing: '0.03em' }}>
                    {user.first_name} {user.last_name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--apex-text-muted)', marginTop: 4 }}>
                    {user.email}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {/* Status badge */}
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10, fontWeight: 700,
                      color: statusColor(user.status),
                      border: `1px solid ${statusColor(user.status)}55`,
                      background: `${statusColor(user.status)}14`,
                      padding: '3px 10px', borderRadius: 6,
                      letterSpacing: '0.06em',
                    }}>
                      {user.status}
                    </span>
                    {/* Role badges */}
                    {roles.map(r => (
                      <span key={r.id} style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10, fontWeight: 700,
                        color: '#83a598',
                        border: '1px solid rgba(131,165,152,0.3)',
                        background: 'rgba(131,165,152,0.08)',
                        padding: '3px 10px', borderRadius: 6,
                        letterSpacing: '0.06em',
                      }}>
                        {r.display_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* User ID chip */}
                <div style={{
                  position: 'absolute', top: 18, right: 20,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11, color: 'var(--apex-text-dim)',
                  letterSpacing: '0.04em',
                }}>
                  UID · {String(user.id).padStart(4, '0')}
                </div>
              </div>
            </div>

            {/* LEFT column: Editable info */}
            <div style={{
              background: 'var(--apex-bg-card)',
              border: '1px solid var(--apex-border)',
              borderRadius: 14,
              padding: '24px 28px',
            }}>
              <div style={{
                fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--apex-text-muted)', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 18,
                paddingBottom: 12, borderBottom: '1px solid var(--apex-border)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Pencil size={13} color="#fe8019" />
                Editable Fields
              </div>

              <EditableField
                label="First Name"
                value={user.first_name}
                saving={saving}
                onSave={v => handleUpdate('first_name', v)}
              />
              <EditableField
                label="Last Name"
                value={user.last_name}
                saving={saving}
                onSave={v => handleUpdate('last_name', v)}
              />
              <EditableField
                label="Phone"
                value={user.phone}
                saving={saving}
                onSave={v => handleUpdate('phone', v)}
              />
            </div>

            {/* RIGHT column: Read-only info */}
            <div style={{
              background: 'var(--apex-bg-card)',
              border: '1px solid var(--apex-border)',
              borderRadius: 14,
              padding: '24px 28px',
            }}>
              <div style={{
                fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--apex-text-muted)', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 18,
                paddingBottom: 12, borderBottom: '1px solid var(--apex-border)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <User size={13} color="#fe8019" />
                Account Info
              </div>

              <InfoRow icon={Mail}         label="Email"       value={user.email} />
              <InfoRow icon={CalendarDays} label="Member Since" value={formatDate(user.created_at)} />
              <InfoRow
                icon={Shield}
                label="Account Status"
                value={user.status}
                accent={statusColor(user.status)}
              />
              {roles.length > 0 && (
                <InfoRow
                  icon={Shield}
                  label="Roles"
                  value={roles.map(r => r.display_name).join(', ')}
                />
              )}
            </div>

            {/* Buildings panel — full width if any */}
            {buildings.length > 0 && (
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--apex-bg-card)',
                border: '1px solid var(--apex-border)',
                borderRadius: 14,
                padding: '24px 28px',
              }}>
                <div style={{
                  fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--apex-text-muted)', letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: 18,
                  paddingBottom: 12, borderBottom: '1px solid var(--apex-border)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <Building2 size={13} color="#fe8019" />
                  Associated Buildings ({buildings.length})
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                  {buildings.map(b => (
                    <div key={b.id} style={{
                      background: 'var(--apex-bg-surface)',
                      border: '1px solid var(--apex-border)',
                      borderRadius: 10,
                      padding: '16px 18px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Layers size={15} color="#83a598" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--apex-text-primary)' }}>
                          {b.name}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--apex-text-muted)' }}>
                        {b.building_type} · {b.number_of_floors} floors
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10, fontWeight: 700,
                          color: statusColor(b.status),
                          border: `1px solid ${statusColor(b.status)}55`,
                          background: `${statusColor(b.status)}14`,
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No buildings notice */}
            {buildings.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--apex-bg-card)',
                border: '1px solid var(--apex-border)',
                borderRadius: 14,
                padding: '28px',
                textAlign: 'center',
                color: 'var(--apex-text-muted)',
                fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                <Building2 size={28} style={{ margin: '0 auto 10px', color: 'var(--apex-text-dim)' }} />
                No buildings associated with this account.
              </div>
            )}

          </div>
        )}
      </div>

      {/* Loader keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
