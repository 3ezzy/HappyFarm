import React from 'react'
import classNames from 'classnames'
import { C } from './colors.js'

/* ============================================================
   HappyFarm — shared design tokens & helpers
   ============================================================ */

// Re-exported so existing imports of `C` keep working. Prefer Tailwind
// classes in markup; `C` is for raw values (SVG fills, gradients).
export { C }

export const TYPES = ['sheep', 'goat', 'cow', 'camel']

/**
 * Species → background tint class. Labels, plural forms and sacrifice-age
 * text live in the i18n catalogs (species.*, minAge.*) — this is presentation
 * only, not duplicated business logic. Eligibility itself comes from the
 * API (`animal.is_eligible`); nothing here computes it.
 */
const SPECIES_BG_CLASS = {
  sheep: 'bg-species-sheep',
  goat: 'bg-species-goat',
  cow: 'bg-species-cow',
  camel: 'bg-species-camel',
}

export const speciesBgClass = (type) => SPECIES_BG_CLASS[type] || 'bg-cream'

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
export const fmtDate = (dateStr, language) => {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    numberingSystem: 'latn',
  }).format(new Date(y, m - 1, d))
}

export const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

/* ------------------------------------------------------------
   Shared class recipes
   ------------------------------------------------------------ */

/** Card surface. Callers add their own padding (p-6 or p-7). */
export const cardClass = 'rounded-2xl bg-cream shadow-ribbon'

const inputClass =
  'block w-full rounded-2xl border-2 border-line-input bg-cream px-3.5 py-2.5 ' +
  'text-[15px] text-brown-text outline-none transition-colors duration-200 ' +
  'focus:border-green'

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-full font-display ' +
  'font-bold cursor-pointer transition-transform duration-200 ease-pop ' +
  'disabled:cursor-not-allowed disabled:opacity-60 enabled:hover:scale-105'

export const btnCream = `${btnBase} bg-cream text-brown-text px-4 py-2 shadow-chip`

/* Status pills, shared by the animal list, dashboard and detail screens.
   `lg` is the roomier variant the detail page uses. */
const badgeBase = 'rounded-full border-2 font-semibold'

const badgeSize = {
  sm: 'px-3 py-[3px] text-xs',
  lg: 'inline-flex items-center gap-1.5 px-3.5 py-[5px] text-[13px]',
}

const badgeTone = {
  sacrificed: 'border-line bg-cream-muted text-tan',
  active: 'border-green-line bg-green-badgeBg text-green-badge',
  eligible: 'border-yellow-line bg-yellow-badgeBg text-yellow-badge',
}

export const badge = (tone, size = 'sm') => classNames(badgeBase, badgeSize[size], badgeTone[tone])

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
export function LeafMark({ size = 26, color = '#BEE6D5' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3c3.5 3 3.5 9 0 12-3.5-3-3.5-9 0-12z" fill={color} />
      <path d="M12 21V9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
