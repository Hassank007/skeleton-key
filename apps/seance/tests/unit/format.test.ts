import { describe, expect, it } from 'vitest'
import {
  FAILURE_MESSAGE,
  formatLongDate,
  formatLongDateOf,
  formatMeeting,
  formatSuccess,
  formatTime12h,
  problemsMessage,
} from '../../src/lib/format'

describe('formatLongDate', () => {
  it('formats a date in the long en-US form', () => {
    expect(formatLongDate('2030-11-13')).toBe('Wednesday, November 13, 2030')
    expect(formatLongDate('2031-01-28')).toBe('Tuesday, January 28, 2031')
    expect(formatLongDate('2028-02-29')).toBe('Tuesday, February 29, 2028')
  })

  it('returns an unreal date unchanged', () => {
    expect(formatLongDate('2030-02-31')).toBe('2030-02-31')
    expect(formatLongDate('')).toBe('')
  })

  it('formats a Date object the same way', () => {
    expect(formatLongDateOf(new Date(2030, 10, 13))).toBe('Wednesday, November 13, 2030')
  })
})

describe('formatTime12h', () => {
  it('formats evening times', () => {
    expect(formatTime12h('18:00')).toBe('6:00 PM')
    expect(formatTime12h('20:30')).toBe('8:30 PM')
    expect(formatTime12h('23:30')).toBe('11:30 PM')
  })

  it('formats midnight, noon and morning', () => {
    expect(formatTime12h('00:05')).toBe('12:05 AM')
    expect(formatTime12h('12:00')).toBe('12:00 PM')
    expect(formatTime12h('09:15')).toBe('9:15 AM')
  })

  it('returns anything else unchanged', () => {
    expect(formatTime12h('')).toBe('')
    expect(formatTime12h('25:00')).toBe('25:00')
    expect(formatTime12h('8:30')).toBe('8:30')
  })
})

describe('problemsMessage', () => {
  it('uses the singular for one problem', () => {
    expect(problemsMessage(1)).toBe('1 problem found. Fix it to continue.')
  })
  it('uses the plural otherwise', () => {
    expect(problemsMessage(2)).toBe('2 problems found. Fix them to continue.')
    expect(problemsMessage(3)).toBe('3 problems found. Fix them to continue.')
  })
})

describe('success and failure text', () => {
  it('formatSuccess builds the announcement', () => {
    expect(formatSuccess('Mara the Weeping Widow', '2030-11-13', '20:30')).toBe(
      'Séance booked with Mara the Weeping Widow on Wednesday, November 13, 2030 at 8:30 PM.',
    )
  })
  it('formatMeeting builds the sentence on the success view', () => {
    expect(formatMeeting('Captain Ashgrove', '2030-11-13', '18:00')).toBe(
      'Captain Ashgrove will meet you on Wednesday, November 13, 2030 at 6:00 PM.',
    )
  })
  it('the failure message says what happened and what to do', () => {
    expect(FAILURE_MESSAGE).toBe(
      'We could not book your séance. Your answers are kept. Press Review and book to try again.',
    )
  })
})