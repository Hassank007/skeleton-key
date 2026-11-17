/** Renders toasts into the shared polite live region; auto-dismisses after ≥5 s, pauses on hover/focus, dismissible by keyboard; no animation when reduced motion is on (WCAG 4.1.3, 2.2.1, 2.3.3). */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useMotion } from '../contexts/MotionContext'
import { useAnnounce } from '../hooks/useAnnounce'
import styles from './Toast.module.css'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ToastItem {
  id: string
  message: string
  /** Duration in ms before auto-dismiss. Minimum 5000 (enforced). */
  duration?: number
}

interface ToastContextValue {
  addToast: (message: string, options?: { duration?: number }) => void
}

// ── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

/** Returns the addToast function. Must be called inside <ToastProvider>. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

// ── Individual Toast item ────────────────────────────────────────────────────

interface SingleToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

function SingleToast({ toast, onDismiss }: SingleToastProps) {
  const { reducedMotion } = useMotion()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef<number>(0)
  const remainingRef = useRef<number>(Math.max(toast.duration ?? 5000, 5000))

  const dismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id])

  function startTimer() {
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(dismiss, remainingRef.current)
  }

  function pauseTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      remainingRef.current = Math.max(
        0,
        remainingRef.current - (Date.now() - startTimeRef.current),
      )
    }
  }

  // Start the auto-dismiss timer on mount.
  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, []) // startTimer uses only refs, stable across renders

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- role="status" needs hover/focus handlers to pause the auto-dismiss timer (WCAG 2.2.1)
    <div
      className={[styles.toast, reducedMotion ? styles.noMotion : ''].filter(Boolean).join(' ')}
      role="status"
      aria-live="off"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      onFocus={pauseTimer}
      onBlur={startTimer}
    >
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        aria-label={`Dismiss: ${toast.message}`}
        className={styles.dismiss}
        onClick={dismiss}
      >
        {/* ✕ icon, decorative */}
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="currentColor" width="1em" height="1em">
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
        </svg>
      </button>
    </div>
  )
}

// ── ToastRegion ──────────────────────────────────────────────────────────────

interface ToastRegionProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

/**
 * Renders the visual toast stack.
 * Note: announcements go through the shared AnnouncerContext live region,
 * not through a second live region here. The individual toast items use
 * role="status" with aria-live="off" so they are visible but do not
 * double-announce.
 */
function ToastRegion({ toasts, onDismiss }: ToastRegionProps) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.region} role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <SingleToast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ── ToastProvider ────────────────────────────────────────────────────────────

/** Provides addToast() to the whole tree and renders the toast stack. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const announce = useAnnounce()
  let counter = 0

  const addToast = useCallback(
    (message: string, options?: { duration?: number }) => {
      const id = `toast-${Date.now()}-${counter++}`
      setToasts((prev) => [...prev, { id, message, duration: options?.duration }])
      // Announce through the shared polite live region (not a second region).
      announce(message)
    },
    [announce],
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
