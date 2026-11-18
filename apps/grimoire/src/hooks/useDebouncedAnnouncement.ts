/** Sends one polite status message after the search has settled, so screen-reader users hear the result count without a second live region (WCAG 4.1.3). */
import { useEffect, useRef } from 'react'
import { useAnnounce } from './useAnnounce'

/**
 * Announces `message` politely `delayMs` after `key` last changed. A newer change cancels the pending message
 * (last value wins). Nothing is sent on first render, so a return from a detail page stays silent
 * (the route-change announcement already covers it). The timer is cancelled on unmount. Never assertive.
 */
export function useDebouncedAnnouncement(message: string, key: string, delayMs = 500): void {
  const announce = useAnnounce()
  const latestMessage = useRef(message)
  // null until the first effect has run; also makes the StrictMode double run a no-op.
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    latestMessage.current = message
  })

  useEffect(() => {
    if (lastKey.current === null) {
      lastKey.current = key
      return
    }
    if (lastKey.current === key) return
    lastKey.current = key
    const id = setTimeout(() => announce(latestMessage.current), delayMs)
    return () => clearTimeout(id)
  }, [key, delayMs, announce])
}
