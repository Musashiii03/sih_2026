/**
 * ThemeToggle — floating pill button
 * Dark: Gruvbox sun icon  →  Light: GIC moon icon
 * Position: fixed bottom-right, above footer bars
 */
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      style={{
        position: 'fixed',
        bottom: 52,           // just above footer bar
        right: 20,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 14px',
        borderRadius: 999,
        border: `1px solid ${isDark ? '#504945' : '#dee2de'}`,
        background: isDark ? '#3c3836' : '#ffffff',
        color: isDark ? '#ebdbb2' : '#2c2c2c',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.05em',
        cursor: 'pointer',
        boxShadow: isDark
          ? '0 2px 8px rgba(0,0,0,0.4)'
          : '0 1px 4px rgba(0,0,0,0.10)',
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = isDark
          ? '0 4px 16px rgba(0,0,0,0.5)'
          : '0 2px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = isDark
          ? '0 2px 8px rgba(0,0,0,0.4)'
          : '0 1px 4px rgba(0,0,0,0.10)';
      }}
    >
      {isDark ? (
        <>
          <Sun size={13} strokeWidth={2} />
          Light
        </>
      ) : (
        <>
          <Moon size={13} strokeWidth={2} />
          Dark
        </>
      )}
    </button>
  );
}
