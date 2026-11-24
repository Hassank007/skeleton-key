/** Native radio group in a fieldset with a legend; the error is text linked by aria-describedby, and the arrow keys are the browser's own (WCAG 1.3.1, 3.3.2, 4.1.2). */
import { SPIRITS } from '../data/spirits'
import { FIELD_IDS } from '../lib/validate'
import type { StepProps } from './stepTypes'
import { SpiritPortrait } from './SpiritPortrait'
import styles from './SpiritStep.module.css'

/** Decorative warning icon. The "Error:" text carries the meaning. */
function ErrorIcon() {
  return (
    <svg aria-hidden="true" focusable="false" className={styles.errorIcon} viewBox="0 0 16 16" fill="currentColor" width="1em" height="1em">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4zm0 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  )
}

export function SpiritStep({ values, errors, onChange, onBlur }: StepProps) {
  const error = errors.spirit
  const errorId = `${FIELD_IDS.spirit}-error`

  return (
    <fieldset
      className={styles.group}
      // ARIA in HTML allows role=radiogroup on fieldset, and a radiogroup supports aria-invalid; a bare radio does not (design.md section 1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
      role="radiogroup"
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className={styles.legend}>Which spirit would you like to meet?</legend>
      {error && (
        <span id={errorId} className={styles.error}>
          <ErrorIcon />
          <span>
            <span className={styles.errorPrefix}>Error: </span>
            {error}
          </span>
        </span>
      )}
      {SPIRITS.map((spirit, index) => {
        // The first radio carries the id the error summary links to.
        const id = index === 0 ? FIELD_IDS.spirit : `spirit-${spirit.id}`
        const selected = values.spirit === spirit.id
        return (
          <div key={spirit.id} className={`${styles.option} ${selected ? styles.selected : ''}`}>
            <input
              className={styles.radio}
              type="radio"
              name="spirit"
              id={id}
              value={spirit.id}
              checked={selected}
              required
              aria-labelledby={`${id}-name`}
              aria-describedby={`${id}-blurb`}
              onChange={() => onChange('spirit', spirit.id)}
              onBlur={() => onBlur('spirit')}
            />
            {/* The label wraps the name and the blurb, so the whole card is the click target (WCAG 2.5.8).
                aria-labelledby keeps the accessible name to the spirit's name; the blurb is the description. */}
            <label htmlFor={id} className={styles.label}>
              <span className={styles.portrait}>
                <SpiritPortrait id={spirit.id} />
              </span>
              <span id={`${id}-name`} className={styles.name}>
                {spirit.name}
              </span>
              <span id={`${id}-blurb`} className={styles.blurb}>
                {spirit.blurb} Speciality: {spirit.speciality}.
              </span>
            </label>
          </div>
        )
      })}
    </fieldset>
  )
}