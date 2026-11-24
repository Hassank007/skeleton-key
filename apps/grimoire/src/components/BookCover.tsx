/** Decorative book cover per school; aria-hidden and unnamed, so it carries no meaning (WCAG 1.1.1). */
import type { School } from '../data/books'
import styles from './BookCover.module.css'

const GLYPHS: Record<School, string[]> = {
  // A skull: round cranium, two eye sockets.
  Necromancy: ['M16 30a8 8 0 1 1 16 0c0 3-1 5-3 6v4h-10v-4c-2-1-3-3-3-6z', 'M20 29h2v3h-2z', 'M26 29h2v3h-2z'],
  // An eye: almond shape and iris.
  Divination: ['M8 32c5-8 11-11 16-11s11 3 16 11c-5 8-11 11-16 11s-11-3-16-11z', 'M24 27a5 5 0 1 1 0 10a5 5 0 0 1 0-10z'],
  // Two overlapping rings.
  Illusion: ['M20 32a8 8 0 1 1 16 0a8 8 0 0 1-16 0z', 'M12 32a8 8 0 1 1 16 0a8 8 0 0 1-16 0z'],
  // A leaf with a stem.
  Herbalism: ['M12 40c0-14 10-20 24-20c0 14-8 22-24 20z', 'M12 44l18-16'],
  // A shield.
  Warding: ['M24 20l12 4v8c0 8-5 12-12 15c-7-3-12-7-12-15v-8z'],
  // A triangle over a line, the alchemical sign for fire above earth.
  Alchemy: ['M24 20l11 18h-22z', 'M18 32h12'],
}

interface BookCoverProps {
  school: School
  className?: string
}

export function BookCover({ school, className }: BookCoverProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={[styles.cover, className].filter(Boolean).join(' ')}
      viewBox="0 0 48 64"
      fill="currentColor"
      stroke="none"
      xmlns="http://www.w3.org/2000/svg"
      data-school={school}
    >
      <rect x="1" y="1" width="46" height="62" rx="2" />
      <path className={styles.spine} d="M1 3a2 2 0 0 1 2-2h6v62H3a2 2 0 0 1-2-2z" />
      <path className={styles.foil} d="M45.5 3v58" strokeWidth="1" strokeOpacity="0.5" />
      <g className={styles.foil}>
        <path d="M2 12h6M2 15h6M2 49h6M2 52h6" strokeWidth="1" />
        <rect x="13" y="5" width="30" height="54" rx="1" strokeWidth="0.8" />
        <path d="M17 11h22M17 53h22" strokeWidth="1.6" />
        <g transform="translate(4 0)" strokeWidth="1.8">
          {GLYPHS[school].map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
    </svg>
  )
}