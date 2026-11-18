/** Submission, status messages and success (REQ-12, 17.5) with an injected service. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SPIRITS } from '../../src/data/spirits'
import { submitBooking, SERVICE_DELAY_MS } from '../../src/lib/bookingService'
import { flushAnnouncer, liveText, renderRoutes, VALID_VALUES } from './support/booking-fixtures'
import type { BookingValues } from '../../src/lib/steps'

type User = ReturnType<typeof userEvent.setup>

async function bookThroughDialog(user: User) {
  await user.click(screen.getByRole('radio', { name: SPIRITS[0].name }))
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.type(await screen.findByLabelText(/^Date/), VALID_VALUES.date)
  await user.type(screen.getByLabelText(/^Time/), VALID_VALUES.time)
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.type(await screen.findByLabelText(/^Full name/), VALID_VALUES.name)
  await user.type(screen.getByLabelText(/^Email address/), VALID_VALUES.email)
  await user.type(screen.getByLabelText(/^Phone number/), VALID_VALUES.phone)
  await user.click(screen.getByRole('button', { name: 'Review and book' }))
  await screen.findByRole('dialog', { name: 'Confirm your séance' })
}

/** Records every non-empty text the shared polite region receives, so "announced once" can be counted. */
function recordPolite(): string[] {
  const seen: string[] = []
  const region = document.querySelector('[aria-live="polite"]')!
  new MutationObserver(() => {
    const text = region.textContent ?? ''
    if (text) seen.push(text)
  }).observe(region, { childList: true, characterData: true, subtree: true })
  return seen
}

/** A service the test resolves or rejects by hand. */
function deferred() {
  let resolve!: () => void
  let reject!: (e: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  const service = vi.fn((booking: BookingValues) => {
    void booking
    return promise
  })
  return { service, resolve, reject }
}

afterEach(() => vi.restoreAllMocks())

describe('booking service stub', () => {
  it('resolves after 700 ms and sends nothing', async () => {
    vi.useFakeTimers()
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    let done = false
    void submitBooking(VALID_VALUES).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(SERVICE_DELAY_MS - 1)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(done).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
})

describe('submission through the page', () => {
  it('announces "Booking your séance…" once and politely, and sets aria-busy and aria-disabled while submitting [SC 4.1.3, 2.4.3]', async () => {
    const user = userEvent.setup()
    const d = deferred()
    const { container } = renderRoutes('/book/spirit', { service: d.service })
    const seen = recordPolite()
    await bookThroughDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    await waitFor(() => expect(d.service).toHaveBeenCalledTimes(1))
    await flushAnnouncer()
    expect(liveText('polite')).toBe('Booking your séance…')
    expect(seen.filter((t) => t === 'Booking your séance…')).toHaveLength(1)
    expect(liveText('assertive')).toBe('')
    expect(container.querySelector('form')).toHaveAttribute('aria-busy', 'true')
    const button = screen.getByRole('button', { name: 'Review and book' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()
    // The dialog was closed first, so the live region was reachable (REQ-11.6).
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.getElementById('root')?.hasAttribute('inert') ?? false).toBe(false)
    // Activating the disabled button does not start a second submission.
    await user.click(button)
    expect(d.service).toHaveBeenCalledTimes(1)
  })

  it('on success: the h1 and title change, focus moves to the h1, and the success message is polite [SC 2.4.2, 2.4.3, 4.1.3]', async () => {
    const user = userEvent.setup()
    const d = deferred()
    renderRoutes('/book/spirit', { service: d.service })
    await bookThroughDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    await waitFor(() => expect(d.service).toHaveBeenCalled())
    expect(d.service).toHaveBeenCalledWith(expect.objectContaining({ name: VALID_VALUES.name, spirit: SPIRITS[0].id }))
    await act(async () => d.resolve())
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Your séance is booked' })
    await waitFor(() => expect(h1).toHaveFocus())
    expect(document.title).toBe('Séance booked — Seance')
    await flushAnnouncer()
    expect(liveText('polite')).toBe(
      'Séance booked with Mara the Weeping Widow on Wednesday, November 13, 2030 at 8:30 PM.',
    )
    expect(liveText('assertive')).toBe('')
    expect(screen.getByText('Mara the Weeping Widow will meet you on Wednesday, November 13, 2030 at 8:30 PM.')).toBeInTheDocument()
    expect(screen.getByText('This is a demo. Nothing was stored or sent.')).toBeInTheDocument()
    // The success view has no live region of its own.
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(2)
    expect(document.querySelector('[role="status"], [role="alert"]')).toBeNull()
  })

  it('on failure: answers are kept, the summary has one non-link item and focus, and the message is assertive [SC 3.3.1, 4.1.3]', async () => {
    const user = userEvent.setup()
    const d = deferred()
    renderRoutes('/book/spirit', { service: d.service })
    await bookThroughDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    await waitFor(() => expect(d.service).toHaveBeenCalled())
    await act(async () => d.reject(new Error('down')))
    const text = 'We could not book your séance. Your answers are kept. Press Review and book to try again.'
    const summary = (await screen.findByRole('heading', { name: 'There is a problem' })).parentElement!
    expect(summary).toHaveTextContent(text)
    expect(summary.querySelector('a')).toBeNull()
    await waitFor(() => expect(summary).toHaveFocus())
    await flushAnnouncer()
    expect(liveText('assertive')).toBe(text)
    expect(screen.getByLabelText(/^Full name/)).toHaveValue(VALID_VALUES.name)
    expect(screen.getByLabelText(/^Email address/)).toHaveValue(VALID_VALUES.email)
    expect(screen.getByLabelText(/^Phone number/)).toHaveValue(VALID_VALUES.phone)
    expect(screen.getByRole('button', { name: 'Review and book' })).not.toHaveAttribute('aria-disabled')
  })

  it('a new submission after a failure removes the failure summary [REQ-12.6]', async () => {
    const user = userEvent.setup()
    const service = vi.fn().mockRejectedValueOnce(new Error('down')).mockReturnValueOnce(new Promise(() => {}))
    renderRoutes('/book/spirit', { service })
    await bookThroughDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    await screen.findByRole('heading', { name: 'There is a problem' })
    await user.click(screen.getByRole('button', { name: 'Review and book' }))
    await user.click(await screen.findByRole('button', { name: 'Book my séance' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'There is a problem' })).toBeNull())
    expect(service).toHaveBeenCalledTimes(2)
  })

  it('a result that arrives after the page has gone is ignored', async () => {
    const user = userEvent.setup()
    const d = deferred()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = renderRoutes('/book/spirit', { service: d.service })
    await bookThroughDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    await waitFor(() => expect(d.service).toHaveBeenCalled())
    unmount()
    await act(async () => d.resolve())
    expect(errors).not.toHaveBeenCalled()
  })

  it('"Book another séance" clears every answer and returns to step 1 [REQ-3.5]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await bookThroughDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    await user.click(await screen.findByRole('button', { name: 'Book another séance' }))
    await screen.findByRole('heading', { level: 1, name: 'Choose a spirit' })
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked()
    expect(document.title).toBe('Step 1 of 3: Choose a spirit — Seance')
    // Step 3 is guarded again: nothing was kept.
    await user.click(screen.getByRole('radio', { name: SPIRITS[1].name }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByLabelText(/^Date/)).toHaveValue('')
    expect(screen.getByLabelText(/^Time/)).toHaveValue('')
  })
})