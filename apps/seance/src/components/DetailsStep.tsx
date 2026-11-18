/** Three labelled inputs with the right autocomplete tokens and input hints; paste is never blocked (WCAG 1.3.5, 3.3.2, 3.3.8). */
import { Field } from './Field'
import { FormStack } from './FormStack'
import { FIELD_IDS } from '../lib/validate'
import type { StepProps } from './stepTypes'

export function DetailsStep({ values, errors, onChange, onBlur }: StepProps) {
  return (
    <FormStack>
      <Field
        id={FIELD_IDS.name}
        label="Full name"
        hint="As you would like the spirit to address you."
        required
        error={errors.name}
      >
        <input
          type="text"
          required
          autoComplete="name"
          autoCapitalize="words"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          onBlur={() => onBlur('name')}
        />
      </Field>
      <Field id={FIELD_IDS.email} label="Email address" hint="For example name@example.com." required error={errors.email}>
        <input
          type="email"
          required
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={values.email}
          onChange={(e) => onChange('email', e.target.value)}
          onBlur={() => onBlur('email')}
        />
      </Field>
      <Field
        id={FIELD_IDS.phone}
        label="Phone number"
        hint="Digits, spaces, plus, hyphens and brackets. For example +44 20 7946 0000."
        required
        error={errors.phone}
      >
        <input
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          onBlur={() => onBlur('phone')}
        />
      </Field>
    </FormStack>
  )
}