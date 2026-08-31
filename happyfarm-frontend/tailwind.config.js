import { C } from './src/theme/colors.js'

/** @type {import('tailwindcss').Config} */

/*
  Colours come from src/theme/colors.js so the palette has one home, shared
  with the JS that needs raw values for SVG fills.
*/
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    // Full screen list so the two custom breakpoints (previously raw media
    // queries in index.css) sit in the correct ascending position without
    // changing what sm/md/lg/xl mean.
    screens: {
      xs: '560px',
      sm: '640px',
      md: '768px',
      wide: '860px',
      // Sidebar-collapse breakpoint for the Meadow app shell — deliberately
      // separate from `wide` (860px), which is already used for unrelated
      // two-column grid breakpoints on several pages.
      nav: '900px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // ---- Meadow (current design system) ----
        ink: {
          900: C.ink900,
          700: C.ink700,
          500: C.ink500,
          400: C.ink400,
        },
        surface: {
          page: C.page,
          card: C.card,
          sunken: C.sunken,
        },
        meadow: {
          900: C.meadow900,
          700: C.meadow700,
          500: C.meadow500,
          100: C.meadow100,
          50: C.meadow50,
        },
        eartag: {
          500: C.eartag500,
          700: C.eartag700,
          100: C.eartag100,
          50: C.eartag50,
        },
        ok: { fg: C.okFg, bg: C.okBg },
        warn: { fg: C.warnFg, bg: C.warnBg },
        danger: { fg: C.dangerFg, bg: C.dangerBg },
        hold: { fg: C.holdFg, bg: C.holdBg },
        info: { fg: C.infoFg, bg: C.infoBg },
        sheep: { DEFAULT: C.sheep, bg: C.sheepBg },
        goat: { DEFAULT: C.goat, bg: C.goatBg },
        cow: { DEFAULT: C.cow, bg: C.cowBg },
        camel: { DEFAULT: C.camel, bg: C.camelBg },
        line: {
          DEFAULT: C.line,
          strong: C.lineStrong,
        },

        // ---- Shared (not Meadow-specific, but still actively used — see colors.js) ----
        pageBg: C.pageBg,
        scrim: C.scrim,
      },
      // Readex Pro (display) / IBM Plex Sans Arabic (the one UI family for
      // all 3 locales) / IBM Plex Mono (anything countable — tag IDs,
      // weights, dates, ledger figures). Replaces the old Zilla
      // Slab/Libre Franklin/Noto Sans Arabic set entirely — no `arabic`
      // key anymore, since one UI family now covers every locale.
      fontFamily: {
        display: ['Readex Pro', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        sans: ['IBM Plex Sans Arabic', 'Readex Pro', 'system-ui', '-apple-system', 'sans-serif'],
        data: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing }] — Meadow's type scale.
        // Deliberately does NOT define `sm`/`base` here: those key names
        // already exist in Tailwind's default scale, and `extend` merges
        // by key — redefining them would silently resize `text-sm`/
        // `text-base` app-wide. Tailwind's existing sm(14px)/base(16px)
        // are close enough to Meadow's spec (13px/15px) to reuse as-is.
        caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.06em' }],
        h3: ['1.0625rem', { lineHeight: '1.4' }],
        h2: ['1.25rem', { lineHeight: '1.35' }],
        h1: ['1.5rem', { lineHeight: '1.3' }],
        d2: ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        d1: ['2.5rem', { lineHeight: '1.14', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        pill: '999px',
      },
      boxShadow: {
        // ---- Meadow ----
        e1: '0 1px 2px rgba(19, 26, 20, .06)',
        e2: '0 4px 12px rgba(19, 26, 20, .08)',
        e3: '0 12px 32px rgba(19, 26, 20, .12)',
        focus: '0 0 0 3px rgba(27, 99, 73, .28)',
        // ---- Legacy (still consumed by ~15 not-yet-migrated pages) ----
        chip: '0 2px 4px rgba(0,0,0,0.16)',
        mark: '0 2px 4px rgba(0,0,0,0.18)',
        ribbon: '0 4px 10px -1px rgba(107,92,67,0.20)',
        soft: '0 2px 4px rgba(107,92,67,0.16)',
        card: '0 16px 30px -5px rgba(107,92,67,0.26)',
        toast: '0 10px 20px -3px rgba(107,92,67,0.22)',
      },
      spacing: {
        xs: '4px', sm: '8px', md: '12px', lg: '16px',
        xl: '24px', '2xl': '32px', '3xl': '48px', '4xl': '64px',
        sidebar: '240px',
      },
      maxWidth: {
        content: '1280px',
      },
      transitionTimingFunction: {
        pop: 'cubic-bezier(0.68,-0.55,0.265,1.55)',
        hf: 'cubic-bezier(.2,.8,.3,1)',
      },
      transitionDuration: {
        hf: '160ms',
      },
      keyframes: {
        'hf-pop': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'hf-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'hf-modal': {
          '0%': { opacity: '0', transform: 'scale(.6)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'hf-pop': 'hf-pop .45s cubic-bezier(0.68,-0.55,0.265,1.55) both',
        'hf-fade': 'hf-fade .4s ease both',
        'hf-modal': 'hf-modal .4s cubic-bezier(0.68,-0.55,0.265,1.55) both',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
