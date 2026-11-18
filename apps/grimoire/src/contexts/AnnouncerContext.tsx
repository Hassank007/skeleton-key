import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

/** Options for the announce function. */
interface AnnounceOptions {
  /** When true the message goes into the assertive live region (use sparingly). */
  assertive?: boolean
}

/** The function signature exposed to consumers. */
type AnnounceFn = (message: string, options?: AnnounceOptions) => void

const AnnouncerContext = createContext<AnnounceFn | null>(null)

export { AnnouncerContext }
export type { AnnounceFn }

/**
 * Mounts two visually-hidden live regions (polite and assertive) once at the
 * root; exposes `announce()` so any component can queue an AT announcement
 * without rendering its own live region (WCAG 4.1.3).
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null)
  const assertiveRef = useRef<HTMLDivElement>(null)

  const announce = useCallback<AnnounceFn>((message, options) => {
    const region = options?.assertive ? assertiveRef.current : politeRef.current
    if (!region) return

    // Clear on a microtask before writing so AT re-announces the same string.
    Promise.resolve().then(() => {
      region.textContent = ''
      // A second microtask ensures the DOM settles between clear and write.
      Promise.resolve().then(() => {
        region.textContent = message
      })
    })
  }, [])

  return (
    <AnnouncerContext.Provider value={announce}>
      {/* Live regions are mounted in the DOM before any message is sent
          so assistive technology has time to register them (REQ-4.4). */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        style={visuallyHidden}
      />
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        style={visuallyHidden}
      />
      {children}
    </AnnouncerContext.Provider>
  )
}

/** Returns the `announce` function from context. Must be inside <AnnouncerProvider>. */
export function useAnnounce(): AnnounceFn {
  const announce = useContext(AnnouncerContext)
  if (!announce) {
    throw new Error('useAnnounce must be used within an <AnnouncerProvider>')
  }
  return announce
}

/** CSS-in-JS style object for visually-hidden elements (still in AT tree). */
const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
