/** Not-found page: sets a unique title and an h1 so unknown URLs still get focus and a page name (WCAG 2.4.2, 2.4.3). */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found - Skeleton Key'
  }, [])

  return (
    <article>
      <h1 tabIndex={-1}>Page not found</h1>
      <p>
        There is no page at this address. <Link to="/">Go to the home page</Link>.
      </p>
    </article>
  )
}
