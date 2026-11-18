/** Native date and time inputs with visible labels, hints that name the allowed range, and no custom picker (WCAG 1.3.1, 2.1.1, 3.3.2). No autocomplete token: a booking date is not data about the user (WCAG 1.3.5 does not apply). */
import { Field } from './Field'
import { FormStack } from './FormStack'
import { addDays, toIsoDate } from '../lib/clock'
import { formatLongDateOf } from '../lib/format'
import { FIELD_IDS, TIME_MAX, TIME_MIN, WINDOW_DAYS } from '../lib/validate'
import type { StepProps } from './stepTypes'

interface WhenStepProps extends StepProps {
  /** Local midnight of today. The window runs from tomorrow to 90 days later. */
  today: Date
}

export function WhenStep({ values, errors, onChange, onBlur, today }: WhenStepProps) {
  const first = addDays(today, 1)
  const last = addDays(today, WINDOW_DAYS)

  return (
    <FormStack>
      <Field
        id={FIELD_IDS.date}
        label="Date"
        hint={`Choose a day from ${formatLongDateOf(first)} to ${formatLongDateOf(last)}. Fill in the month, day and year.`}
        required
        error={errors.date}
      >
        <input
          type="date"
          required
          min={toIsoDate(first)}
          max={toIsoDate(last)}
          value={values.date}
          onChange={(e) => onChange('date', e.target.value)}
          onBlur={() => onBlur('date')}
        />
      </Field>
      <Field
        id={FIELD_IDS.time}
        label="Time"
        hint="Visiting hours are 6:00 PM to 11:30 PM, every 30 minutes."
        required
        error={errors.time}
      >
        <input
          type="time"
          required
          min={TIME_MIN}
          max={TIME_MAX}
          step={1800}
          value={values.time}
          onChange={(e) => onChange('time', e.target.value)}
          onBlur={() => onBlur('time')}
        />
      </Field>
    </FormStack>
  )
}