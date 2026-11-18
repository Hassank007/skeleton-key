/**
 * Invariant: for any set of invalid fields, the error summary has one link per error, in field order, and every
 * href matches the id of a control that is rendered (REQ-17.2, WCAG 3.3.1, 2.4.3).
 */
import { describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fc from 'fast-check'
import { DetailsStep } from '../../../src/components/DetailsStep'
import { ErrorSummary } from '../../../src/components/ErrorSummary'
import { SpiritStep } from '../../../src/components/SpiritStep'
import { WhenStep } from '../../../src/components/WhenStep'
import { FIELD_IDS_LIST, type FieldId } from '../../../src/lib/steps'
import type { FieldErrors } from '../../../src/lib/validate'
import { checkProperty, SKIPPED } from '../support/pbt'
import { EMPTY_VALUES, TODAY } from '../support/booking-fixtures'

const subsets = fc.subarray([...FIELD_IDS_LIST] as FieldId[], { minLength: 1 })

describe('error summary property', () => {
  it('for any set of invalid fields, there is one link per error in field order and every href matches a rendered control id', async () => {
    await checkProperty(subsets, (fields) => {
      const ordered = FIELD_IDS_LIST.filter((f) => fields.includes(f))
      const errors: FieldErrors = {}
      for (const f of ordered) errors[f] = `Problem with ${f}.`
      const noop = () => {}
      const stepProps = { values: EMPTY_VALUES, errors, onChange: noop, onBlur: noop }
      const { container } = render(
        <>
          <ErrorSummary items={ordered.map((field) => ({ field, message: errors[field]! }))} onActivate={noop} />
          <SpiritStep {...stepProps} />
          <WhenStep {...stepProps} today={TODAY} />
          <DetailsStep {...stepProps} />
        </>,
      )
      const links = [...container.querySelectorAll<HTMLAnchorElement>('[aria-labelledby="error-summary-title"] a')]
      expect(links).toHaveLength(ordered.length)
      expect(links.map((l) => l.textContent)).toEqual(ordered.map((f) => errors[f]))
      for (const link of links) {
        const id = link.getAttribute('href')!.slice(1)
        const target = container.querySelector(`#${id}`)
        expect(target, `href ${link.getAttribute('href')} has a control`).not.toBeNull()
        expect(['INPUT', 'SELECT', 'TEXTAREA']).toContain(target!.tagName)
      }
      cleanup()
      return fields.length > 0 ? undefined : SKIPPED
    })
  })
})