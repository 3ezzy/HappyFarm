/* ============================================================
   HappyFarm — palette (single source of truth)

   Consumed in two places:
     1. tailwind.config.js, which turns these into utility classes
        (bg-green, text-brown-text, border-line-input, ...)
     2. JS that needs a raw colour value where a class cannot reach —
        SVG `fill`/`stroke` attributes, canvas, inline gradients.

   Markup should use the Tailwind classes. Only reach for `C` when the
   value has to be passed to something that isn't CSS.
   ============================================================ */

export const C = {
  pageBg: '#E7F4EC',
  green: '#008160',
  greenDark: '#00684D',
  greenSoft: '#E2F4EC',
  greenSoft2: '#EAF7EF',
  cream: '#FBFAF1',
  brown: '#6B5C43',
  brownText: '#574A30',
  brownDark: '#51442F',
  tan: '#8A7B60',
  yellow: '#E29A2B',
  sand: '#F3F0E1',
  border: '#C9BD9F',
  inputBorder: '#BBAE8C',
  red: '#D83A3A',
  redDark: '#B12B2B',
  blue: '#68A1D7',
  blueDark: '#2D6895',
  // Soft alert surfaces — previously hardcoded hexes in AuthScreen/main.
  redSoft: '#FCE7E5',
  redLine: '#F6CFCB',
  greenLine: '#C7E9D2',
  leafPale: '#BEE6D5',
  // Previously hardcoded in Dashboard/Animals badges and banners.
  creamMuted: '#ECE7D2',
  yellowText: '#7A5A18',
  greenHover: '#DCEFE8',
  greenBadge: '#2E7A48',
  greenBadgeBg: '#E4F5E9',
  blueSoft: '#EAF2FB',
  yellowBadge: '#B8771A',
  yellowBadgeBg: '#FBF1DD',
  yellowLine: '#F5E2B8',
  toggleOff: '#D9E8D2',
  yellowDeep: '#8A5912',
  greenMuted: '#5FAE7E',
  greenBorder: '#9BD9C2',
  disabledBg: '#ECE9DC',
  disabledText: '#A99E86',
  scrim: 'rgba(58,47,32,0.5)',
}

/* Per-species card tints. */
export const SPECIES_BG = {
  sheep: '#DCEAF8',
  goat: '#D6EBDB',
  cow: '#F7E6BE',
  camel: '#FADCC6',
}
