/** Decorative night scene: aria-hidden, no title, no meaning, and never placed behind text (WCAG 1.1.1, 1.4.3). The moon only repeats what "Step N of 3" says in words. The drift stops under reduced motion and the in-app toggle (WCAG 2.2.2, 2.3.3). */
import styles from './MistArt.module.css'

/** 0 = start, 1 to 2 = the step the booking is on, 3 = booked. */
export type MoonPhase = 0 | 1 | 2 | 3

const MOON: Record<MoonPhase, string> = {
  0: 'M480 34a46 46 0 0 0 0 92a30 46 0 0 1 0-92z',
  1: 'M480 34a46 46 0 0 0 0 92V34z',
  2: 'M480 34a46 46 0 0 0 0 92a30 46 0 0 0 0-92z',
  3: 'M480 34a46 46 0 0 0 0 92a46 46 0 0 0 0-92z',
}

export function MistArt({ phase = 0 }: { phase?: MoonPhase }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={styles.mist}
      viewBox="0 24 640 164"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="480" cy="80" r="66" opacity="0.1" />
      <circle cx="480" cy="80" r="46" opacity="0.14" />
      <path d={MOON[phase]} />
      <path opacity="0.16" d="M0 200v-38c40-14 70-10 110-4s70-12 120-10 90 18 140 10 80-16 130-8 100 4 140-4v54z" />
      <g className={styles.drift}>
        <ellipse cx="150" cy="118" rx="150" ry="9" opacity="0.16" />
        <ellipse cx="300" cy="138" rx="190" ry="8" opacity="0.12" />
        <ellipse cx="500" cy="152" rx="150" ry="7" opacity="0.14" />
      </g>
      <ellipse cx="190" cy="196" rx="150" ry="20" opacity="0.45" />
      <path opacity="0.85" d="M92 140h12v48H92zM184 124h14v62h-14zM276 144h12v44h-12z" />
      <path d="M98 112c6 9 8 13 8 17a8 8 0 0 1-16 0c0-4 2-8 8-17zM191 92c7 11 9 15 9 20a9 9 0 0 1-18 0c0-5 2-9 9-20zM282 116c6 9 8 13 8 17a8 8 0 0 1-16 0c0-4 2-8 8-17z" />
    </svg>
  )
}
