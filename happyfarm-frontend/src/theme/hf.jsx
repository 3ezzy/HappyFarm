import classNames from 'classnames'
import { C } from './colors.js'

/* ============================================================
   HappyFarm — shared design tokens & helpers (Meadow design system)
   ============================================================ */

// Re-exported so existing imports of `C` keep working. Prefer Tailwind
// classes in markup; `C` is for raw values (SVG fills, gradients, Recharts).
export { C }

export const TYPES = ['sheep', 'goat', 'cow', 'camel']

/**
 * Species → background tint class. Labels, plural forms and sacrifice-age
 * text live in the i18n catalogs (species.*, minAge.*) — this is presentation
 * only, not duplicated business logic. Eligibility itself comes from the
 * API (`animal.is_eligible`); nothing here computes it.
 */
const SPECIES_BG_CLASS = {
  sheep: 'bg-sheep-bg',
  goat: 'bg-goat-bg',
  cow: 'bg-cow-bg',
  camel: 'bg-camel-bg',
}

export const speciesBgClass = (type) => SPECIES_BG_CLASS[type] || 'bg-surface-sunken'

const toMs = (ts) => (ts ? new Date(ts).getTime() : null)

/**
 * Age as a translated, correctly-pluralized string (months under a year,
 * otherwise years to 1 decimal place). `t` is the translation function
 * from useTranslation() — this is a plain helper, not a hook, since it's
 * also called from places that already have `t` in scope.
 */
export const ageText = (age, t) => {
  const n = Number(age)
  if (age === null || age === undefined || Number.isNaN(n)) {
    return t('common.notRecorded')
  }
  if (n < 1) {
    return t('age.months', { count: Math.round(n * 12) })
  }
  return t('age.years', { count: Math.round(n * 10) / 10 })
}

export const timeSince = (ts, t) => {
  const ms = toMs(ts)
  if (!ms) return t('common.never')
  const diff = Date.now() - ms
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return t('time.daysAgo', { count: d })
  if (h > 0) return t('time.hoursAgo', { count: h })
  return t('time.justNow')
}

/** Date + time (fed_at/groomed_at/sacrificed_at timestamps). */
export const fmt = (ts, language, t) => {
  const ms = toMs(ts)
  if (!ms) return t('common.never')
  return new Intl.DateTimeFormat(language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    numberingSystem: 'latn',
  }).format(ms)
}

/**
 * Date-only fields (date_of_birth, date_of_purchase, exit_date) come back
 * as plain 'YYYY-MM-DD' strings. `new Date('YYYY-MM-DD')` parses as UTC
 * midnight, which can display as the previous day in timezones behind
 * UTC — build the Date from local components instead.
 */
// Expects a date-only "YYYY-MM-DD" string, matching how every date field
// in this API is serialized (date_of_birth, bred_on, weaned_on, etc.).
// Guards against malformed input (e.g. a full ISO timestamp, which would
// otherwise produce an Invalid Date and make Intl.DateTimeFormat throw)
// rather than crashing the whole page — this app has no error boundary,
// so an uncaught render error here unmounts everything, not just this row.
export const fmtDate = (dateStr, language) => {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    numberingSystem: 'latn',
  }).format(date)
}

export const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

/* ------------------------------------------------------------
   Shared class recipes (Tailwind-utility composition — kept as plain
   strings, same pattern as before, just retargeted to Meadow tokens)
   ------------------------------------------------------------ */

/** Card surface. Callers add their own padding. */
export const cardClass = 'rounded-lg bg-surface-card shadow-e1'

const inputClass =
  'w-full rounded border border-line-strong bg-surface-card px-3 py-2.5 ' +
  'text-base text-ink-900 placeholder:text-ink-400 outline-none ' +
  'transition-colors duration-hf hover:border-ink-400 ' +
  'focus:border-meadow-700 focus:shadow-focus'

const btnBase =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded ' +
  'px-[18px] py-2.5 text-sm font-medium transition-colors duration-hf ' +
  'disabled:cursor-not-allowed disabled:opacity-45'

/** Primary button — one per view. */
export const btnPrimary = `${btnBase} border border-transparent bg-meadow-700 text-white enabled:hover:bg-meadow-900`
/** Secondary button — outlined, neutral. */
export const btnSecondary = `${btnBase} border border-line-strong bg-surface-card text-ink-900 enabled:hover:bg-surface-sunken`
/** Ghost button — no border, no fill. */
export const btnGhost = `${btnBase} border border-transparent bg-transparent text-meadow-700 enabled:hover:bg-meadow-50`

