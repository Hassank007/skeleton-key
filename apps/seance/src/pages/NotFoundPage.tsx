/** Not-found page: sets a unique title and an h1 so unknown URLs still get focus and a page name (WCAG 2.4.2, 2.4.3). The way back uses AppLink, so it has the token link colour in both themes (WCAG 1.4.3). */
import { useEffect } from 'react'
import { AppLink } from '../components/AppLink'

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found — Seance'
  }, [])

  return (
    <article>
      <h1 tabIndex={-1}>Page not found</h1>
      <p>
        There is no page at this address. <AppLink href="/">Go to the home page</AppLink>.
      </p>
    </article>
  )
}
