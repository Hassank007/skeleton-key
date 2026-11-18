import { act, render, type RenderResult } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AnnouncerProvider } from '../../../src/contexts/AnnouncerContext'
import { BookingProvider } from '../../../src/contexts/BookingContext'
import { BookingServiceProvider } from '../../../src/contexts/BookingServiceContext'
import { MotionProvider } from '../../../src/contexts/MotionContext'
import type { BookingService } from '../../../src/lib/bookingService'
import App from '../../../src/App'
import { SPIRITS } from '../../../src/data/spirits'
import type { BookingValues } from '../../../src/lib/steps'

/** The fixed "today" for unit tests: 2030-10-30. The booking window is 2030-10-31 to 2031-01-28. */
export const TODAY = new Date(2030, 9, 30)

export const EMPTY_VALUES: BookingValues = { spirit: '', date: '', time: '', name: '', email: '', phone: '' }

/** A complete, valid booking with invented data. */
export const VALID_VALUES: BookingValues = {
  spirit: SPIRITS[0].id,
  date: '2030-11-13',
  time: '20:30',
  name: 'Ada Example',
  email: 'ada@example.com',
  phone: '+44 20 7946 0000',
}

/** A service that resolves at once. */
export const instantService: BookingService = () => Promise.resolve()

interface Options {
  route?: string
  service?: BookingService
}

/** Renders inside the real providers (router, motion, announcer, booking, service) so live regions exist and can be read. */
export function renderApp(ui: ReactElement, { route = '/', service = instantService }: Options = {}): RenderResult {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <MotionProvider>
        <AnnouncerProvider>
          <BookingServiceProvider service={service}>
            <BookingProvider today={TODAY}>{ui}</BookingProvider>
          </BookingServiceProvider>
        </AnnouncerProvider>
      </MotionProvider>
    </MemoryRouter>,
  )
}

/** The announcer writes on two microtasks and the route hook on a timeout; wait for both. */
export async function flushAnnouncer(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5))
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Text of the shared polite or assertive live region. */
export function liveText(kind: 'polite' | 'assertive'): string {
  return document.querySelector(`[aria-live="${kind}"]`)?.textContent ?? ''
}
/** Renders the whole app (shell, routes, focus hook) at `route`, with a fixed today and an injected service. */
export function renderRoutes(route: string, { service = instantService, extra }: { service?: BookingService; extra?: ReactNode } = {}): RenderResult {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <MotionProvider>
        <AnnouncerProvider>
          <App today={TODAY} service={service} />
          {extra}
        </AnnouncerProvider>
      </MotionProvider>
    </MemoryRouter>,
  )
}
/** Prints the router location, so a test can prove a link did not change it. */
export function LocationProbe() {
  const { pathname, hash } = useLocation()
  return <output data-testid="location">{pathname + hash}</output>
}