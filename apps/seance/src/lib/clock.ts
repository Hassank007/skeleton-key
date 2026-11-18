/** Date helpers on local calendar days. `today()` is the single source of "now", so tests can replace it (REQ-5.7). */

/** Today at local midnight. */
export function today(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** A new date `days` calendar days after `date`, at local midnight. Uses setDate, so it is right across daylight-saving changes. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

/** `YYYY-MM-DD` of the local calendar day. */
export function toIsoDate(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`
}

/** Parses `YYYY-MM-DD` to a local-midnight date. Returns null for a wrong shape or an impossible date such as 2030-02-31. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1) return null
  const date = new Date(2000, 0, 1)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}
