import classNames from 'classnames'

/**
 * Brand mark — the ear-tag chip the app already draws on every animal:
 * squared leading edge, pill-rounded trailing edge, a real punch hole at
 * the front. The hole is the only yellow in the system outside the Eid
 * counter. Ported from the Logo design (Logo.dc.html) — "sprig" (three
 * leaves on a stalk) is that design's recommended interior glyph over its
 * two alternatives (a single horn spiral, a barley stalk), chosen there
 * for staying legible at the smallest sizes the mark actually ships at.
 */
const TAG = 'M4 5.5h10.5a6.5 6.5 0 010 13H4a1 1 0 01-1-1v-11a1 1 0 011-1z'
const HOLE = 'M7.2 9.9a2.1 2.1 0 100 4.2 2.1 2.1 0 100-4.2z'
const SOLID = TAG + HOLE
const SPRIG = [
  'M15.4 16.4V9.4',
  'M15.4 13.5c-1.6 0-2.5-.9-2.5-2.4 1.6 0 2.5.9 2.5 2.4z',
  'M15.4 11.5c1.6 0 2.5-.9 2.5-2.4-1.6 0-2.5.9-2.5 2.4z',
  'M15.4 9.6c-1-.5-1.3-1.5-.9-2.6 1 .5 1.3 1.5.9 2.6z',
]

/**
 * `variant`: "default" (green stroke + yellow hole + sprig, for light
 * backgrounds — every current call site), "reversed" (solid white, for a
 * dark/Pine background), "ink" (solid single dark color, for contexts too
 * small or too constrained for two colors — favicon-style use).
 * Mirrors in RTL the same way every other directional glyph in this app
 * does (see Sidebar's back/forward arrows) since the punch hole should
 * still lead the reading direction.
 */
export function Mark({ size = 24, variant = 'default', className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={classNames('block flex-none rtl:-scale-x-100', className)}
      aria-hidden="true"
    >
      {variant === 'default' ? (
        <>
          <circle cx="7.2" cy="12" r="2.1" fill="#F2B807" />
          <path d={TAG} fill="none" stroke="#1B6349" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="7.2" cy="12" r="2.1" fill="none" stroke="#1B6349" strokeWidth="1.5" />
          <g fill="none" stroke="#1B6349" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {SPRIG.map((d, i) => <path key={i} d={d} />)}
          </g>
        </>
      ) : (
        <path d={SOLID} fill={variant === 'reversed' ? '#FFFFFF' : '#131A14'} fillRule="evenodd" />
      )}
    </svg>
  )
}

/**
 * Mark + wordmark lockup. Keeps the app's existing "HappyFarm" wordmark
 * text (not the design file's "Happy Farm") — renaming the brand is a
 * content decision beyond implementing the mark, and the two-word form
 * isn't used anywhere else in the app's copy or i18n catalogs.
 */
export function Logo({ size = 28, variant = 'default', className, textClassName }) {
  return (
    <span className={classNames('inline-flex items-center gap-2', className)}>
      <Mark size={size} variant={variant} />
      <span
        className={classNames(
          'font-display font-semibold tracking-tight',
          variant === 'reversed' ? 'text-white' : 'text-meadow-900',
          textClassName
        )}
      >
        HappyFarm
      </span>
    </span>
  )
}
