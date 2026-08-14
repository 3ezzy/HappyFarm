import { C, SPECIES_BG } from './src/theme/colors.js'

/** @type {import('tailwindcss').Config} */

/*
  Colours come from src/theme/colors.js so the palette has one home, shared
  with the JS that needs raw values for SVG fills.

  Note: `green`, `red`, `blue` and `yellow` intentionally shadow Tailwind's
  default scales. The design uses a fixed palette, so shading utilities like
  `bg-green-500` are deliberately unavailable — use the tokens instead.
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
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        pageBg: C.pageBg,
        green: {
          DEFAULT: C.green,
          dark: C.greenDark,
          soft: C.greenSoft,
          soft2: C.greenSoft2,
          line: C.greenLine,
          pale: C.leafPale,
          hover: C.greenHover,
          badge: C.greenBadge,
          badgeBg: C.greenBadgeBg,
          muted: C.greenMuted,
          border: C.greenBorder,
        },
        disabled: {
          DEFAULT: C.disabledBg,
          text: C.disabledText,
        },
        scrim: C.scrim,
        cream: {
          DEFAULT: C.cream,
          muted: C.creamMuted,
        },
        brown: {
          DEFAULT: C.brown,
          text: C.brownText,
          dark: C.brownDark,
        },
        tan: C.tan,
        yellow: {
          DEFAULT: C.yellow,
          text: C.yellowText,
          badge: C.yellowBadge,
          badgeBg: C.yellowBadgeBg,
          line: C.yellowLine,
          deep: C.yellowDeep,
        },
        toggleOff: C.toggleOff,
        sand: C.sand,
        line: {
          DEFAULT: C.border,
          input: C.inputBorder,
        },
        red: {
          DEFAULT: C.red,
          dark: C.redDark,
          soft: C.redSoft,
          line: C.redLine,
        },
        blue: {
          DEFAULT: C.blue,
          dark: C.blueDark,
          soft: C.blueSoft,
        },
        // Per-species card tints (previously ANIMAL_META[type].bg)
        species: SPECIES_BG,
      },
      fontFamily: {
        sans: ['Libre Franklin', 'system-ui', 'sans-serif'],
        display: ['Zilla Slab', 'serif'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
      },
      boxShadow: {
        chip: '0 2px 4px rgba(0,0,0,0.16)',
        mark: '0 2px 4px rgba(0,0,0,0.18)',
        ribbon: '0 4px 10px -1px rgba(107,92,67,0.20)',
        soft: '0 2px 4px rgba(107,92,67,0.16)',
        card: '0 16px 30px -5px rgba(107,92,67,0.26)',
        toast: '0 10px 20px -3px rgba(107,92,67,0.22)',
      },
      transitionTimingFunction: {
        pop: 'cubic-bezier(0.68,-0.55,0.265,1.55)',
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
        'hf-modal': 'hf-modal .3s cubic-bezier(0.68,-0.55,0.265,1.55) both',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
