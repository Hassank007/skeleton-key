/**
 * Invariants of the six validators over generated input (REQ-17.2, 7.7): the booking window, the visiting hours,
 * name length, e-mail shape, phone digits, and totality (never throws, always a sentence or null).
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { addDays, toIsoDate } from '../../../src/lib/clock'
import { validateDate, validateEmail, validateName, validatePhone, validateTime, validators } from '../../../src/lib/validate'
import { checkProperty } from '../support/pbt'
import type { FieldId } from '../../../src/lib/steps'

/** A local-midnight "today" anywhere between 2000 and 2090, so leap days and daylight-saving changes occur. */
const todays = fc
  .date({ min: new Date(2000, 0, 1), max: new Date(2090, 11, 31), noInvalidDate: true })
  .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()))

const pad = (n: number) => String(n).padStart(2, '0')

describe('validator properties', () => {
  it('for any today, day offsets 1 to 90 give a valid date and every other offset gives an error', async () => {
    await checkProperty(fc.tuple(todays, fc.integer({ min: -400, max: 400 })), ([today, offset]) => {
      const iso = toIsoDate(addDays(today, offset))
      const result = validateDate(iso, today)
      if (offset >= 1 && offset <= 90) expect(result, `${iso} at offset ${offset}`).toBeNull()
      else expect(result, `${iso} at offset ${offset}`).not.toBeNull()
    })
  })

  it('every half-hour time from 18:00 to 23:30 is valid and every other HH:MM is not', async () => {
    await checkProperty(fc.tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 })), ([h, m]) => {
      const time = `${pad(h)}:${pad(m)}`
      const inHours = time >= '18:00' && time <= '23:30'
      const onHalfHour = m === 0 || m === 30
      if (inHours && onHalfHour) expect(validateTime(time), time).toBeNull()
      else expect(validateTime(time), time).not.toBeNull()
    })
  })

  it('every name of 2 to 80 non-blank characters is valid', async () => {
    const names = fc
      .string({ unit: 'grapheme-ascii', minLength: 2, maxLength: 80 })
      .filter((s) => s.trim().length >= 2)
    await checkProperty(names, (name) => {
      expect(validateName(name), JSON.stringify(name)).toBeNull()
    })
  })

  it('every whitespace-only string is not a valid name', async () => {
    const blanks = fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r', '\u00a0', '\u2003', '\u3000'), { maxLength: 40 })
      .map((a) => a.join(''))
    await checkProperty(blanks, (blank) => {
      expect(validateName(blank), JSON.stringify(blank)).not.toBeNull()
    })
  })

  it('every address from fc.emailAddress() is accepted', async () => {
    await checkProperty(fc.emailAddress(), (email) => {
      expect(validateEmail(email), email).toBeNull()
    })
  })

  it('any string without an @ is rejected as an e-mail address', async () => {
    await checkProperty(
      fc.string({ unit: 'grapheme', maxLength: 60 }).filter((s) => !s.includes('@')),
      (text) => {
        expect(validateEmail(text), JSON.stringify(text)).not.toBeNull()
      },
    )
  })

  it('any phone of 7 to 15 digits with allowed separators is valid', async () => {
    const digits = fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 7, maxLength: 15 })
    const separators = fc.constantFrom('', ' ', '-', '.', '(', ')')
    const phone = fc
      .tuple(digits, fc.array(separators, { minLength: 16, maxLength: 16 }), fc.boolean())
      .map(([ds, seps, plus]) => (plus ? '+' : '') + ds.map((d, i) => `${seps[i]}${d}`).join(''))
    await checkProperty(phone, (value) => {
      expect(validatePhone(value), value).toBeNull()
    })
  })

  it('any string containing a letter is rejected as a phone number', async () => {
    const letter = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
    await checkProperty(
      fc.tuple(fc.stringMatching(/^[0-9 ()+.-]{0,12}$/), letter, fc.stringMatching(/^[0-9 ()+.-]{0,12}$/)),
      ([a, l, b]) => {
        expect(validatePhone(`${a}${l}${b}`), `${a}${l}${b}`).not.toBeNull()
      },
    )
  })

  it('every validator is total, and returns null or a non-empty sentence that ends with a full stop', async () => {
    const fields = Object.keys(validators) as FieldId[]
    await checkProperty(
      fc.tuple(fc.constantFrom(...fields), fc.string({ unit: 'binary', maxLength: 300 }), todays),
      ([field, value, today]) => {
        let result: string | null = ''
        expect(() => {
          result = validators[field](value, today)
        }).not.toThrow()
        if (result !== null) {
          expect(result.length).toBeGreaterThan(0)
          expect(result.endsWith('.'), result).toBe(true)
          expect(result).not.toMatch(/[<>]/)
        }
      },
    )
  })

  it('validation is deterministic: the same input and today give the same result', async () => {
    const fields = Object.keys(validators) as FieldId[]
    await checkProperty(
      fc.tuple(fc.constantFrom(...fields), fc.string({ maxLength: 60 }), todays),
      ([field, value, today]) => {
        expect(validators[field](value, today)).toBe(validators[field](value, today))
      },
    )
  })
})