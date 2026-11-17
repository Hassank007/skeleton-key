/** Wraps React Router <Link> for internal URLs and <a> for external; always produces an <a href>; external links include visually-hidden "opens in new tab" text (WCAG 2.4.4, 4.1.2). */
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import styles from './AppLink.module.css'

interface AppLinkProps {
  /** The URL to navigate to. Relative paths are treated as internal. */
  href: string
  children: ReactNode
  className?: string
}

export function AppLink({ href, children, className }: AppLinkProps) {
  const isExternal =
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//')

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={[styles.link, className].filter(Boolean).join(' ')}
      >
        {children}
        <span className={styles.srOnly}>&nbsp;(opens in new tab)</span>
      </a>
    )
  }

  return (
    <Link
      to={href}
      className={[styles.link, className].filter(Boolean).join(' ')}
    >
      {children}
    </Link>
  )
}
