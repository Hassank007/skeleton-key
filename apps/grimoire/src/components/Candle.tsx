/** Decorative flickering candle; aria-hidden, stops under OS reduced motion and the in-app toggle (WCAG 2.2.2, 2.3.3). */
import styles from './Candle.module.css'

export function Candle() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={styles.candle}
      viewBox="0 0 32 64"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="candle"
    >
      <path className={styles.flame} d="M16 4c5 7 7 11 7 15a7 7 0 0 1-14 0c0-4 2-8 7-15z" fill="currentColor" fillOpacity="0.6" />
      <path d="M16 26v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="9" y="34" width="14" height="26" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
