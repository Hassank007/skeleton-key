import { describe, expect, it } from 'vitest'
import { SPIRITS } from '../../src/data/spirits'
import { bookingReducer, firstInvalidStep, initialState, isStepValid, STEPS, type BookingState } from '../../src/lib/bookingState'

const TODAY = new Date(2030, 9, 30)

function filled(overrides: Partial<BookingState['values']> = {}): BookingState {
  const s = initialState()
  return {
    ...s,
    values: {
      spirit: SPIRITS[0].id,
      date: '2030-11-13',
      time: '20:30',
      name: 'Ada Example',
      email: 'ada@example.com',
      phone: '+44 20 7946 0000',
      ...overrides,
    },
  }
}

describe('bookingReducer', () => {
  it('starts empty, untouched and editing', () => {
    const s = initialState()
    expect(Object.values(s.values).every((v) => v === '')).toBe(true)
    expect(Object.values(s.touched).every((t) => t === false)).toBe(true)
    expect(s.status).toBe('editing')
  })

  it('setField changes one value and does not touch the field', () => {
    const s = bookingReducer(initialState(), { type: 'setField', field: 'name', value: 'Ada' })
    expect(s.values.name).toBe('Ada')
    expect(s.values.email).toBe('')
    expect(s.touched.name).toBe(false)
  })

  it('setField with the same value returns the same state', () => {
    const s = initialState()
    expect(bookingReducer(s, { type: 'setField', field: 'name', value: '' })).toBe(s)
  })

  it('touch adds fields to the touched set and keeps others', () => {
    const a = bookingReducer(initialState(), { type: 'touch', fields: ['date'] })
    const b = bookingReducer(a, { type: 'touch', fields: ['time'] })
    expect(b.touched.date).toBe(true)
    expect(b.touched.time).toBe(true)
    expect(b.touched.name).toBe(false)
  })

  it('touch of already touched fields returns the same state', () => {
    const a = bookingReducer(initialState(), { type: 'touch', fields: ['date'] })
    expect(bookingReducer(a, { type: 'touch', fields: ['date'] })).toBe(a)
  })

  it('submitStart, submitOk and submitFail set the status and keep the answers', () => {
    const base = filled()
    expect(bookingReducer(base, { type: 'submitStart' }).status).toBe('submitting')
    expect(bookingReducer(base, { type: 'submitOk' }).status).toBe('booked')
    const failed = bookingReducer(base, { type: 'submitFail' })
    expect(failed.status).toBe('failed')
    expect(failed.values).toEqual(base.values)
  })

  it('reset clears every field, the touched set and the status', () => {
    const dirty = bookingReducer(bookingReducer(filled(), { type: 'touch', fields: ['name'] }), { type: 'submitOk' })
    expect(bookingReducer(dirty, { type: 'reset' })).toEqual(initialState())
  })
})

describe('isStepValid and firstInvalidStep', () => {
  it('knows which steps are valid', () => {
    const s = filled({ name: '' })
    expect(isStepValid(s, 'spirit', TODAY)).toBe(true)
    expect(isStepValid(s, 'time', TODAY)).toBe(true)
    expect(isStepValid(s, 'details', TODAY)).toBe(false)
  })

  it('returns null when every step is valid', () => {
    expect(firstInvalidStep(filled(), TODAY)).toBeNull()
  })

  it('returns the index of the first invalid step', () => {
    expect(firstInvalidStep(initialState(), TODAY)).toBe(0)
    expect(firstInvalidStep(filled({ date: '' }), TODAY)).toBe(1)
    expect(firstInvalidStep(filled({ email: 'nope' }), TODAY)).toBe(2)
    expect(firstInvalidStep(filled({ spirit: '', date: '' }), TODAY)).toBe(0)
  })

  it('STEPS lists three steps in order with their paths', () => {
    expect(STEPS.map((s) => s.path)).toEqual(['/book/spirit', '/book/time', '/book/details'])
  })
})