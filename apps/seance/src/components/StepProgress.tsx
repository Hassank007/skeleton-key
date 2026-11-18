/** Shows "Step N of 3" and a list of the steps with their state in words, so progress never depends on colour or shape (WCAG 1.3.1, 1.4.1). Not a landmark and not a live region. */
import type { ReactNode } from 'react'
import { STEPS } from '../lib/steps'
import styles from './StepProgress.module.css'

interface StepProgressProps {
  /** Zero-based index of the current step. */
  current: number
  /** The page heading. Rendered directly under the "Step N of 3" text, above the list. */
  heading: ReactNode
}

function stateOf(index: number, current: number): 'completed' | 'current' | 'not started' {
  if (index < current) return 'completed'
  if (index === current) return 'current'
  return 'not started'
}

export function StepProgress({ current, heading }: StepProgressProps) {
  return (
    <div className={styles.progress}>
      <p className={styles.count}>
        Step {current + 1} of {STEPS.length}
      </p>
      {heading}
      <ol className={styles.steps} aria-label="Booking steps">
        {STEPS.map((step, index) => {
          const state = stateOf(index, current)
          return (
            <li
              key={step.id}
              className={`${styles.item} ${styles[state === 'not started' ? 'todo' : state]}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className={styles.marker} aria-hidden="true">
                {state === 'completed' ? '\u2713' : index + 1}
              </span>
              <span className={styles.name}>
                {step.name} <span className={styles.state}>({state})</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}