import { createContext, useContext, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import { bookingReducer, initialState, type Action, type BookingState } from '../lib/bookingState'
import { today as realToday } from '../lib/clock'

interface BookingContextValue {
  state: BookingState
  dispatch: Dispatch<Action>
  /** Local midnight of "today", fixed for the life of the provider so `min` and `max` never change under the user. */
  today: Date
}

export const BookingContext = createContext<BookingContextValue | null>(null)

/** Keeps the whole booking in memory above the routes, so answers survive step changes (WCAG 3.3.7). Nothing is persisted. */
export function BookingProvider({ today, children }: { today?: Date; children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, undefined, initialState)
  const [fixedToday] = useState(() => today ?? realToday())
  const value = useMemo(() => ({ state, dispatch, today: fixedToday }), [state, fixedToday])
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

/** Returns the booking store. Must be used inside <BookingProvider>. */
export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within a <BookingProvider>')
  return ctx
}