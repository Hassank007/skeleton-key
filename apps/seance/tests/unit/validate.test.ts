import { describe, expect, it } from 'vitest'
import { SPIRITS } from '../../src/data/spirits'
import {
  FIELD_IDS,
  validateDate,
  validateEmail,
  validateName,
  validatePhone,
  validateSpirit,
  validateStep,
  validateTime,
  validators,
} from '../../src/lib/validate'
import { STEPS } from '../../src/lib/steps'

/** The fixed "today" for these tests: 2030-10-30. The window is 2030-10-31 to 2031-01-28. */
const TODAY = new Date(2030, 9, 30)

describe('validateSpirit', () => {
  it('accepts every known spirit id', () => {
    for (const s of SPIRITS) expect(validateSpirit(s.id)).toBeNull()
  })
  it('asks for a choice when empty or unknown', () => {
    expect(validateSpirit('')).toBe('Choose a spirit to continue.')
    expect(validateSpirit('nobody')).toBe('Choose a spirit to continue.')
  })
})

describe('validateDate', () => {
  it('asks for a date when empty', () => {
    expect(validateDate('', TODAY)).toBe('Enter a date.')
  })
  it('rejects values that are not real dates', () => {
    const message = 'Enter a real date, for example 11/13/2030.'
    expect(validateDate('2030-02-31', TODAY)).toBe(message)
    expect(validateDate('11/13/2030', TODAY)).toBe(message)
    expect(validateDate('2030-13-01', TODAY)).toBe(message)
    expect(validateDate('abc', TODAY)).toBe(message)
  })
  it('rejects today and the past', () => {
    expect(validateDate('2030-10-30', TODAY)).toBe('Choose a date from tomorrow onwards.')
    expect(validateDate('2020-01-01', TODAY)).toBe('Choose a date from tomorrow onwards.')
  })
  it('accepts the first day of the window (tomorrow)', () => {
    expect(validateDate('2030-10-31', TODAY)).toBeNull()
  })
  it('accepts the last day of the window (90 days out)', () => {
    expect(validateDate('2031-01-28', TODAY)).toBeNull()
  })
  it('rejects the day after the window and names the last date', () => {
    expect(validateDate('2031-01-29', TODAY)).toBe('Choose a date on or before Tuesday, January 28, 2031.')
  })
  it('accepts a normal date in the window', () => {
    expect(validateDate('2030-11-13', TODAY)).toBeNull()
  })
})

describe('validateTime', () => {
  it('asks for a time when empty', () => {
    expect(validateTime('')).toBe('Enter a time.')
  })
  it('accepts both ends of the visiting hours', () => {
    expect(validateTime('18:00')).toBeNull()
    expect(validateTime('23:30')).toBeNull()
    expect(validateTime('20:30')).toBeNull()
  })
  it('rejects 5:59 PM and 11:31 PM as outside the hours', () => {
    const message = 'Choose a time between 6:00 PM and 11:30 PM.'
    expect(validateTime('17:59')).toBe(message)
    expect(validateTime('23:31')).toBe(message)
    expect(validateTime('00:00')).toBe(message)
    expect(validateTime('24:00')).toBe(message)
    expect(validateTime('8:30')).toBe(message)
  })
  it('rejects a time inside the hours that is not on a half hour', () => {
    const message = 'Choose a time on the hour or half hour, for example 8:30 PM.'
    expect(validateTime('18:15')).toBe(message)
    expect(validateTime('20:45')).toBe(message)
    expect(validateTime('23:01')).toBe(message)
  })
})

describe('validateName', () => {
  it('asks for a name when empty or blank', () => {
    expect(validateName('')).toBe('Enter your full name.')
    expect(validateName('   ')).toBe('Enter your full name.')
  })
  it('accepts 2 and 80 characters after trimming', () => {
    expect(validateName('Ed')).toBeNull()
    expect(validateName('a'.repeat(80))).toBeNull()
    expect(validateName(`  ${'a'.repeat(80)}  `)).toBeNull()
  })
  it('rejects 1 and 81 characters', () => {
    const message = 'Enter a name of 2 to 80 characters.'
    expect(validateName('E')).toBe(message)
    expect(validateName('  E  ')).toBe(message)
    expect(validateName('a'.repeat(81))).toBe(message)
  })
})

