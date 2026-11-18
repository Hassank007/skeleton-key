/** Moves focus to the page h1 and announces the page title on every route change (WCAG 2.4.3, 4.1.3). */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAnnounce } from './useAnnounce'

export function useFocusOnRouteChange(): void {
  const location = useLocation()
  const announce = useAnnounce()
  // Last pathname we handled. It starts at the initial page, so the first load leaves focus at the
  // top of the document (the skip link stays the first Tab stop) and StrictMode effect re-runs are no-ops.
  const handledPath = useRef(location.pathname)

  useEffect(() => {
    if (handledPath.current === location.pathname) return
    // Defer to let the page component render its <h1> and set document.title.
    const id = setTimeout(() => {
      handledPath.current = location.pathname
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
