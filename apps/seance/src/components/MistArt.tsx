/** Decorative moon and mist: aria-hidden, no title, no meaning, and never placed behind text (WCAG 1.1.1, 1.4.3). The drift stops under reduced motion and the in-app toggle (WCAG 2.2.2, 2.3.3). */
import styles from './MistArt.module.css'

export function MistArt() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={styles.mist}
      viewBox="0 0 240 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="200" cy="26" r="16" opacity="0.35" />
      <circle cx="207" cy="22" r="14" className={styles.bite} />
      <g className={styles.drift}>
        <ellipse cx="60" cy="44" rx="56" ry="7" opacity="0.18" />
        <ellipse cx="110" cy="54" rx="70" ry="6" opacity="0.12" />
      </g>
    </svg>
  )
}