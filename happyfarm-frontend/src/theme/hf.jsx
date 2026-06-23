import React, { useState } from 'react'

/* ============================================================
   HappyFarm — Eid Al Adha shared design tokens & helpers
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
}

export const TYPES = ['sheep', 'goat', 'cow', 'camel']

export const ANIMAL_META = {
  sheep: { label: 'Sheep', plural: 'Sheep', ar: 'الضأن (غنم)', bg: '#DCEAF8', minAge: 0.5, minAgeText: '6 months' },
  goat: { label: 'Goat', plural: 'Goats', ar: 'الماعز', bg: '#D6EBDB', minAge: 1, minAgeText: '1 year' },
  cow: { label: 'Cow', plural: 'Cows', ar: 'البقر', bg: '#F7E6BE', minAge: 2, minAgeText: '2 years' },
  camel: { label: 'Camel', plural: 'Camels', ar: 'الإبل', bg: '#FADCC6', minAge: 5, minAgeText: '5 years' },
}

export const typeInfo = (t) =>
  ANIMAL_META[t] || { label: t, plural: t, ar: '', bg: C.cream, minAge: 0, minAgeText: '' }

export const minAge = (t) => typeInfo(t).minAge
export const minAgeText = (t) => typeInfo(t).minAgeText

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
   Interactive primitives (hover / focus for inline styles)
   ------------------------------------------------------------ */

export function Hoverable({ as = 'button', baseStyle, hoverStyle, disabled, children, ...props }) {
  const Tag = as
  const [hover, setHover] = useState(false)
  const style = disabled ? baseStyle : { ...baseStyle, ...(hover ? hoverStyle : null) }
  return (
    <Tag
      style={style}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {children}
    </Tag>
  )
}

const inputBase = {
  display: 'block',
  width: '100%',
  border: `2px solid ${C.inputBorder}`,
  background: C.cream,
  borderRadius: '16px',
  padding: '11px 14px',
  fontSize: '15px',
  color: C.brownText,
  outline: 'none',
  transition: 'border-color .2s',
}

export function HfInput({ style, ...props }) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      {...props}
      onFocus={(e) => {
        setFocus(true)
        props.onFocus && props.onFocus(e)
      }}
      onBlur={(e) => {
        setFocus(false)
        props.onBlur && props.onBlur(e)
      }}
      style={{ ...inputBase, ...style, borderColor: focus ? C.green : C.inputBorder }}
    />
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
