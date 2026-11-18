/**
 * Invariants of the booking state over generated action sequences (REQ-17.3): a value is always the last one set
 * for that field (or empty), `touch` never changes a value, `setField` never touches a field, and a field the
 * sequence never set keeps its empty value.
 */
import { describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fc from 'fast-check'
import { ConfirmDialog } from '../../../src/components/ConfirmDialog'
import { SPIRITS } from '../../../src/data/spirits'
import { addDays, toIsoDate } from '../../../src/lib/clock'
import { formatLongDate, formatTime12h } from '../../../src/lib/format'
import { bookingReducer, initialState, type Action } from '../../../src/lib/bookingState'
import { FIELD_IDS_LIST, type BookingValues, type FieldId } from '../../../src/lib/steps'
import { checkProperty } from '../support/pbt'

const field = fc.constantFrom<FieldId>(...FIELD_IDS_LIST)
type Generated = Extract<Action, { type: 'setField' | 'touch' }>
const action: fc.Arbitrary<Generated> = fc.oneof(
  fc.record({ type: fc.constant('setField' as const), field, value: fc.string({ maxLength: 30 }) }),
  fc.record({ type: fc.constant('touch' as const), fields: fc.array(field, { maxLength: 3 }) }),
)

describe('booking reducer properties', () => {
  it('for any sequence of setField and touch actions, values are the last value set and touched is exactly what was touched', async () => {
    await checkProperty(fc.array(action, { maxLength: 40 }), (actions) => {
      const expectedValues = new Map<FieldId, string>()
      const expectedTouched = new Set<FieldId>()
      let state = initialState()
      for (const a of actions) {
        state = bookingReducer(state, a)
        if (a.type === 'setField') expectedValues.set(a.field, a.value)
        else for (const f of a.fields) expectedTouched.add(f)
      }
      for (const f of FIELD_IDS_LIST) {
        expect(state.values[f], `value of ${f}`).toBe(expectedValues.get(f) ?? '')
        expect(state.touched[f], `touched ${f}`).toBe(expectedTouched.has(f))
      }
      expect(state.status).toBe('editing')
    })
  })

  it('a touch action never changes any value', async () => {
    await checkProperty(fc.tuple(fc.array(action, { maxLength: 20 }), fc.array(field, { maxLength: 6 })), ([actions, fields]) => {
      const before = actions.reduce(bookingReducer, initialState())
      const after = bookingReducer(before, { type: 'touch', fields })
      expect(after.values).toEqual(before.values)
    })
  })

  it('an untouched, never-set field stays empty and untouched', () => {
    const s = bookingReducer(initialState(), { type: 'setField', field: 'name', value: 'x' })
    expect(s.values.email).toBe('')
    expect(s.touched.email).toBe(false)
  })
})

const TODAY_FIXED = new Date(2030, 9, 30)

/** A valid booking: a spirit, a date in the window, a half-hour time, a name, an e-mail and a phone number. */
const bookings: fc.Arbitrary<BookingValues> = fc.record({
  spirit: fc.constantFrom(...SPIRITS.map((s) => s.id)),
  date: fc.integer({ min: 1, max: 90 }).map((n) => toIsoDate(addDays(TODAY_FIXED, n))),
  time: fc.integer({ min: 0, max: 11 }).map((n) => `${String(18 + Math.floor(n / 2)).padStart(2, '0')}:${n % 2 ? '30' : '00'}`),
  name: fc.string({ unit: 'grapheme-ascii', minLength: 2, maxLength: 40 }).map((s) => s.trim()).filter((s) => s.length >= 2),
  email: fc.emailAddress(),
  phone: fc.stringMatching(/^\+?[0-9]{7,15}$/),
})

describe('confirmation dialog properties', () => {
  it('for any generated booking, the confirmation dialog shows all six values as text', async () => {
    await checkProperty(bookings, (values) => {
      render(<ConfirmDialog isOpen onClose={() => {}} onConfirm={() => {}} values={values} />)
      const dialog = document.querySelector('[role="dialog"]')!
      const shown = [...dialog.querySelectorAll('dd')].map((d) => d.textContent)
      expect(shown).toEqual([
        SPIRITS.find((s) => s.id === values.spirit)!.name,
        formatLongDate(values.date),
        formatTime12h(values.time),
        values.name,
        values.email,
        values.phone,
      ])
      expect(dialog.querySelector('input, select, textarea, img')).toBeNull()
      cleanup()
    })
  })

  it('the formatted date round-trips to the same calendar day', async () => {
    await checkProperty(fc.integer({ min: -2000, max: 20000 }), (offset) => {
      const day = addDays(new Date(2000, 0, 1), offset)
      const iso = toIsoDate(day)
      const parsed = new Date(formatLongDate(iso))
      expect(toIsoDate(parsed), `${iso} formatted as ${formatLongDate(iso)}`).toBe(iso)
    })
  })
})