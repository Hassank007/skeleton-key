import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

interface MotionContextValue {
  /** True when animations should be suppressed (OS setting or user toggle). */
  reducedMotion: boolean
  /** Toggles the user's in-app motion preference for the current session. */
  toggle: () => void
}

const MotionContext = createContext<MotionContextValue | null>(null)

/** Provides reduced-motion state derived from the OS media query plus an in-app override toggle. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const mediaQuery =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null

  const [osReducedMotion, setOsReducedMotion] = useState(
    () => mediaQuery?.matches ?? false,
  )
  const [userOverride, setUserOverride] = useState<boolean | null>(null)

  // Listen for OS-level changes.
  useEffect(() => {
    if (!mediaQuery) return
    const handler = (e: MediaQueryListEvent) => {
      setOsReducedMotion(e.matches)
      // If the OS now requests reduced motion, the user override is irrelevant —
      // OS preference always wins when it asks for less motion.
      if (e.matches) setUserOverride(null)
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [mediaQuery])

  // Derive the effective value: OS wins when it wants reduction.
  const reducedMotion = osReducedMotion || (userOverride ?? false)

  // Sync to <html data-reduced-motion="..."> so CSS can respond.
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-reduced-motion',
      String(reducedMotion),
    )
  }, [reducedMotion])

  const toggle = useCallback(() => {
    // If OS already requests reduced motion, the toggle cannot enable motion.
    if (osReducedMotion) return
    setUserOverride((prev) => !(prev ?? false))
  }, [osReducedMotion])

  return (
    <MotionContext.Provider value={{ reducedMotion, toggle }}>
      {children}
    </MotionContext.Provider>
  )
}

/** Returns the current motion context value. Must be used inside <MotionProvider>. */
export function useMotion(): MotionContextValue {
  const ctx = useContext(MotionContext)
  if (!ctx) {
    throw new Error('useMotion must be used within a <MotionProvider>')
  }
  return ctx
}
