/** Back (a plain button) and Next / Review and book (the submit). While submitting the submit uses aria-disabled, not disabled, so focus is not lost (WCAG 2.4.3, 4.1.3). */
import { Button } from './Button'
import { STEPS } from '../lib/steps'
import styles from './StepActions.module.css'

interface StepActionsProps {
  /** Zero-based index of the current step. */
  index: number
  submitting: boolean
  onBack: () => void
}

export function StepActions({ index, submitting, onBack }: StepActionsProps) {
  const isLast = index === STEPS.length - 1
  return (
    <div className={styles.actions}>
      {index > 0 && (
        <Button type="button" variant="secondary" className={styles.button} onClick={onBack}>
          Back
        </Button>
      )}
      <Button type="submit" className={styles.button} aria-disabled={submitting ? 'true' : undefined}>
        {isLast ? 'Review and book' : 'Next'}
      </Button>
    </div>
  )
}