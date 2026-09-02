import classNames from 'classnames'
import { C } from '../../theme/hf.jsx'

const LABEL = { sheep: 'Sheep', goat: 'Goat', cow: 'Cow', camel: 'Camel' }

/**
 * Species portrait — front-facing head icons, one per species, hand-built
 * to match a specific reference set the user supplied (bold rounded
 * stroke, filled dot eyes/nostrils). Distinct from the rest of the app's
 * thin-stroke icon language by design/request, not an oversight. Every
 * shape draws in currentColor; color defaults to the species tint via
 * inline style (overridable through the existing `style` prop) so this
 * stays a drop-in swap for every existing call site.
 */
const OUTLINE = {
  sheep: [
    'M7,11 C4.3,10.8 2.6,8.3 4.5,6.6 C3.6,4.5 5.8,2.8 8,3.7 C8.4,1.8 15.6,1.8 16,3.7 C18.2,2.8 20.4,4.5 19.5,6.6 C21.4,8.3 19.7,10.8 17,11 L17,14.5 C17,18.3 15,20.5 12,20.5 C9,20.5 7,18.3 7,14.5 Z',
    'M6,10 C3.3,10.5 1.5,13 2.3,15.5 C4.5,15.7 6.9,13.7 7,11 Z',
    'M18,10 C20.7,10.5 22.5,13 21.7,15.5 C19.5,15.7 17.1,13.7 17,11 Z',
  ],
  goat: [
    'M5.5,8.5 C5.5,5.3 8,3.3 12,3.3 C16,3.3 18.5,5.3 18.5,8.5 L18.5,13.5 C18.5,17.7 16,20 12,20 C8,20 5.5,17.7 5.5,13.5 Z',
    'M8.9,5.4 C6.2,4 4.7,2.2 6,1.7 C7.6,1.1 9.2,3 8.9,5.4',
    'M15.1,5.4 C17.8,4 19.3,2.2 18,1.7 C16.4,1.1 14.8,3 15.1,5.4',
    'M5.9,9.6 C3.2,9.5 1.8,11.3 2.6,13.3 C4.3,13.3 6.1,11.7 5.9,9.6 Z',
    'M18.1,9.6 C20.8,9.5 22.2,11.3 21.4,13.3 C19.7,13.3 17.9,11.7 18.1,9.6 Z',
    'M8.8,10.2 C9.2,9.8 9.8,9.8 10.2,10.2',
    'M13.8,10.2 C14.2,9.8 14.8,9.8 15.2,10.2',
    'M11.2,13.6 C11.6,14.5 12.4,14.5 12.8,13.6',
    'M10.8,15.4 C11.4,16 12.6,16 13.2,15.4',
    'M10.8,18.6 C10.3,20 10.8,21.1 11.5,20.4 C11.7,21.3 12.5,21.3 12.7,20.4 C13.4,21.2 13.9,19.9 13.2,18.6',
  ],
  cow: [
    'M5,10 C5,6.2 7.5,4 12,4 C16.5,4 19,6.2 19,10 L19,14 C19,18 16.5,20.3 12,20.3 C7.5,20.3 5,18 5,14 Z',
    'M5.8,9 C2.6,8 0.6,9.6 1.1,11.6 C3,12.4 5.6,11.2 5.6,8.3 Z',
    'M18.2,9 C21.4,8 23.4,9.6 22.9,11.6 C21,12.4 18.4,11.2 18.4,8.3 Z',
    'M6.5,5.6 C5.5,4 5.8,2.3 7.1,2.4 C8.1,2.5 8.3,4.1 7.4,5.7',
    'M17.5,5.6 C18.5,4 18.2,2.3 16.9,2.4 C15.9,2.5 15.7,4.1 16.6,5.7',
    'M8,14.8 C8,13.5 9.8,12.8 12,12.8 C14.2,12.8 16,13.5 16,14.8 C16,17.2 14.2,18.2 12,18.2 C9.8,18.2 8,17.2 8,14.8 Z',
    'M10,17.8 C10.7,18.4 13.3,18.4 14,17.8',
  ],
  camel: [
    'M6,9.3 C6,6 8,3.7 12,3.7 C16,3.7 18,6 18,9.3 L18,15.3 C18,19.3 15.5,21.7 12,21.7 C8.5,21.7 6,19.3 6,15.3 Z',
    'M6.9,5.8 C5,5.2 3.5,6.3 4.1,7.7 C5.4,7.9 6.9,7 6.9,5.8 Z',
    'M17.1,5.8 C19,5.2 20.5,6.3 19.9,7.7 C18.6,7.9 17.1,7 17.1,5.8 Z',
    'M10.5,3.9 C10.5,3 13.5,3 13.5,3.9',
    'M9.4,13.3 C9.4,15.8 8.6,16.8 9.1,18 C10,17.5 10.7,16.2 10.9,14.4 C11.2,16.5 12.8,16.5 13.1,14.4 C13.3,16.2 14,17.5 14.9,18 C15.4,16.8 14.6,15.8 14.6,13.3 Z',
    'M10,19.2 C10.6,19.7 13.4,19.7 14,19.2',
  ],
}

// Small filled marks (eyes / nostrils) — {c:[cx,cy,r]} for dots,
// {e:[cx,cy,rx,ry]} for the goat/camel's closed almond eyes.
const MARKS = {
  sheep: [{ c: [9.5, 13.3, 1.2] }, { c: [14.5, 13.3, 1.2] }, { e: [9.7, 16.5, 0.9, 1.1] }, { e: [14.3, 16.5, 0.9, 1.1] }],
  goat: [],
  cow: [{ c: [9.2, 10.5, 1] }, { c: [14.8, 10.5, 1] }, { c: [10.6, 15, 0.7] }, { c: [13.4, 15, 0.7] }],
  camel: [{ e: [8.9, 9.7, 0.9, 0.6] }, { e: [15.1, 9.7, 0.9, 0.6] }],
}

const AnimalIcon = ({ type = 'sheep', size = 54, className, style }) => {
  // Size stays inline: it is a caller-supplied value, not a design token.
  // Color defaults to the species tint but is a normal inheritable
  // `color`, so a caller can still override it via `style`.
  const wrap = {
    width: typeof size === 'number' ? `${size}px` : size,
    height: typeof size === 'number' ? `${size}px` : size,
    color: C[type] || C.ink700,
    ...style,
  }
  const outline = OUTLINE[type] || OUTLINE.sheep
  const marks = MARKS[type] || MARKS.sheep

  return (
    <div className={classNames('flex items-center justify-center', className)} style={wrap}>
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-label={LABEL[type] || LABEL.sheep}>
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {outline.map((d, i) => <path key={i} d={d} />)}
        </g>
        <g fill="currentColor">
          {marks.map((m, i) =>
            m.c ? <circle key={i} cx={m.c[0]} cy={m.c[1]} r={m.c[2]} /> : <ellipse key={i} cx={m.e[0]} cy={m.e[1]} rx={m.e[2]} ry={m.e[3]} />
          )}
        </g>
      </svg>
    </div>
  )
}

export default AnimalIcon
