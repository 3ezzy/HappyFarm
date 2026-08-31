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
  // ------------------------------------------------------------
  // LEGACY — the original "farm" palette. Still read by ~15 pages not
  // yet migrated to Meadow (Animals, AnimalDetails, AddAnimal, EditAnimal,
  // Farm, Reports, Inventory, Profile, AdminUsers, the 4 animal-section
  // files, ConfirmModal). Remove this whole block once those are migrated
  // in a later redesign slice — do not add new consumers of these keys.
  // ------------------------------------------------------------
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
  redSoft: '#FCE7E5',
  redLine: '#F6CFCB',
  greenLine: '#C7E9D2',
  leafPale: '#BEE6D5',
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

/* Per-species card tints — legacy palette. Still consumed by the
   not-yet-migrated pages listed above; see MEADOW's sheepTag/goatTag/etc.
   for the new tag-specific (not card-tint) species colors. */
export const SPECIES_BG = {
  sheep: '#DCEAF8',
  goat: '#D6EBDB',
  cow: '#F7E6BE',
  camel: '#FADCC6',
}
