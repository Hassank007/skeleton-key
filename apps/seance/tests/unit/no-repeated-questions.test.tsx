/** No repeated questions (REQ-10.1, WCAG 3.3.7): across the three steps no control name or autocomplete token is used twice. */
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { computeAccessibleName } from 'dom-accessibility-api'
import { DetailsStep } from '../../src/components/DetailsStep'
import { SpiritStep } from '../../src/components/SpiritStep'
import { WhenStep } from '../../src/components/WhenStep'
import { EMPTY_VALUES, TODAY } from './support/booking-fixtures'

const noop = () => {}
const props = { values: EMPTY_VALUES, errors: {}, onChange: noop, onBlur: noop }

/** Accessible name and autocomplete token of every control in a rendered step. */
function controls(ui: React.ReactElement): { name: string; autocomplete: string | null; type: string }[] {
  const { container, unmount } = render(ui)
  const out = [...container.querySelectorAll<HTMLInputElement>('input, select, textarea')].map((el) => ({
    name: computeAccessibleName(el).replace(/\s*\(required\)\s*$/, ''),
    autocomplete: el.getAttribute('autocomplete'),
    type: el.type,
  }))
  unmount()
  return out
}

/** Names that must be unique. The radios share one question (the group legend), so they count once. */
export function duplicates(values: (string | null)[]): string[] {
  const seen = new Set<string>()
  const dup = new Set<string>()
  for (const v of values) {
    if (!v) continue
    if (seen.has(v)) dup.add(v)
    seen.add(v)
  }
  return [...dup]
}

describe('no repeated questions', () => {
  const spirit = controls(<SpiritStep {...props} />)
  const when = controls(<WhenStep {...props} today={TODAY} />)
  const details = controls(<DetailsStep {...props} />)

  it('collects the controls of every step', () => {
    expect(spirit).toHaveLength(4)
    expect(when).toHaveLength(2)
    expect(details).toHaveLength(3)
  })

  it('no accessible name repeats across the steps, counting the radio group once', () => {
    const names = [...spirit.map((c) => c.name), ...when.map((c) => c.name), ...details.map((c) => c.name)]
    expect(duplicates(names), `repeated names: ${duplicates(names).join(', ')}`).toEqual([])
  })

  it('no autocomplete token repeats across the steps', () => {
    const tokens = [...spirit, ...when, ...details].map((c) => c.autocomplete)
    expect(duplicates(tokens)).toEqual([])
    expect(tokens.filter(Boolean).sort()).toEqual(['email', 'name', 'tel'])
  })

  it('negative control: a duplicate is detected', () => {
    expect(duplicates(['Date', 'Time', 'Date'])).toEqual(['Date'])
    expect(duplicates(['email', 'name', 'email'])).toEqual(['email'])
  })

  it('step 3 has exactly three text-entry controls and the other steps have none', () => {
    const text = (cs: typeof details) => cs.filter((c) => ['text', 'email', 'tel'].includes(c.type))
    expect(text(details)).toHaveLength(3)
    expect(text(spirit)).toHaveLength(0)
    expect(text(when)).toHaveLength(0)
  })
})