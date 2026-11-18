/** Step guard (REQ-3.3): every route against every partial booking redirects to the first invalid step, with replace. */
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigationType } from 'react-router-dom'
import { BookingPage } from '../../src/pages/BookingPage'
import { BookingProvider } from '../../src/contexts/BookingContext'
import { AnnouncerProvider } from '../../src/contexts/AnnouncerContext'
import { MotionProvider } from '../../src/contexts/MotionContext'
import { BookingContext } from '../../src/contexts/BookingContext'
import { STEPS } from '../../src/lib/steps'
import { LocationProbe, TODAY, VALID_VALUES } from './support/booking-fixtures'
import { initialState } from '../../src/lib/bookingState'
import type { BookingValues } from '../../src/lib/steps'
import { useMemo, useReducer } from 'react'
import { bookingReducer } from '../../src/lib/bookingState'

/** A provider that starts from a given set of values, to test every partial booking. */
function SeededProvider({ values, children }: { values: BookingValues; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, { ...initialState(), values })
  const value = useMemo(() => ({ state, dispatch, today: TODAY }), [state])
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

function NavType() {
  return <output data-testid="nav-type">{useNavigationType()}</output>
}

const SPIRIT_OK = { spirit: VALID_VALUES.spirit }
const WHEN_OK = { date: VALID_VALUES.date, time: VALID_VALUES.time }
const DETAILS_OK = { name: VALID_VALUES.name, email: VALID_VALUES.email, phone: VALID_VALUES.phone }
const BLANK: BookingValues = { spirit: '', date: '', time: '', name: '', email: '', phone: '' }

/** Every combination of which steps are filled in. */
const PARTIALS: { label: string; values: BookingValues; filled: boolean[] }[] = []
for (let mask = 0; mask < 8; mask++) {
  const filled = [Boolean(mask & 1), Boolean(mask & 2), Boolean(mask & 4)]
  PARTIALS.push({
    label: filled.map((f, i) => `${STEPS[i].id}:${f ? 'ok' : 'empty'}`).join(' '),
    values: { ...BLANK, ...(filled[0] ? SPIRIT_OK : {}), ...(filled[1] ? WHEN_OK : {}), ...(filled[2] ? DETAILS_OK : {}) },
    filled,
  })
}

function renderAt(route: string, values: BookingValues) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <MotionProvider>
        <AnnouncerProvider>
          <SeededProvider values={values}>
            <Routes>
              {STEPS.map((s) => (
                <Route key={s.id} path={s.path} element={<BookingPage key={s.id} step={s.id} />} />
              ))}
            </Routes>
            <LocationProbe />
            <NavType />
          </SeededProvider>
        </AnnouncerProvider>
      </MotionProvider>
    </MemoryRouter>,
  )
}

describe('step guard', () => {
  for (const partial of PARTIALS) {
    for (const [index, step] of STEPS.entries()) {
      const blocking = partial.filled.findIndex((f) => !f)
      const expected = blocking !== -1 && blocking < index ? STEPS[blocking].path : step.path
      it(`${step.path} with [${partial.label}] ${expected === step.path ? 'stays' : `redirects to ${expected}`}`, () => {
        renderAt(step.path, partial.values)
        expect(screen.getByTestId('location')).toHaveTextContent(expected)
        if (expected !== step.path) expect(screen.getByTestId('nav-type')).toHaveTextContent('REPLACE')
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(STEPS.find((s) => s.path === expected)!.name)
      })
    }
  }

  it('step 1 is never guarded', () => {
    renderAt('/book/spirit', BLANK)
    expect(screen.getByTestId('location')).toHaveTextContent('/book/spirit')
  })

  it('uses the real provider type too (BookingProvider is exported)', () => {
    expect(BookingProvider).toBeTypeOf('function')
  })
})