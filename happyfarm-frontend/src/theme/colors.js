/* ============================================================
   HappyFarm — palette (single source of truth)

   Consumed in two places:
     1. tailwind.config.js, which turns these into utility classes
        (bg-meadow-700, text-ink-900, border-line, ...)
     2. JS that needs a raw colour value where a class cannot reach —
        SVG `fill`/`stroke` attributes, canvas, inline gradients.

   Markup should use the Tailwind classes. Only reach for `C` when the
   value has to be passed to something that isn't CSS.
   ============================================================ */

export const C = {
  // ------------------------------------------------------------
  // SHARED — not part of the Meadow per-page palette, but still actively
  // used outside it. pageBg backs the pre-auth/pre-i18n bootstrap loading
  // screens (App.jsx, ProtectedRoute.jsx) that render before the Meadow
  // app shell mounts, so they can't reach into it. scrim is the shared
  // modal-overlay wash used by ConfirmModal/BirthModal, deliberately kept
  // cross-cutting rather than migrated per-page.
  // ------------------------------------------------------------
  pageBg: '#E7F4EC',
  scrim: 'rgba(58,47,32,0.5)',

  // ------------------------------------------------------------
  // MEADOW — the current design system. Mirrors the CSS custom
  // properties in theme/hf-tokens.css exactly (same hex values); kept in
  // sync by hand since there's no token-build pipeline. This is what raw
  // JS consumers (Recharts fills, SVG fills, the Toaster) should read.
  // ------------------------------------------------------------
  ink900: '#131A14',
  ink700: '#2C382D',
  ink500: '#5A665A',
  ink400: '#7C877B',

  page: '#F3F5F1',
  card: '#FFFFFF',
  sunken: '#EAEEE7',
  line: '#DFE5DC',
  lineStrong: '#C6D0C3',

  meadow900: '#10402F',
  meadow700: '#1B6349',
  meadow500: '#2E8B66',
  meadow100: '#DCEDE4',
  meadow50: '#EFF6F1',

  eartag500: '#F2B807',
  eartag700: '#A97A05',
  eartag100: '#FDF0C6',
  eartag50: '#FEF8E4',

  okFg: '#1B6349', okBg: '#DCEDE4',
  warnFg: '#9C6704', warnBg: '#FDF0C6',
  dangerFg: '#A32E20', dangerBg: '#F7E2DE',
  holdFg: '#4F5A68', holdBg: '#E6EAEF',
  infoFg: '#2A5D86', infoBg: '#DEEAF3',

  sheep: '#5C8391', sheepBg: '#EBF1F3',
  goat: '#8A6D2F', goatBg: '#F4EFE3',
  cow: '#9A5B3D', cowBg: '#F6EBE6',
  camel: '#C08A3E', camelBg: '#FAF0E0',

  chart1: '#1B6349', chart2: '#2A5D86', chart3: '#C08A3E',
  chart4: '#A32E20', chart5: '#6C5B9E', chart6: '#5C8391',
  chartGrid: '#E3E8E0',
}
