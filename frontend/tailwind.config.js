/** @type {import('tailwindcss').Config} */
export default {
  /**
   * Theme strategy:
   *  - Default (no attribute) = Dark — Gruvbox
   *  - [data-theme="light"]   = Light — GIC parchment
   *
   * Both class and data-attribute are supported so either
   *   <html class="dark">  or  <html data-theme="dark">
   * enables dark mode.
   */
  darkMode: ["class", '[data-theme="dark"]'],

  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      // ══════════════════════════════════════════════
      // COLORS
      // ══════════════════════════════════════════════
      colors: {
        // ── GIC Light palette ─────────────────────
        // Usage: bg-parchment, text-graphite, border-mist …
        parchment:   "#fefffc",
        paper:       "#ffffff",
        linen:       "#f9faf7",
        "ink-black": "#171717",
        graphite:    "#2c2c2c",
        charcoal:    "#444141",
        ash:         "#646464",
        fog:         "#b4b8b4",
        mist:        "#dee2de",
        twilight:    "#282834",
        dusk:        "#1f1f29",
        "signal-blue": "#41a1cf",
        cerulean:    "#0081c0",

        // ── Gruvbox Dark palette ───────────────────
        // Usage: dark:bg-gruvbox-bg, dark:text-gruvbox-fg1 …
        gruvbox: {
          // backgrounds
          "bg0-h": "#1d2021",   // deepest
          "bg0":   "#282828",   // main canvas
          "bg0-s": "#32302f",   // input
          "bg1":   "#3c3836",   // elevated / cards
          "bg2":   "#504945",   // hover
          "bg3":   "#665c54",   // strong border
          "bg4":   "#7c6f64",   // subtle ui
          // neutrals
          "gray":  "#928374",
          "fg4":   "#a89984",
          "fg3":   "#bdae93",
          "fg2":   "#d5c4a1",
          "fg1":   "#ebdbb2",   // primary text
          "fg0":   "#fbf1c7",   // brightest text
          // accent colours
          "red":    "#fb4934",
          "green":  "#b8bb26",
          "yellow": "#fabd2f",
          "blue":   "#83a598",
          "purple": "#d3869b",
          "aqua":   "#8ec07c",
          "orange": "#fe8019",
          // bright variants
          "red-b":    "#cc241d",
          "green-b":  "#98971a",
          "yellow-b": "#d79921",
          "blue-b":   "#458588",
          "purple-b": "#b16286",
          "aqua-b":   "#689d6a",
          "orange-b": "#d65d0e",
        },

        // ── Semantic / hazard ──────────────────────
        // These reference the CSS variables so they
        // automatically switch with the theme.
        hazard: {
          fire:  "#e11d48",
          smoke: "#475569",
          water: "#2563eb",
        },

        // ── Legacy Material tokens (backward compat) ──
        "on-tertiary-fixed-variant": "#3a485c",
        "secondary-fixed-dim":       "#c8c6c3",
        secondary:                   "#5e5e5c",
        "on-tertiary-container":     "#374559",
        "surface-bright":            "#fbf9f9",
        "on-surface-variant":        "#534434",
        "on-secondary-container":    "#636360",
        "inverse-on-surface":        "#f2f0f0",
        "on-tertiary-fixed":         "#0d1c2f",
        divider:                     "#e5e1da",
        "surface-container-highest": "#e4e2e2",
        "outline-variant":           "#d8c3ad",
        "primary-fixed-dim":         "#ffb95f",
        surface:                     "#fbf9f9",
        "surface-elevated":          "#ffffff",
        tertiary:                    "#515f74",
        "secondary-container":       "#e1dfdc",
        "surface-container-low":     "#f5f3f3",
        primary:                     "#855300",
        "tertiary-fixed-dim":        "#b9c7e0",
        "primary-container":         "#f59e0b",
        "inverse-surface":           "#303031",
        background:                  "#fbf9f9",
        "surface-container":         "#efeded",
        "inverse-primary":           "#ffb95f",
        "on-primary-container":      "#613b00",
        "surface-dim":               "#dbdada",
        "on-error":                  "#ffffff",
        "tertiary-fixed":            "#d5e3fd",
        "error-container":           "#ffdad6",
        "on-tertiary":               "#ffffff",
        "on-primary":                "#ffffff",
        outline:                     "#867461",
        "surface-container-lowest":  "#ffffff",
        "on-secondary":              "#ffffff",
        "on-secondary-fixed-variant":"#474744",
        "secondary-fixed":           "#e4e2de",
        "on-secondary-fixed":        "#1b1c1a",
        "tertiary-container":        "#a3b2ca",
        "hazard-fire":               "#e11d48",
        "hazard-smoke":              "#475569",
        "hazard-water":              "#2563eb",
        "on-primary-fixed-variant":  "#653e00",
        "surface-tint":              "#855300",
        error:                       "#ba1a1a",
        "surface-variant":           "#e4e2e2",
        "on-surface":                "#1b1c1c",
        "on-error-container":        "#93000a",
        "surface-container-high":    "#e9e8e8",
        "on-primary-fixed":          "#2a1700",
        "primary-fixed":             "#ffddb8",
      },

      // ══════════════════════════════════════════════
      // BORDER RADIUS
      // ══════════════════════════════════════════════
      borderRadius: {
        DEFAULT: "0.125rem",   // 2px
        sm:      "0.25rem",    // 4px  buttons
        md:      "0.5rem",     // 8px  inputs / buttons
        lg:      "0.75rem",    // 12px cards
        xl:      "1rem",       // 16px large cards
        "2xl":   "1.5rem",     // 24px hero / atmospheric
        full:    "9999px",     // pill
      },

      // ══════════════════════════════════════════════
      // SPACING
      // ══════════════════════════════════════════════
      spacing: {
        margin:          "24px",
        gutter:          "16px",
        unit:            "4px",
        "container-max": "1920px",
      },

      // ══════════════════════════════════════════════
      // FONT FAMILIES
      // ══════════════════════════════════════════════
      fontFamily: {
        // Primary GIC stack
        display:  ["Fraunces", "Georgia", "serif"],
        body:     ["Manrope", "system-ui", "sans-serif"],
        mono:     ["JetBrains Mono", "IBM Plex Mono", "monospace"],
        // Legacy aliases
        "data-mono":  ["JetBrains Mono", "monospace"],
        "body-base":  ["Manrope", "Geist", "Inter", "sans-serif"],
        "label-xs":   ["JetBrains Mono", "monospace"],
        "display-lg": ["Fraunces", "Geist", "sans-serif"],
        "headline-md":["Manrope", "Geist", "sans-serif"],
        "headline-sm":["Manrope", "Geist", "sans-serif"],
        "body-sm":    ["Manrope", "Geist", "sans-serif"],
        "data-lg":    ["JetBrains Mono", "monospace"],
      },

      // ══════════════════════════════════════════════
      // FONT SIZES
      // ══════════════════════════════════════════════
      fontSize: {
        "data-mono":   ["13px", { lineHeight:"16px",  letterSpacing:"-0.01em", fontWeight:"600" }],
        "body-base":   ["14px", { lineHeight:"20px",  fontWeight:"500" }],
        "body-sm":     ["12px", { lineHeight:"16px",  fontWeight:"500" }],
        "label-xs":    ["11px", { lineHeight:"12px",  letterSpacing:"0.02em", fontWeight:"500" }],
        "display-lg":  ["40px", { lineHeight:"48px",  letterSpacing:"-0.02em", fontWeight:"700" }],
        "headline-md": ["24px", { lineHeight:"32px",  fontWeight:"600" }],
        "headline-sm": ["18px", { lineHeight:"24px",  fontWeight:"600" }],
        "data-lg":     ["18px", { lineHeight:"24px",  fontWeight:"600" }],
      },

      // ══════════════════════════════════════════════
      // BOX SHADOWS
      // ══════════════════════════════════════════════
      boxShadow: {
        // Light theme (GIC)
        card:    "0 1px 1px rgba(0,0,0,0.06), 0 4px 5px rgba(0,0,0,0.04)",
        nav:     "0 2px 6px rgba(0,0,0,0.10)",
        diagram: "0 1px 8px rgba(0,0,0,0.05)",
        subtle:  "0 1px 1px rgba(0,0,0,0.08), 0 4px 5px rgba(0,0,0,0.06)",
        // Dark theme (Gruvbox — deeper)
        "dark-sm": "0 1px 2px rgba(0,0,0,0.30), 0 4px 8px rgba(0,0,0,0.20)",
        "dark-md": "0 2px 8px rgba(0,0,0,0.35)",
        "dark-lg": "0 4px 24px rgba(0,0,0,0.45)",
      },
    },
  },

  plugins: [],
};
