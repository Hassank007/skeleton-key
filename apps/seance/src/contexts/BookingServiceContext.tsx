import { createContext, useContext, type ReactNode } from 'react'
import { submitBooking, type BookingService } from '../lib/bookingService'

const BookingServiceContext = createContext<BookingService>(submitBooking)

/** Supplies the booking service, so tests can replace it with an instant success or a failure (REQ-12.7). */
export function BookingServiceProvider({ service, children }: { service?: BookingService; children: ReactNode }) {
  return <BookingServiceContext.Provider value={service ?? submitBooking}>{children}</BookingServiceContext.Provider>
}

export function useBookingService(): BookingService {
  return useContext(BookingServiceContext)
}