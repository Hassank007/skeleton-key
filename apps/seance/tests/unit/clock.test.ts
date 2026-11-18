import { afterEach, describe, expect, it, vi } from 'vitest'
import { addDays, parseIsoDate, toIsoDate, today } from '../../src/lib/clock'

describe('today', () => {
  afterEach(() => vi.useRealTimers())

  it('returns local midnight of the current day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2030, 9, 30, 15, 45, 12))
    const t = today()
    expect(toIsoDate(t)).toBe('2030-10-30')
    expect([t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds()]).toEqual([0, 0, 0, 0])
  })
})

describe('toIsoDate', () => {
  it('zero-pads month and day', () => {
    expect(toIsoDate(new Date(2030, 0, 5))).toBe('2030-01-05')
    expect(toIsoDate(new Date(2030, 11, 31))).toBe('2030-12-31')
  })
})

describe('addDays', () => {
  it('adds and subtracts calendar days', () => {
    expect(toIsoDate(addDays(new Date(2030, 9, 30), 1))).toBe('2030-10-31')
    expect(toIsoDate(addDays(new Date(2030, 9, 30), 90))).toBe('2031-01-28')
    expect(toIsoDate(addDays(new Date(2030, 9, 30), -30))).toBe('2030-09-30')
  })

  it('does not change its input', () => {
    const d = new Date(2030, 9, 30)
    addDays(d, 5)
    expect(toIsoDate(d)).toBe('2030-10-30')
  })

  it('crosses a daylight-saving change by calendar day, not by 24-hour blocks', () => {
    // US spring forward 2030-03-10 (23-hour day) and fall back 2030-11-03 (25-hour day).
    expect(toIsoDate(addDays(new Date(2030, 2, 9), 1))).toBe('2030-03-10')
    expect(toIsoDate(addDays(new Date(2030, 2, 9), 2))).toBe('2030-03-11')
    expect(toIsoDate(addDays(new Date(2030, 10, 2), 1))).toBe('2030-11-03')
    expect(toIsoDate(addDays(new Date(2030, 10, 2), 2))).toBe('2030-11-04')
    expect(addDays(new Date(2030, 10, 2), 2).getHours()).toBe(0)
  })

  it('handles a leap day', () => {
    expect(toIsoDate(addDays(new Date(2028, 1, 28), 1))).toBe('2028-02-29')
    expect(toIsoDate(addDays(new Date(2028, 1, 28), 2))).toBe('2028-03-01')
    expect(toIsoDate(addDays(new Date(2030, 1, 28), 1))).toBe('2030-03-01')
  })
})

describe('parseIsoDate', () => {
  it('parses a real date to local midnight', () => {
    const d = parseIsoDate('2030-11-13')
    expect(d).not.toBeNull()
    expect([d!.getFullYear(), d!.getMonth(), d!.getDate(), d!.getHours()]).toEqual([2030, 10, 13, 0])
  })

  it('accepts a leap day only in a leap year', () => {
    expect(parseIsoDate('2028-02-29')).not.toBeNull()
    expect(parseIsoDate('2030-02-29')).toBeNull()
  })

  it('rejects impossible dates', () => {
    expect(parseIsoDate('2030-02-31')).toBeNull()
    expect(parseIsoDate('2030-04-31')).toBeNull()
    expect(parseIsoDate('2030-13-01')).toBeNull()
    expect(parseIsoDate('2030-00-10')).toBeNull()
    expect(parseIsoDate('2030-10-00')).toBeNull()
  })

  it('rejects the wrong shape', () => {
    for (const bad of ['', '2030-1-1', '11/13/2030', '2030-11-13T00:00', ' 2030-11-13', 'abcd-ef-gh', '0000-01-01']) {
      expect(parseIsoDate(bad), JSON.stringify(bad)).toBeNull()
    }
  })

  it('round-trips with toIsoDate', () => {
    expect(toIsoDate(parseIsoDate('2031-01-28')!)).toBe('2031-01-28')
  })
})
