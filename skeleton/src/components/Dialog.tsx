/** APG modal dialog: focus moves in on open, Tab is trapped inside, Escape closes, focus returns to trigger; background is inert (WCAG 2.1.2, 2.4.3). */
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './Dialog.module.css'

interface DialogProps {
  /** Controls whether the dialog is visible. */
  isOpen: boolean
  /** Callback to close the dialog. */
  onClose: () => void
  /** Accessible title shown in the dialog heading. */
  title: string
  /** Optional longer description; added to aria-describedby when provided. */
  description?: string
  /** Dialog body content. */
  children: ReactNode
}

/** Returns all focusable elements within a container, in DOM order. */
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

export function Dialog({ isOpen, onClose, title, description, children }: DialogProps) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  // Store the element that had focus when the dialog opened, so we can return focus on close.
  const returnFocusRef = useRef<Element | null>(null)

  // ── Capture trigger and move focus into dialog ─────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Capture the currently focused element before the dialog opens.
      returnFocusRef.current = document.activeElement
      const panel = panelRef.current
      if (!panel) return
      // Move focus to the first focusable element (or the panel itself as fallback).
      const focusable = getFocusable(panel)
      const target = focusable[0] ?? panel
      const raf = requestAnimationFrame(() => target.focus())
      return () => cancelAnimationFrame(raf)
    } else {
      // Dialog just closed — return focus to the saved element.
      const el = returnFocusRef.current
      if (el && typeof (el as HTMLElement).focus === 'function') {
        ;(el as HTMLElement).focus()
      }
      returnFocusRef.current = null
    }
  }, [isOpen])

  // ── Inert background ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    // Mark the app root inert so AT and keyboard cannot reach it.
    const root = document.getElementById('root')
    if (root) root.setAttribute('inert', '')
    return () => {
      if (root) root.removeAttribute('inert')
    }
  }, [isOpen])

  // ── Tab trap ───────────────────────────────────────────────────────────────
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    if (e.key !== 'Tab') return

    const panel = panelRef.current
    if (!panel) return
    const focusable = getFocusable(panel)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  if (!isOpen) return null

  return createPortal(
    // The backdrop closes the dialog on click. Keyboard users close via Escape
    // (handled in the panel's onKeyDown). The backdrop itself is not focusable
    // and needs no keyboard listener — the ESLint rule is suppressed here because
    // this is a standard APG modal backdrop pattern.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className={styles.backdrop} onClick={onClose} data-testid="dialog-backdrop">
      {/* role="dialog" is an interactive ARIA role; jsx-a11y incorrectly flags
          onKeyDown on it. Suppressed as the pattern is correct per APG. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={styles.panel}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            className={styles.closeButton}
            onClick={onClose}
          >
            {/* ✕ icon, hidden from AT via aria-hidden */}
            <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="currentColor" width="1em" height="1em">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
            </svg>
          </button>
        </div>

        {description && (
          <p id={descId} className={styles.body} style={{ marginBottom: 'var(--space-4)' }}>
            {description}
          </p>
        )}

        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
