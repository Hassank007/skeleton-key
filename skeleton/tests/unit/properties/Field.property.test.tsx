/**
 * Invariant: for any Field configuration, the control is named by its visible label, is described
 * by exactly the hint and error that exist, is aria-invalid only when an error exists, shows
 * "Error:" text, and has no axe violations.
 * See .kiro/specs/a11y-pbt/design.md, "Property 2: Field".
 *
 * axe's `color-contrast` rule cannot run in jsdom (no layout, and setup.ts stubs canvas
 * getContext), so "zero violations" here does not mean colour contrast was verified.
 * Colour contrast is covered by the token property (contrast.property.test.ts).
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { computeAccessibleName } from 'dom-accessibility-api'
import fc from 'fast-check'
import { axe } from 'vitest-axe'
import type { InputHTMLAttributes, ReactElement } from 'react'
import { Field } from '../../../src/components/Field'
import { checkProperty } from '../support/pbt'

const KINDS = ['text', 'email', 'password', 'tel', 'url', 'search', 'number', 'date', 'textarea', 'select'] as const
type Kind = (typeof KINDS)[number]

const normalise = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim()

/** Non-empty text: spaces, punctuation, quotes, `<`, `&`, non-ASCII. Whitespace is collapsed. */
const text = fc
  .string({ unit: 'grapheme', minLength: 1, maxLength: 40 })
  .map((s) => s.replace(/\s+/g, ' ').trim())
  .filter((s) => s.length > 0)

const special = fc.constantFrom('Say "hi" & <b>bye</b>', "O'Neil & Sons <ltd>", 'Ünïcödé — 日本語 ✓', 'a < b && c > d')

/** A message is absent (undefined), the empty string, whitespace-only, or real text. */
const message = fc.option(fc.oneof(text, special, fc.constant(''), fc.constant('   ')), { nil: undefined })

const config = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/),
  label: fc.oneof(text, special),
  hint: message,
  error: message,
  required: fc.boolean(),
  kind: fc.constantFrom<Kind>(...KINDS),
})
function control(kind: Kind): ReactElement<InputHTMLAttributes<HTMLElement>> {
  if (kind === 'textarea') return <textarea />
  if (kind === 'select') {
    return (
      <select>
        <option value="a">A</option>
      </select>
    )
  }
  return <input type={kind} />
}

/** A message exists only when it has visible text. */
const exists = (m: string | undefined): m is string => m !== undefined && m.trim() !== ''

describe('Field property', () => {
  it(
    'labels, describes and flags every configuration correctly [SC 1.3.1, 3.3.1, 3.3.2]',
    async () => {
      await checkProperty(config, async (c) => {
        const { container, unmount } = render(
          <Field id={c.id} label={c.label} hint={c.hint} error={c.error} required={c.required}>
            {control(c.kind)}
          </Field>,
        )
        try {
          const el = container.querySelector<HTMLElement>(`[id="${c.id}"]`)
          expect(el, 'control with the generated id').not.toBeNull()
          const input = el as HTMLElement

          // Accessible name equals the visible label text (REQ-4.4).
          const label = container.querySelector(`label[for="${c.id}"]`)
          expect(label, 'label tied with for/id').not.toBeNull()
          expect(normalise(computeAccessibleName(input))).toBe(normalise(label?.textContent))
          expect(normalise(label?.textContent)).toBe(normalise(c.label + (c.required ? ' (required)' : '')))

          // aria-describedby lists exactly the hint and error that exist, in order (REQ-4.5, 4.6).
          const expected = [exists(c.hint) ? `${c.id}-hint` : null, exists(c.error) ? `${c.id}-error` : null].filter(
            (x): x is string => x !== null,
          )
          const describedBy = input.getAttribute('aria-describedby')
          expect(describedBy === null ? [] : describedBy.split(' ')).toEqual(expected)
          if (expected.length === 0) expect(input.hasAttribute('aria-describedby')).toBe(false)
          for (const id of expected) {
            expect(container.querySelectorAll(`[id="${id}"]`)).toHaveLength(1)
          }
          // No stray hint or error element when the message is absent.
          expect(container.querySelectorAll(`[id="${c.id}-hint"]`)).toHaveLength(exists(c.hint) ? 1 : 0)
          expect(container.querySelectorAll(`[id="${c.id}-error"]`)).toHaveLength(exists(c.error) ? 1 : 0)
          expect(container.querySelectorAll(`[id="${c.id}"]`)).toHaveLength(1)

          // aria-invalid is "true" iff an error exists (REQ-4.7).
          const invalid = input.getAttribute('aria-invalid')
          if (exists(c.error)) expect(invalid).toBe('true')
          else expect(invalid === null || invalid === 'false').toBe(true)

          // The error is text, starting with "Error:" (REQ-4.8).
          if (exists(c.error)) {
            const errorEl = container.querySelector(`[id="${c.id}-error"]`)
            expect(normalise(errorEl?.textContent).startsWith('Error:')).toBe(true)
            expect(normalise(errorEl?.textContent)).toBe(`Error: ${normalise(c.error)}`)
          }

          // No axe violations (REQ-4.9).
          expect(await axe(container)).toHaveNoViolations()
        } finally {
          unmount()
        }
      })
    },
    60_000,
  )
})
