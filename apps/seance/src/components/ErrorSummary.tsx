/** Focusable summary of every problem, with one link per field error; focus goes here on a failed submit (WCAG 2.4.3, 3.3.1). */
import type { MouseEvent, Ref } from 'react'
import type { FieldId } from '../lib/steps'
import { FIELD_IDS } from '../lib/validate'
import styles from './ErrorSummary.module.css'

export interface ErrorSummaryItem {
  /** The field the problem belongs to. An item without a field is plain text, not a link. */
  field?: FieldId
  message: string
}

interface ErrorSummaryProps {
  items: readonly ErrorSummaryItem[]
  /** Called when a link is activated. The page moves focus to the control; the URL does not change. */
  onActivate: (field: FieldId) => void
  ref?: Ref<HTMLDivElement>
}

const TITLE_ID = 'error-summary-title'

export function ErrorSummary({ items, onActivate, ref }: ErrorSummaryProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>, field: FieldId) {
    event.preventDefault()
    onActivate(field)
  }

  return (
    <div ref={ref} role="group" tabIndex={-1} aria-labelledby={TITLE_ID} className={styles.summary}>
      <h2 id={TITLE_ID} className={styles.title}>
        There is a problem
      </h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.field ?? item.message}>
            {item.field ? (
              <a href={`#${FIELD_IDS[item.field]}`} className={styles.link} onClick={(e) => handleClick(e, item.field as FieldId)}>
                {item.message}
              </a>
            ) : (
              <span>{item.message}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}