describe('validateEmail', () => {
  it('asks for an address when empty', () => {
    expect(validateEmail('')).toBe('Enter your email address.')
    expect(validateEmail('  ')).toBe('Enter your email address.')
  })
  it('accepts ordinary addresses', () => {
    expect(validateEmail('ada@example.com')).toBeNull()
    expect(validateEmail('  ada.l+tag@mail.example.co.uk ')).toBeNull()
  })
  it('rejects the wrong shape', () => {
    const message = 'Enter an email address in the form name@example.com.'
    for (const bad of ['ada', 'ada@', '@example.com', 'ada@example', 'a@@example.com', 'a@b@example.com', 'ada@.com', 'ada@example.', 'ada@exa..mple.com', 'a da@example.com', 'ada@exa mple.com']) {
      expect(validateEmail(bad), bad).toBe(message)
    }
  })
  it('limits the local part to 64 and the domain to 255 characters', () => {
    expect(validateEmail(`${'a'.repeat(64)}@example.com`)).toBeNull()
    expect(validateEmail(`${'a'.repeat(65)}@example.com`)).not.toBeNull()
    expect(validateEmail(`a@${'b'.repeat(251)}.com`)).toBeNull()
    expect(validateEmail(`a@${'b'.repeat(252)}.com`)).not.toBeNull()
  })
})

describe('validatePhone', () => {
  it('asks for a number when empty', () => {
    expect(validatePhone('')).toBe('Enter your phone number.')
  })
  it('accepts 7 and 15 digits', () => {
    expect(validatePhone('1234567')).toBeNull()
    expect(validatePhone('123456789012345')).toBeNull()
    expect(validatePhone('+44 20 7946 0000')).toBeNull()
    expect(validatePhone('(020) 7946-0000')).toBeNull()
    expect(validatePhone('020.7946.0000')).toBeNull()
  })
  it('rejects 6 and 16 digits', () => {
    const message = 'Enter a phone number with 7 to 15 digits.'
    expect(validatePhone('123456')).toBe(message)
    expect(validatePhone('1234567890123456')).toBe(message)
  })
  it('rejects letters and other characters', () => {
    const message = 'Use only digits, spaces, plus, hyphens, dots and brackets.'
    expect(validatePhone('555-CALL-NOW')).toBe(message)
    expect(validatePhone('1234567x')).toBe(message)
    expect(validatePhone('123/4567')).toBe(message)
  })
  it('rejects a plus that is not at the start', () => {
    expect(validatePhone('44+2079460000')).toBe('Use only digits, spaces, plus, hyphens, dots and brackets.')
  })
})

describe('validateStep', () => {
  const empty = { spirit: '', date: '', time: '', name: '', email: '', phone: '' }

  it('lists errors in the field order of the step', () => {
    expect(Object.keys(validateStep('time', empty, TODAY))).toEqual(['date', 'time'])
    expect(Object.keys(validateStep('details', empty, TODAY))).toEqual(['name', 'email', 'phone'])
    expect(Object.keys(validateStep('spirit', empty, TODAY))).toEqual(['spirit'])
  })

  it('returns no errors for a valid step', () => {
    expect(validateStep('time', { ...empty, date: '2030-11-13', time: '20:30' }, TODAY)).toEqual({})
  })

  it('only looks at the fields of the step', () => {
    expect(validateStep('spirit', { ...empty, spirit: SPIRITS[0].id }, TODAY)).toEqual({})
  })
})

describe('FIELD_IDS and validators', () => {
  it('has one DOM id and one validator for each field of every step', () => {
    for (const step of STEPS)
      for (const field of step.fields) {
        expect(FIELD_IDS[field]).toBe(`field-${field}`)
        expect(typeof validators[field]).toBe('function')
      }
  })

  it('messages never echo the input', () => {
    const secret = 'Zq9-secret-Zq9'
    for (const field of Object.keys(validators) as (keyof typeof validators)[]) {
      const message = validators[field](secret, TODAY)
      if (message) expect(message).not.toContain(secret)
    }
  })
})