/** Plain-text formatting for dates, times and status messages. Output is always text, never markup (REQ-7.6). */
import { parseIsoDate } from './clock'

const LONG_DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'full' })

/** `2030-11-13` gives `Wednesday, November 13, 2030`. A value that is not a real date is returned unchanged. */
export function formatLongDate(iso: string): string {
  const date = parseIsoDate(iso)
  return date ? LONG_DATE.format(date) : iso
}

/** A `Date` formatted the same way as `formatLongDate`. */
export function formatLongDateOf(date: Date): string {
  return LONG_DATE.format(date)
}

/** `20:30` gives `8:30 PM`; `00:05` gives `12:05 AM`. A value that is not `HH:MM` is returned unchanged. */
export function formatTime12h(time: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return time
  const hours = Number(match[1])
  const minutes = match[2]
  if (hours > 23 || Number(minutes) > 59) return time
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  return `${h12}:${minutes} ${suffix}`
}

/** The assertive message sent when an error summary appears. */
export function problemsMessage(count: number): string {
  return count === 1 ? '1 problem found. Fix it to continue.' : `${count} problems found. Fix them to continue.`
}

/** The polite message sent when the booking succeeds. */
export function formatSuccess(spiritName: string, isoDate: string, time: string): string {
  return `Séance booked with ${spiritName} on ${formatLongDate(isoDate)} at ${formatTime12h(time)}.`
}

/** The sentence on the success view. */
export function formatMeeting(spiritName: string, isoDate: string, time: string): string {
  return `${spiritName} will meet you on ${formatLongDate(isoDate)} at ${formatTime12h(time)}.`
}

/** The text of the failure item in the error summary (REQ-12.5). */
export const FAILURE_MESSAGE =
  'We could not book your séance. Your answers are kept. Press Review and book to try again.'