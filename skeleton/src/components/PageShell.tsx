/** Renders the full page scaffold: skip link, header, labelled nav, main, and footer; exactly one of each landmark (WCAG 1.3.1, 2.4.1). */
import { type ReactNode, useEffect, useRef } from 'react'
import { SkipLink } from './SkipLink'
import { AppLink } from './AppLink'
import { MotionToggle } from './MotionToggle'
import styles from './PageShell.module.css'

interface PageShellProps {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  const headerRef = useRef<HTMLElement>(null)

  // Keep --header-height in sync with the actual header size via ResizeObserver.
  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentBoxSize?.[0]?.blockSize ?? entry.contentRect.height
        document.documentElement.style.setProperty(
          '--header-height',
          `${height}px`,
        )
      }
    })
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Skip link must be the very first focusable element in the DOM */}
      <SkipLink />

      <header ref={headerRef} className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.siteName} aria-hidden="true">
            🗝 Skeleton Key
          </span>
          <nav aria-label="Main" className={styles.nav}>
            <ul className={styles.navList}>
              <li>
                <AppLink href="/">Home</AppLink>
              </li>
              <li>
                <AppLink href="/about">About</AppLink>
              </li>
            </ul>
          </nav>
          <MotionToggle />
        </div>
      </header>

      <main id="main-content" className={styles.main} tabIndex={-1}>
        {children}
      </main>

      <footer className={styles.footer}>
        <p>
          Skeleton Key — an accessible-by-default web app skeleton. MIT
          licensed.
        </p>
      </footer>
    </>
  )
}
