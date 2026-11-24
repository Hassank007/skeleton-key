/** Success text on the same route, with no live region of its own: the announcement comes from the shared announcer (WCAG 4.1.3). */
import { Button } from './Button'
import { SpiritPortrait } from './SpiritPortrait'
import { findSpirit } from '../data/spirits'
import { formatMeeting } from '../lib/format'
import type { BookingValues } from '../lib/steps'
import styles from './SuccessPanel.module.css'

interface SuccessPanelProps {
  values: BookingValues
  onBookAnother: () => void
}

export function SuccessPanel({ values, onBookAnother }: SuccessPanelProps) {
  const spiritName = findSpirit(values.spirit)?.name ?? ''
  return (
    <div className={styles.panel}>
      <div className={styles.portrait}>
        <SpiritPortrait id={values.spirit} />
      </div>
      <p className={styles.meeting}>{formatMeeting(spiritName, values.date, values.time)}</p>
      <p className={styles.notice}>This is a demo. Nothing was stored or sent.</p>
      <Button type="button" className={styles.button} onClick={onBookAnother}>
        Book another séance
      </Button>
    </div>
  )
}