/* Legacy 7-tone status names (still used by ~15 not-yet-migrated pages via
   badge()) mapped onto the design system's 5 status tones. Pill's own
   `tone` prop takes the 5 canonical names directly — this map only exists
   so badge() and Pill can never disagree about what e.g. "approved" means. */
const TONE_MAP = {
  sacrificed: 'hold',
  active: 'ok',
  eligible: 'warn',
  pending: 'warn',
  approved: 'ok',
  rejected: 'danger',
  suspended: 'hold',
}

const badgeBase = 'inline-flex items-center gap-1.5 rounded-pill border font-medium'
const badgeSize = {
  sm: 'px-2.5 py-[3px] text-xs',
  lg: 'px-3.5 py-[5px] text-[13px]',
}
const badgeToneClasses = {
  ok: 'border-ok-fg/25 bg-ok-bg text-ok-fg',
  warn: 'border-warn-fg/25 bg-warn-bg text-warn-fg',
  danger: 'border-danger-fg/25 bg-danger-bg text-danger-fg',
  hold: 'border-hold-fg/25 bg-hold-bg text-hold-fg',
  info: 'border-info-fg/25 bg-info-bg text-info-fg',
}

export const badge = (tone, size = 'sm') =>
  classNames(badgeBase, badgeSize[size], badgeToneClasses[TONE_MAP[tone] || tone])

export function HfInput({ className, ...props }) {
  return <input {...props} className={classNames(inputClass, className)} />
}

export function HfSelect({ className, children, ...props }) {
  return (
    <select {...props} className={classNames(inputClass, 'appearance-none', className)}>
      {children}
    </select>
  )
}

/* shared logo mark */
export function LeafMark({ size = 26, color = '#DCEDE4' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3c3.5 3 3.5 9 0 12-3.5-3-3.5-9 0-12z" fill={color} />
      <path d="M12 21V9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------
   New Meadow components — thin React wrappers around the .hf-* classes
   defined in index.css's @layer components.
   ------------------------------------------------------------ */

/** The ear tag — the signature component. `tag` falsy renders an em dash. */
export function EarTag({ species, tag, archived = false, size, className }) {
  return (
    <span className={classNames('hf-tag', species, archived && 'archived', size === 'lg' && 'lg', className)}>
      {tag || '—'}
    </span>
  )
}

/** Status pill. `tone` is one of ok/warn/danger/hold/info (default hold). */
export function Pill({ tone = 'hold', size, children, className }) {
  return (
    <span className={classNames('hf-pill', tone, size === 'lg' && 'px-3.5 py-1 text-sm', className)}>
      {children}
    </span>
  )
}

/** Neutral stat card. `accent` (yellow top border) is reserved for a
 *  future Eid-countdown feature — no current call site should pass it. */
export function StatCard({ value, label, description, accent = false, className }) {
  return (
    <div className={classNames('hf-stat', accent && 'accent', className)}>
      <span className="k">{label}</span>
      <div className="v">{value}</div>
      {description && <div className="d">{description}</div>}
    </div>
  )
}

/** Dashed-border empty state. */
export function EmptyState({ icon, title, body, action, className }) {
  return (
    <div className={classNames('hf-empty', className)}>
      {icon}
      <h4>{title}</h4>
      {body && <p>{body}</p>}
      {action}
    </div>
  )
}

/** Alert row. Severity is carried by a 3px inline-start border only —
 *  never a background wash. `severity`: 'info' (default) | 'warn' | 'danger'. */
export function AlertRow({ severity = 'info', title, detail, when, actions, className }) {
  return (
    <div className={classNames('hf-alert', severity !== 'info' && severity, className)}>
      <div className="body">
        <div className="t">{title}</div>
        {detail && <div className="m">{detail}</div>}
      </div>
      {when && <span className="when">{when}</span>}
      {actions}
    </div>
  )
}

/* ------------------------------------------------------------
   Still to build (later redesign slices, not this one):
   - Table/Th/Td primitives (.hf-table)         — Animals slice
   - StockMeter (.hf-stock)                     — Inventory slice
   - Eligibility badge (.hf-elig)                — Animals slice
   - Pedigree rail (.hf-ped)                     — Animals slice
   ------------------------------------------------------------ */
