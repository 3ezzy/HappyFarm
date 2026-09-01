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
    strokeWidth: '1.4',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  // Size stays inline: it is a caller-supplied value, not a design token.
  const wrap = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    ...style,
  }

  let svg
  if (type === 'goat') {
    svg = (
      <svg {...common} aria-label="Goat">
        <ellipse cx="9.5" cy="12.5" rx="6" ry="4" />
        <circle cx="14.8" cy="10.5" r="2.6" />
        <path d="M14 8.2c-1-1.6-.6-3 .6-3.8M16.4 8c1.1-1.4.9-2.9-.2-3.9" />
        <path d="M7 16v2M12 16v2" />
      </svg>
    )
  } else if (type === 'cow') {
    svg = (
      <svg {...common} aria-label="Cow">
        <ellipse cx="9.5" cy="12.5" rx="6.2" ry="4.2" />
        <circle cx="15" cy="10.8" r="2.7" />
        <ellipse cx="12.8" cy="9" rx="1.3" ry="1.9" transform="rotate(-25 12.8 9)" />
        <ellipse cx="17.1" cy="9.3" rx="1.3" ry="1.9" transform="rotate(25 17.1 9.3)" />
        <path d="M7 16.2v2M12 16.2v2" />
      </svg>
    )
  } else if (type === 'camel') {
    svg = (
      <svg {...common} aria-label="Camel">
        <ellipse cx="8" cy="13" rx="5.5" ry="3.6" />
        <path d="M9 9.6a3 3 0 016 0" />
        <path d="M13 11.5 15.3 5.2" />
        <circle cx="16" cy="4.5" r="2" />
        <path d="M6 16.4v2M10.5 16.4v2" />
      </svg>
    )
  } else {
    // sheep (default) — three overlapping "wool" circles along the top
    // of the body, distinguishing it from goat/cow's plain body ellipse.
    svg = (
      <svg {...common} aria-label="Sheep">
        <circle cx="7" cy="9" r="2.3" />
        <circle cx="10.5" cy="7.3" r="2.3" />
        <circle cx="13.5" cy="9.2" r="2.3" />
        <ellipse cx="10.2" cy="11.5" rx="6.2" ry="4.3" />
        <circle cx="15.2" cy="12" r="2.1" />
        <path d="M8 15.5v2M13 15.5v2" />
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
