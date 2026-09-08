/**
 * ThemeContext — global light/dark theme toggle
 *
 * - Dark  = Gruvbox (:root defaults, no attribute)
 * - Light = GIC parchment ([data-theme="light"] on <html>)
 *
 * Persists to localStorage. Defaults to dark.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('atma-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Apply to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem('atma-theme', theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
