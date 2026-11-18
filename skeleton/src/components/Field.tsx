/**
 * Wires <label>, hint, and error to the input via aria-describedby; sets aria-invalid on error;
 * never conveys error state by colour alone (WCAG 1.3.1, 3.3.1–3.3.3).
 *
 * Inline error design: the error span has NO role="alert". Flooding multiple simultaneous alerts
 * when a form is submitted with many invalid fields overwhelms screen-reader users. Instead:
 *   - aria-invalid="true" on the input signals the error state when the field receives focus.
 *   - aria-describedby links the input to the error span so AT reads it on focus.
 *   - Submit-time announcement is the job of an error summary component: focus it on submit,
 *     and use the shared live-region announcer (assertive) for a single consolidated message.
 * See design.md § Field error handling.
 */
import type { InputHTMLAttributes, ReactElement, ReactNode } from 'react'
import { cloneElement } from 'react'
import styles from './Field.module.css'

interface FieldProps {
  /** The id that will be applied to the child input element. */
  id: string
  /** Visible label text. */
  label: ReactNode
  /** Optional hint shown below the label, above the input. */
  hint?: ReactNode
  /** Error message. When set, aria-invalid is applied to the input. */
  error?: ReactNode
  /** The input element (input, select, textarea). Must accept id, aria-describedby, and aria-invalid. */
  children: ReactElement<InputHTMLAttributes<HTMLElement> & { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling' }>
  /** Whether the field is required. When true, adds "(required)" text to the label. */
  required?: boolean
}

/**
 * ErrorIcon — a small inline SVG warning icon, hidden from AT.
 * The error state is also conveyed by the "Error:" text prefix.
 */
function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={styles.errorIcon}
      viewBox="0 0 16 16"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  )
}

/** An empty or whitespace-only string is no message; so are null, undefined and booleans. */
function hasContent(node: ReactNode): boolean {
  if (node == null || typeof node === 'boolean') return false
  if (typeof node === 'string') return node.trim() !== ''
  return true
}

export function Field({ id, label, hint, error, children, required }: FieldProps) {
  const hasHint = hasContent(hint)
  const hasError = hasContent(error)
  const hintId = hasHint ? `${id}-hint` : undefined
  const errorId = hasError ? `${id}-error` : undefined

  // Build aria-describedby from whichever IDs are present.
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  // Clone the child to inject a11y props without coupling to a specific input type.
  const childWithProps = cloneElement(children, {
    id,
    'aria-describedby': describedBy,
    ...(hasError ? { 'aria-invalid': 'true' as const } : {}),
  })

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required}> (required)</span>
        )}
      </label>

      {hasHint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}

      {childWithProps}

      {hasError && (
        <span id={errorId} className={styles.error}>
          <ErrorIcon />
          <span>
            <span className={styles.errorPrefix}>Error: </span>
            {error}
          </span>
        </span>
      )}
    </div>
  )
}
