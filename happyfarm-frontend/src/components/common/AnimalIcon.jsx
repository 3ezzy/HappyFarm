import React from 'react'

/**
 * HappyFarm animal icon — hand-drawn SVG marks per animal type.
 * Ported from the HappyFarm design system (AnimalIcon.dc.html).
 */
const AnimalIcon = ({ type = 'sheep', size = 54, style }) => {
  const common = {
    viewBox: '0 0 100 100',
    width: '100%',
    height: '100%',
    preserveAspectRatio: 'xMidYMid meet',
  }
  const wrap = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  }

  let svg
  if (type === 'goat') {
    svg = (
      <svg {...common} aria-label="Goat">
        <rect x="36" y="64" width="7" height="22" rx="3.5" fill="#9C7A4E" />
        <rect x="57" y="64" width="7" height="22" rx="3.5" fill="#9C7A4E" />
        <ellipse cx="50" cy="55" rx="24" ry="19" fill="#C9A36B" />
        <path d="M42 28 q-7 -9 -3 -18" stroke="#6F5C3C" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M58 28 q7 -9 3 -18" stroke="#6F5C3C" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <ellipse cx="34" cy="43" rx="6" ry="3.6" fill="#B68F58" transform="rotate(-18 34 43)" />
        <ellipse cx="66" cy="43" rx="6" ry="3.6" fill="#B68F58" transform="rotate(18 66 43)" />
        <ellipse cx="50" cy="41" rx="13" ry="13" fill="#D9B57E" />
        <circle cx="45" cy="40" r="2.3" fill="#2A2418" />
        <circle cx="55" cy="40" r="2.3" fill="#2A2418" />
        <ellipse cx="50" cy="48" rx="5.5" ry="4.2" fill="#EAD3A8" />
        <path d="M46 51 q4 11 4 15 q0 -4 4 -15 z" fill="#EFE3C8" />
      </svg>
    )
  } else if (type === 'cow') {
    svg = (
      <svg {...common} aria-label="Cow">
        <rect x="35" y="64" width="7" height="22" rx="3.5" fill="#7A6A4E" />
        <rect x="58" y="64" width="7" height="22" rx="3.5" fill="#7A6A4E" />
        <ellipse cx="50" cy="55" rx="25" ry="20" fill="#FBF6EA" stroke="#E7DEC9" strokeWidth="2" />
        <path d="M30 49 q9 -7 15 2 q-3 11 -15 6 z" fill="#6B5C43" />
        <path d="M71 61 q-9 7 -16 -1 q4 -11 16 -6 z" fill="#6B5C43" />
        <path d="M40 31 q-3 -8 2 -11" stroke="#C2B695" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M60 31 q3 -8 -2 -11" stroke="#C2B695" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="32" cy="41" rx="6.5" ry="4.2" fill="#F0E7D4" stroke="#E7DEC9" strokeWidth="2" />
        <ellipse cx="68" cy="41" rx="6.5" ry="4.2" fill="#F0E7D4" stroke="#E7DEC9" strokeWidth="2" />
        <ellipse cx="50" cy="41" rx="14" ry="13" fill="#FBF6EA" stroke="#E7DEC9" strokeWidth="2" />
        <circle cx="44" cy="39" r="2.4" fill="#2A2418" />
        <circle cx="56" cy="39" r="2.4" fill="#2A2418" />
        <ellipse cx="50" cy="48" rx="9" ry="6.5" fill="#EBB9B0" />
        <circle cx="46" cy="48" r="1.7" fill="#9C6F66" />
        <circle cx="54" cy="48" r="1.7" fill="#9C6F66" />
      </svg>
    )
  } else if (type === 'camel') {
    svg = (
      <svg {...common} aria-label="Camel">
        <rect x="30" y="64" width="7" height="22" rx="3.5" fill="#C57F45" />
        <rect x="44" y="66" width="7" height="20" rx="3.5" fill="#B5703B" />
        <rect x="58" y="64" width="7" height="22" rx="3.5" fill="#C57F45" />
        <path d="M24 64 q1 -15 11 -15 q5 -15 13 -3 q8 -13 13 3 q11 0 12 15 z" fill="#E3A368" />
        <path d="M61 56 q12 -3 14 -22 q1 -9 -6 -10 q-7 -1 -8 9 q-1 13 -9 18 z" fill="#E3A368" />
        <ellipse cx="74" cy="22" rx="9" ry="7.5" fill="#EAB079" />
        <path d="M80 24 q6 1 7 5 q-5 2 -8 -1 z" fill="#D49460" />
        <ellipse cx="69" cy="15" rx="2.6" ry="3.8" fill="#C57F45" />
        <circle cx="77" cy="20" r="2" fill="#2A2418" />
      </svg>
    )
  } else {
    // sheep (default)
    svg = (
      <svg {...common} aria-label="Sheep">
        <rect x="35" y="63" width="7" height="23" rx="3.5" fill="#7A6A4E" />
        <rect x="58" y="63" width="7" height="23" rx="3.5" fill="#7A6A4E" />
        <g fill="#FFFFFF" stroke="#E2D8C2" strokeWidth="2.5">
          <circle cx="32" cy="52" r="12" />
          <circle cx="68" cy="52" r="12" />
          <circle cx="40" cy="38" r="12" />
          <circle cx="60" cy="38" r="12" />
          <circle cx="40" cy="66" r="12" />
          <circle cx="60" cy="66" r="12" />
          <circle cx="50" cy="34" r="12" />
          <circle cx="50" cy="70" r="12" />
        </g>
        <circle cx="50" cy="52" r="20" fill="#FFFFFF" />
        <circle cx="50" cy="31" r="8" fill="#FFFFFF" stroke="#E2D8C2" strokeWidth="2.5" />
        <ellipse cx="50" cy="47" rx="11.5" ry="12.5" fill="#6B5C43" />
        <ellipse cx="38" cy="45" rx="5.5" ry="3.8" fill="#574A30" />
        <ellipse cx="62" cy="45" rx="5.5" ry="3.8" fill="#574A30" />
        <circle cx="45.5" cy="46" r="2.3" fill="#2A2418" />
        <circle cx="54.5" cy="46" r="2.3" fill="#2A2418" />
        <ellipse cx="50" cy="54" rx="2.5" ry="1.9" fill="#2A2418" />
      </svg>
    )
  }

  return <div style={wrap}>{svg}</div>
}

export default AnimalIcon
