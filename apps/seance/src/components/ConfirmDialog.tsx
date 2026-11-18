/** Confirmation step built on the skeleton Dialog (APG modal pattern). Shows earlier answers as read-only text and asks for no input (WCAG 3.3.4, 3.3.7). */
import { Button } from './Button'
import { Dialog } from './Dialog'
import { findSpirit } from '../data/spirits'
import { formatLongDate, formatTime12h } from '../lib/format'
import type { BookingValues } from '../lib/steps'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  isOpen: boolean
  /** Close without booking. Focus returns to the button that opened the dialog. */
  onClose: () => void
  /** Book. The caller closes the dialog and starts the submission. */
  onConfirm: () => void
  values: BookingValues
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, values }: ConfirmDialogProps) {
  const rows: [string, string][] = [
    ['Spirit', findSpirit(values.spirit)?.name ?? values.spirit],
    ['Date', formatLongDate(values.date)],
    ['Time', formatTime12h(values.time)],
    ['Name', values.name.trim()],
    ['Email', values.email.trim()],
    ['Phone', values.phone.trim()],
  ]

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm your séance"
      description="Check your booking. Nothing is booked until you confirm."
    >
      <dl className={styles.list}>
        {rows.map(([term, value]) => (
          <div key={term} className={styles.row}>
            <dt className={styles.term}>{term}</dt>
            <dd className={styles.value}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.actions}>
        <Button type="button" variant="primary" className={styles.button} onClick={onConfirm}>
          Book my séance
        </Button>
        <Button type="button" variant="secondary" className={styles.button} onClick={onClose}>
          Go back and edit
        </Button>
      </div>
    </Dialog>
  )
}