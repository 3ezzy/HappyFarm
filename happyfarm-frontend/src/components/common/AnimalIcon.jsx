import classNames from 'classnames'
import { C } from '../../theme/hf.jsx'

/**
 * Species portrait — simple line-art silhouette, one per species, matching
 * the app's shared icon language (theme/icons.jsx): stroke-only, round
 * caps/joins, no shading or fills. Each species strokes in its own
 * existing Meadow species color (C.sheep/goat/cow/camel) rather than
 * inheriting currentColor, so the line stays visually tied to the same
 * species tint speciesBgClass()/EarTag already use.
 */
const AnimalIcon = ({ type = 'sheep', size = 54, className, style }) => {
  const common = {
    viewBox: '0 0 20 20',
    width: '100%',
    height: '100%',
    fill: 'none',
    stroke: C[type] || C.ink700,
    strokeWidth: '1.5',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  // Size stays inline: it is a caller-supplied value, not a design token.
  const wrap = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    ...style,
  }

  // Every species shares the same two base shapes (a resting-body capsule
  // + a head circle) — only a single small accent shape changes per
  // species, matching Sidebar's own 2-4-shape icon economy rather than
  // an illustrative/detailed silhouette.
  let svg
  if (type === 'goat') {
    svg = (
      <svg {...common} aria-label="Goat">
        <rect x="3" y="10" width="11" height="6" rx="3" />
        <circle cx="15" cy="9" r="2.6" />
        <path d="M13.7 7.2c-.6-1.6 0-2.8 1.2-3.5M16.3 7.2c.6-1.6 0-2.8-1.2-3.5" />
      </svg>
    )
  } else if (type === 'cow') {
    svg = (
      <svg {...common} aria-label="Cow">
        <rect x="3" y="10" width="11" height="6" rx="3" />
        <circle cx="15" cy="9" r="2.6" />
        <path d="M13 7.6l-1.4-1M17 7.6l1.4-1" />
      </svg>
    )
  } else if (type === 'camel') {
    svg = (
      <svg {...common} aria-label="Camel">
        <rect x="3" y="10" width="11" height="6" rx="3" />
        <path d="M6 10c.3-1.7 1.7-2.7 3.1-2.1s1.9 1.9 1.1 3.4" />
        <path d="M12 10.5 15.3 5" />
        <circle cx="16" cy="4.3" r="2" />
      </svg>
    )
  } else {
    // sheep (default) — the plain, unaccented form of the shared base
    // shapes; body + head only.
    svg = (
      <svg {...common} aria-label="Sheep">
        <rect x="3" y="10" width="11" height="6" rx="3" />
        <circle cx="15" cy="9" r="2.6" />
      </svg>
    )
  }

  return (
    <div className={classNames('flex items-center justify-center', className)} style={wrap}>
      {svg}
    </div>
  )
}

export default AnimalIcon
