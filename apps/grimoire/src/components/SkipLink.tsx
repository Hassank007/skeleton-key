/** Visually-hidden skip link that becomes visible on :focus-visible; first focusable DOM element and moves focus to <main> (WCAG 2.4.1). */
import type { MouseEvent } from 'react'
import styles from './SkipLink.module.css'

export function SkipLink() {
  // Browsers don't reliably move keyboard focus to a fragment target, so focus <main> explicitly.
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById('main-content')
    if (main) {
      event.preventDefault()
      main.focus()
      main.scrollIntoView?.()
    }
  }

  return (
    <a href="#main-content" className={styles.skipLink} onClick={handleClick}>
      Skip to main content
    </a>
  )
}
