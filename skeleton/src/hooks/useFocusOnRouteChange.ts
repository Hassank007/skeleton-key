/** Moves focus to the page h1 and announces the page title on every route change (WCAG 2.4.3, 4.1.3). */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAnnounce } from './useAnnounce'

export function useFocusOnRouteChange(): void {
  const location = useLocation()
  const announce = useAnnounce()

  useEffect(() => {
    // Defer to let the page component render its <h1> and set document.title.
    const id = setTimeout(() => {
      announce(document.title)

      const h1 = document.querySelector<HTMLElement>('main h1[tabindex="-1"]')
      if (h1) {
        h1.focus({ preventScroll: false })
      }
    }, 0)

    return () => clearTimeout(id)
    // location.pathname is the right dependency — we re-run on each navigation.
  }, [location.pathname])
}
