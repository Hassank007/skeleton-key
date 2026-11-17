/** Visually-hidden skip link that becomes visible on :focus-visible; first focusable DOM element (WCAG 2.4.1). */
import styles from './SkipLink.module.css'

export function SkipLink() {
  return (
    <a href="#main-content" className={styles.skipLink}>
      Skip to main content
    </a>
  )
}
