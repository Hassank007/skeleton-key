/** The booking service. There is no back end: it resolves after a short delay and sends nothing (REQ-12.1). */
import type { BookingValues } from './steps'

export type BookingService = (booking: BookingValues) => Promise<void>

export const SERVICE_DELAY_MS = 700

export const submitBooking: BookingService = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, SERVICE_DELAY_MS)
  })