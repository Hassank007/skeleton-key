/**
 * Plain validators, one per field. Each returns null (valid) or a message that says what is wrong and how to fix it
 * (WCAG 3.3.1, 3.3.3). Pure and total: no side effects, never throws, never echoes the input (REQ-7.6, 7.7).
 */
import { SPIRITS } from '../data/spirits'
import { addDays, parseIsoDate, toIsoDate } from './clock'
import { formatLongDateOf } from './format'
import { STEPS, type BookingValues, type FieldId, type StepId } from './steps'

export type { BookingValues, FieldId, StepId } from './steps'

export type Validator = (value: string, today: Date) => string | null
export type FieldErrors = Partial<Record<FieldId, string>>

/** The DOM id of the control for each field. The error summary links to these. */
export const FIELD_IDS: Record<FieldId, string> = {
  spirit: 'field-spirit',
  date: 'field-date',
  time: 'field-time',
  name: 'field-name',
  email: 'field-email',
  phone: 'field-phone',
}

/** The booking window: tomorrow to this many days after today. */
export const WINDOW_DAYS = 90
export const TIME_MIN = '18:00'
export const TIME_MAX = '23:30'

export const MESSAGES = {
  spirit: 'Choose a spirit to continue.',
  dateEmpty: 'Enter a date.',
  dateNotReal: 'Enter a real date, for example 11/13/2030.',
  dateTooEarly: 'Choose a date from tomorrow onwards.',
  dateTooLate: (last: string) => `Choose a date on or before ${last}.`,
  timeEmpty: 'Enter a time.',
  timeOutside: 'Choose a time between 6:00 PM and 11:30 PM.',
  timeNotHalfHour: 'Choose a time on the hour or half hour, for example 8:30 PM.',
  nameEmpty: 'Enter your full name.',
  nameLength: 'Enter a name of 2 to 80 characters.',
  emailEmpty: 'Enter your email address.',
  emailShape: 'Enter an email address in the form name@example.com.',
  phoneEmpty: 'Enter your phone number.',
  phoneChars: 'Use only digits, spaces, plus, hyphens, dots and brackets.',
  phoneDigits: 'Enter a phone number with 7 to 15 digits.',
} as const

export function validateSpirit(value: string): string | null {
  return SPIRITS.some((s) => s.id === value) ? null : MESSAGES.spirit
}

export function validateDate(value: string, today: Date): string | null {
  if (value === '') return MESSAGES.dateEmpty
  const parsed = parseIsoDate(value)
  if (!parsed) return MESSAGES.dateNotReal
  const first = addDays(today, 1)
  const last = addDays(today, WINDOW_DAYS)
  const iso = toIsoDate(parsed)
  if (iso < toIsoDate(first)) return MESSAGES.dateTooEarly
  if (iso > toIsoDate(last)) return MESSAGES.dateTooLate(formatLongDateOf(last))
  return null
}

export function validateTime(value: string): string | null {
  if (value === '') return MESSAGES.timeEmpty
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return MESSAGES.timeOutside
  if (value < TIME_MIN || value > TIME_MAX) return MESSAGES.timeOutside
  if (match[2] !== '00' && match[2] !== '30') return MESSAGES.timeNotHalfHour
  return null
}

export function validateName(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) return MESSAGES.nameEmpty
  const length = Array.from(trimmed).length
  return length >= 2 && length <= 80 ? null : MESSAGES.nameLength
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) return MESSAGES.emailEmpty
  const parts = trimmed.split('@')
  if (parts.length !== 2) return MESSAGES.emailShape
  const [local, domain] = parts
  if (local.length < 1 || local.length > 64 || /\s/.test(local)) return MESSAGES.emailShape
  if (domain.length > 255 || /\s/.test(domain) || !domain.includes('.')) return MESSAGES.emailShape
  if (domain.startsWith('.') || domain.endsWith('.')) return MESSAGES.emailShape
  if (domain.split('.').some((label) => label.length === 0)) return MESSAGES.emailShape
  return null
}

export function validatePhone(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) return MESSAGES.phoneEmpty
  if (!/^[0-9 +().-]+$/.test(trimmed)) return MESSAGES.phoneChars
  if (trimmed.lastIndexOf('+') > 0) return MESSAGES.phoneChars
  const digits = trimmed.replace(/\D/g, '').length
  return digits >= 7 && digits <= 15 ? null : MESSAGES.phoneDigits
}

export const validators: Record<FieldId, Validator> = {
  spirit: (v) => validateSpirit(v),
  date: (v, today) => validateDate(v, today),
  time: (v) => validateTime(v),
  name: (v) => validateName(v),
  email: (v) => validateEmail(v),
  phone: (v) => validatePhone(v),
}

/** Errors for the fields of one step, in the step's field order (which is DOM order). */
export function validateStep(step: StepId, values: BookingValues, today: Date): FieldErrors {
  const def = STEPS.find((s) => s.id === step)
  const errors: FieldErrors = {}
  if (!def) return errors
  for (const field of def.fields) {
    const message = validators[field](values[field] ?? '', today)
    if (message !== null) errors[field] = message
  }
  return errors
}