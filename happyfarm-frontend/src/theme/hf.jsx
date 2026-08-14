import React from 'react'
import classNames from 'classnames'
import { C, SPECIES_BG } from './colors.js'

/* ============================================================
   HappyFarm — Eid Al Adha shared design tokens & helpers
   ============================================================ */

// Re-exported so existing imports of `C` keep working. Prefer Tailwind
// classes in markup; `C` is for raw values (SVG fills, gradients).
export { C, SPECIES_BG }

export const TYPES = ['sheep', 'goat', 'cow', 'camel']

export const ANIMAL_META = {
  sheep: { label: 'Sheep', plural: 'Sheep', ar: 'الضأن (غنم)', bgClass: 'bg-species-sheep', minAge: 0.5, minAgeText: '6 months' },
  goat: { label: 'Goat', plural: 'Goats', ar: 'الماعز', bgClass: 'bg-species-goat', minAge: 1, minAgeText: '1 year' },
  cow: { label: 'Cow', plural: 'Cows', ar: 'البقر', bgClass: 'bg-species-cow', minAge: 2, minAgeText: '2 years' },
  camel: { label: 'Camel', plural: 'Camels', ar: 'الإبل', bgClass: 'bg-species-camel', minAge: 5, minAgeText: '5 years' },
}

export const typeInfo = (t) =>
  ANIMAL_META[t] || { label: t, plural: t, ar: '', bgClass: 'bg-cream', minAge: 0, minAgeText: '' }

export const minAge = (t) => typeInfo(t).minAge
export const minAgeText = (t) => typeInfo(t).minAgeText
export const typeBgClass = (t) => typeInfo(t).bgClass

export const eligible = (a) => !!a && !a.is_sacrificed && Number(a.age) >= minAge(a.type)

export const ageText = (age) => {
  const n = Number(age)
  if (n < 1) return Math.round(n * 12) + ' mo'
  return n + (n === 1 ? ' yr' : ' yrs')
}

const toMs = (ts) => (ts ? new Date(ts).getTime() : null)

export const timeSince = (ts) => {
  const ms = toMs(ts)
  if (!ms) return 'Never'
  const diff = Date.now() - ms
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return d + (d > 1 ? ' days ago' : ' day ago')
  if (h > 0) return h + (h > 1 ? ' hours ago' : ' hour ago')
  return 'Just now'
}

export const fmt = (ts) => {
  const ms = toMs(ts)
  if (!ms) return 'Never'
  return new Date(ms).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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

   Hover and focus states are plain Tailwind variants now, which is why
   the old `Hoverable` wrapper and the stateful `HfInput` are gone — they
   only existed to emulate :hover / :focus for inline styles.
   ------------------------------------------------------------ */

export const cardClass =
  'rounded-2xl border-2 border-line bg-cream shadow-chip'

export const inputClass =
  'block w-full rounded-2xl border-2 border-line-input bg-cream px-3.5 py-2.5 ' +
  'text-[15px] text-brown-text outline-none transition-colors duration-200 ' +
  'focus:border-green'

export const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-full font-display ' +
  'font-bold cursor-pointer transition-transform duration-200 ease-pop ' +
  'disabled:cursor-not-allowed disabled:opacity-60 enabled:hover:scale-105'

export const btnPrimary = `${btnBase} bg-green text-cream px-4 py-2 shadow-chip`
export const btnCream = `${btnBase} bg-cream text-brown-text px-4 py-2 shadow-chip`
export const btnDanger = `${btnBase} bg-red text-white px-4 py-2 shadow-chip`

/* Status pills, shared by the animal list, dashboard and detail screens. */
const badgeBase = 'rounded-full border-2 px-3 py-[3px] text-xs font-semibold'

export const badgeSacrificed = `${badgeBase} border-line bg-cream-muted text-tan`
export const badgeActive = `${badgeBase} border-green-line bg-green-badgeBg text-green-badge`
export const badgeEligible = `${badgeBase} border-yellow-line bg-yellow-badgeBg text-yellow-badge`

export function HfInput({ className, ...props }) {
  return <input {...props} className={classNames(inputClass, className)} />
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
