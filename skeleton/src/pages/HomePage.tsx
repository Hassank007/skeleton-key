/** Home page — sets document title and renders the page h1 for focus management (WCAG 2.4.2, 2.4.3). */
import { useEffect } from 'react'
import styles from './HomePage.module.css'

/** Decorative ghost SVG — purely visual, hidden from AT (WCAG 1.1.1). */
function DecorativeGhost() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={styles.decorativeGhost}
      viewBox="0 0 64 80"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      {/* Ghost body */}
      <path d="M32 4C18.75 4 8 14.75 8 28v32l8-8 8 8 8-8 8 8 8-8v-32C48 14.75 37.25 4 32 4z" opacity="0.18" />
      {/* Eyes */}
      <ellipse cx="24" cy="30" rx="4" ry="5" opacity="0.35" />
      <ellipse cx="40" cy="30" rx="4" ry="5" opacity="0.35" />
    </svg>
  )
}

export function HomePage() {
  useEffect(() => {
    document.title = 'Home — Skeleton Key'
  }, [])

  return (
    <article>
      <h1 tabIndex={-1}>Welcome to Skeleton Key</h1>

      {/* Decorative ghost illustration — aria-hidden, carries no meaning */}
      <DecorativeGhost />

      <p>
        Skeleton Key is a lean, accessible-by-default web app starter. Every
        app built from it passes WCAG 2.2 AA on day one, so your team starts
        from "accessible" instead of retrofitting it later.
      </p>
      <p>
        Use the navigation above to explore. All interactions work with keyboard
        only, and a screen reader will announce each page change automatically.
      </p>
    </article>
  )
}
