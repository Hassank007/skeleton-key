/** Empty-result message: real text with the fix, plus the clear button; deliberately not role="alert" (WCAG 3.3.3, 4.1.3). */
import { EMPTY_HINT } from '../lib/filterBooks'
import { Button } from './Button'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  onClear: () => void
}

export function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <svg
        aria-hidden="true"
        focusable="false"
        className={styles.art}
        viewBox="0 0 64 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M32 10C24 6 14 6 6 9v32c8-3 18-3 26 1 8-4 18-4 26-1V9c-8-3-18-3-26 1z" />
        <path d="M32 10v32" />
      </svg>
      <p className={styles.message}>
        <strong>No spellbooks found.</strong>
      </p>
      <p>{EMPTY_HINT}</p>
      <Button type="button" variant="secondary" onClick={onClear}>
        Clear search and filters
      </Button>
    </div>
  )
}
