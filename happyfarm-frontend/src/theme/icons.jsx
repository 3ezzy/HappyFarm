/* ============================================================
   HappyFarm — shared icon registry (Meadow design system)

   One line-icon language for the whole app: 20x20 viewBox, fill="none",
   stroke="currentColor", strokeWidth ~1.5, round caps/joins. Icons take
   their color from whatever text-color class their wrapping element
   already has — no icon needs its own color decision. Originally
   established in Sidebar's nav icons; consolidated here so every
   consumer (nav, care actions, status, alerts, warnings) shares one
   registry instead of each page inventing its own icon.

   `eligible`/`notEligible` are the one exception to fill="none": the
   filled crescent carries the "eligible" meaning by itself (see Eligibility
   in hf.jsx), so it fills with currentColor rather than only stroking.
   ============================================================ */

export const Icon = {
  // ---- Nav (relocated from Sidebar.jsx, unchanged) ----
  overview: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  animals: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <circle cx="10" cy="12.2" r="3.3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4.6" cy="7.4" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.4" cy="7.4" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="4.8" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  farm: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M3 9.5 10 3.5l7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 8.5V16h11V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.3 16v-4.2h3.4V16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  reports: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M3.5 16.5v-5M9 16.5V6M14.5 16.5v-8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  inventory: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M3 6.3 10 3l7 3.3-7 3.3-7-3.3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 6.3V14l7 3.2V9.6M17 6.3V14l-7 3.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  profile: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.8 16.5c1-3 3.4-4.5 6.2-4.5s5.2 1.5 6.2 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  admin: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M10 2.8 16 5v4.4c0 4-2.6 6.9-6 8.1-3.4-1.2-6-4.1-6-8.1V5l6-2.2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.4 10 9.2 11.8 12.8 8.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // ---- Care actions ----
  feed: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M10 17V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 6.2 7.3 8.6M10 6.2l2.7 2.4M10 9.8 7.1 12M10 9.8l2.9 2.2M10 13.3 7.5 15.4M10 13.3l2.5 2.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  groom: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M10 3 11.3 8.7 17 10 11.3 11.3 10 17 8.7 11.3 3 10 8.7 8.7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  // Cupped, open hands — the same neutral offering glyph used for the
  // "sacrificed" status below. Deliberately not a knife/blade: the
  // destructive meaning comes from the button's own danger-tone color,
  // not from a different icon language (see AnimalDetails Care panel).
  sacrifice: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M4 11c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 11c0-1.6 1.1-2.8 2.2-2.2M16 11c0-1.6-1.1-2.8-2.2-2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // ---- Status ----
  // Also doubles as the low-stock icon (Inventory) — same "container" concept.
  archived: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <rect x="3.5" y="8" width="13" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8 4.5 4.5h11L17 8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8.5 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  exited: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <rect x="5" y="3" width="10" height="14" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 7h5M7.5 10h5M7.5 13h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  // Filled crescent / outline circle — moved here from Eligibility in
  // hf.jsx (same paths, same viewBox) so it's part of the one registry.
  eligible: (p) => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" {...p}>
      <path d="M11.2 2.4a6 6 0 100 11.2 6.8 6.8 0 010-11.2z" fill="currentColor" />
    </svg>
  ),
  notEligible: (p) => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" {...p}>
      <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),

  // ---- Alerts ----
  breedingCheck: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <rect x="4.5" y="4" width="11" height="13" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 3.3h5v1.4h-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M7.5 11 9 12.5 12.5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lambing: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <ellipse cx="10" cy="11" rx="5.5" ry="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 8.5 8.5 10.5 6.7 12.1M13 8 11.4 10.2 13.3 11.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  weaning: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <circle cx="6" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10h6M14 7.5 16.5 10 14 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  reinsemination: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M10 16c-4-2.6-6.2-5-6.2-7.8a3.4 3.4 0 016.2-2 3.4 3.4 0 016.2 2c0 2.8-2.2 5.2-6.2 7.8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  healthDue: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <rect x="3.5" y="3.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M10 3.5c-2.5 0-4 2-4 4.5v2.3c0 .9-.4 1.7-1 2.3l-.6.6h11.2l-.6-.6c-.6-.6-1-1.4-1-2.3V8c0-2.5-1.5-4.5-4-4.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8.3 15.5a1.8 1.8 0 003.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),

  // ---- Warning (ConfirmModal) ----
  warning: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M10 3.5 17.3 16H2.7L10 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 8.3v3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="13.6" r="0.9" fill="currentColor" />
    </svg>
  ),

  // ---- Farm info (calendar is new; farmHome/owner reuse the nav icons above) ----
  calendar: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <rect x="3.5" y="4.5" width="13" height="11.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 8h13M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
}

Icon.farmHome = Icon.farm
Icon.owner = Icon.profile
