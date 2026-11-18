/** Behaviour of the booking flow through the real app, providers and announcer (REQ-2, 3, 7, 8, 9, 11, 15). */
import { describe, expect, it } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { SPIRITS } from '../../src/data/spirits'
import {
  flushAnnouncer,
  instantService,
  liveText,
  LocationProbe,
  renderRoutes,
  VALID_VALUES,
} from './support/booking-fixtures'

type User = ReturnType<typeof userEvent.setup>

const never = () => new Promise<void>(() => {})
const failing = () => Promise.reject(new Error('down'))

async function heading(name: string) {
  return screen.findByRole('heading', { level: 1, name })
}

async function pickSpirit(user: User) {
  await user.click(screen.getByRole('radio', { name: SPIRITS[0].name }))
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await heading('Pick a date and time')
}

async function fillWhen(user: User) {
  await user.type(screen.getByLabelText(/^Date/), VALID_VALUES.date)
  await user.type(screen.getByLabelText(/^Time/), VALID_VALUES.time)
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await heading('Your details')
}

async function fillDetails(user: User) {
  await user.type(screen.getByLabelText(/^Full name/), VALID_VALUES.name)
  await user.type(screen.getByLabelText(/^Email address/), VALID_VALUES.email)
  await user.type(screen.getByLabelText(/^Phone number/), VALID_VALUES.phone)
}

async function toStep3(user: User) {
  await pickSpirit(user)
  await fillWhen(user)
}

async function toDialog(user: User) {
  await toStep3(user)
  await fillDetails(user)
  await user.click(screen.getByRole('button', { name: 'Review and book' }))
  await screen.findByRole('dialog', { name: 'Confirm your séance' })
}

describe('Submit by pointer press from a focused field', () => {
  it('a pointerdown on Next does not touch the blurred field, and the submit still shows the summary [SC 3.3.1]', () => {
    renderRoutes('/book/spirit')
    const radio = screen.getAllByRole('radio')[0]
    const next = screen.getByRole('button', { name: 'Next' })
    radio.focus()
    fireEvent.pointerDown(next)
    fireEvent.blur(radio)
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-invalid', 'true')
    fireEvent.pointerUp(next)
    fireEvent.click(next)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('link', { name: 'Choose a spirit to continue.' })).toBeInTheDocument()
  })

  it('leaving a field without a pointer press on submit still shows its error', () => {
    renderRoutes('/book/spirit')
    const radio = screen.getAllByRole('radio')[0]
    radio.focus()
    fireEvent.blur(radio)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('BookingPage titles and headings', () => {
  const cases = [
    ['/book/spirit', 'Step 1 of 3: Choose a spirit — Seance', 'Choose a spirit'],
  ] as const

  for (const [route, title, h1] of cases) {
    it(`${route} has the title "${title}" and one h1 "${h1}" [SC 2.4.2]`, () => {
      renderRoutes(route)
      expect(document.title).toBe(title)
      const h1s = screen.getAllByRole('heading', { level: 1 })
      expect(h1s).toHaveLength(1)
      expect(h1s[0]).toHaveTextContent(h1)
      expect(h1s[0]).toHaveAttribute('tabindex', '-1')
    })
  }

  it('steps 2 and 3 have their titles and exactly one h1 each', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await pickSpirit(user)
    expect(document.title).toBe('Step 2 of 3: Pick a date and time — Seance')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    await fillWhen(user)
    expect(document.title).toBe('Step 3 of 3: Your details — Seance')
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
  })

  it('a route change moves focus to the new h1 and announces the title politely [SC 2.4.3, 4.1.3]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await pickSpirit(user)
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus())
    await flushAnnouncer()
    expect(liveText('polite')).toBe('Step 2 of 3: Pick a date and time — Seance')
  })
})

describe('Back keeps values', () => {
  it('shows the date, time and spirit again after going back [REQ-3.4, SC 3.3.7]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await toStep3(user)
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await heading('Pick a date and time')
    expect(screen.getByLabelText(/^Date/)).toHaveValue(VALID_VALUES.date)
    expect(screen.getByLabelText(/^Time/)).toHaveValue(VALID_VALUES.time)
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await heading('Choose a spirit')
    expect(screen.getByRole('radio', { name: SPIRITS[0].name })).toBeChecked()
  })
})

describe('failed submit and the error summary', () => {
  it('stays on the step, shows the summary, moves focus to it and announces the count assertively [SC 3.3.1, 4.1.3]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    const summary = screen.getByRole('heading', { level: 2, name: 'There is a problem' }).parentElement!
    expect(summary).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Choose a spirit')
    expect(within(summary).getByRole('link', { name: 'Choose a spirit to continue.' })).toHaveAttribute('href', '#field-spirit')
    await flushAnnouncer()
    expect(liveText('assertive')).toBe('1 problem found. Fix it to continue.')
  })

  it('lists two errors in DOM order on step 2 and announces "2 problems"', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await pickSpirit(user)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    const links = within(screen.getByRole('heading', { name: 'There is a problem' }).parentElement!).getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['Enter a date.', 'Enter a time.'])
    await flushAnnouncer()
    expect(liveText('assertive')).toBe('2 problems found. Fix them to continue.')
  })

  it('a summary link moves focus to the field and does not change the location [SC 2.4.3]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit', { extra: <LocationProbe /> })
    await pickSpirit(user)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('link', { name: 'Enter a time.' }))
    expect(screen.getByLabelText(/^Time/)).toHaveFocus()
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/book\/time$/)
  })

  it('the first-radio link focuses the first radio', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('link', { name: 'Choose a spirit to continue.' }))
    expect(screen.getAllByRole('radio')[0]).toHaveFocus()
  })

  it('marks every field of the step touched, so each shows its error with a linked description [SC 3.3.1]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await pickSpirit(user)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    for (const [label, text] of [[/^Date/, 'Error: Enter a date.'], [/^Time/, 'Error: Enter a time.']] as const) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      const ids = input.getAttribute('aria-describedby')!.split(' ')
      expect(document.getElementById(ids[ids.length - 1])).toHaveTextContent(text)
    }
  })

  it('removing the summary while focus is inside it moves focus to the first field [REQ-8.6]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'There is a problem' }).parentElement).toHaveFocus()
    // A change that does not move focus, such as browser autofill.
    fireEvent.click(screen.getAllByRole('radio')[1])
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'There is a problem' })).toBeNull())
    expect(screen.getAllByRole('radio')[0]).toHaveFocus()
  })

  it('a second failed submit moves focus to the summary again [REQ-8.3]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('link', { name: 'Choose a spirit to continue.' }))
    expect(screen.getAllByRole('radio')[0]).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'There is a problem' }).parentElement).toHaveFocus()
  })
})

describe('per-field validation', () => {
  it('shows no error on a field the user has not touched [SC 3.3.1]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await toStep3(user)
    await user.click(screen.getByLabelText(/^Full name/))
    await user.tab() // name is left empty and touched; email is only focused
    expect(screen.getByLabelText(/^Full name/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/^Email address/)).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(/^Phone number/)).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('Error: Enter your email address.')).toBeNull()
  })

  it('shows the error on blur, with aria-describedby resolving to the error text, and clears it on a valid change [SC 3.3.1, 3.3.3]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await toStep3(user)
    const email = screen.getByLabelText(/^Email address/)
    await user.type(email, 'not-an-email')
    await user.tab()
    expect(email).toHaveAttribute('aria-invalid', 'true')
    const ids = email.getAttribute('aria-describedby')!.split(' ')
    expect(document.getElementById(ids[ids.length - 1])).toHaveTextContent(
      'Error: Enter an email address in the form name@example.com.',
    )
    await user.click(email)
    await user.clear(email)
    await user.type(email, 'ada@example.com')
    expect(email).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText(/Enter an email address in the form/)).toBeNull()
  })

  it('a phone with letters gets the "digits" message after blur', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await toStep3(user)
    await user.type(screen.getByLabelText(/^Phone number/), '555-CALL')
    await user.tab()
    expect(screen.getByText('Use only digits, spaces, plus, hyphens, dots and brackets.')).toBeInTheDocument()
  })
})

describe('confirmation dialog', () => {
  it('opens only when step 3 is valid [REQ-6.6, 11.1]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await toStep3(user)
    await user.click(screen.getByRole('button', { name: 'Review and book' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { name: 'There is a problem' })).toBeInTheDocument()
    await fillDetails(user)
    await user.click(screen.getByRole('button', { name: 'Review and book' }))
    expect(await screen.findByRole('dialog', { name: 'Confirm your séance' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'There is a problem' })).toBeNull()
  })

  it('Escape closes it and focus returns to "Review and book" [SC 2.4.3]', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await toDialog(user)
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)))
    })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('button', { name: 'Review and book' })).toHaveFocus()
    expect(screen.getByLabelText(/^Full name/)).toHaveValue(VALID_VALUES.name)
  })

  it('"Go back and edit" closes it and keeps the booking', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await toDialog(user)
    await user.click(screen.getByRole('button', { name: 'Go back and edit' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByLabelText(/^Email address/)).toHaveValue(VALID_VALUES.email)
  })
})

describe('axe: every step and state has zero violations [REQ-15.1]', () => {
  it('step 1 clean, and with the summary', async () => {
    const user = userEvent.setup()
    const { container } = renderRoutes('/book/spirit')
    expect(await axe(container)).toHaveNoViolations()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'There is a problem' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('step 2 clean, and with the summary', async () => {
    const user = userEvent.setup()
    const { container } = renderRoutes('/book/spirit')
    await pickSpirit(user)
    expect(await axe(container)).toHaveNoViolations()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'There is a problem' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('step 3 clean, and with the summary', async () => {
    const user = userEvent.setup()
    const { container } = renderRoutes('/book/spirit')
    await toStep3(user)
    expect(await axe(container)).toHaveNoViolations()
    await user.click(screen.getByRole('button', { name: 'Review and book' }))
    expect(screen.getByRole('heading', { name: 'There is a problem' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('the confirmation dialog open', async () => {
    const user = userEvent.setup()
    renderRoutes('/book/spirit')
    await toDialog(user)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('submitting', async () => {
    const user = userEvent.setup()
    const { container } = renderRoutes('/book/spirit', { service: never })
    await toDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Review and book' })).toHaveAttribute('aria-disabled', 'true'))
    expect(container.querySelector('form')).toHaveAttribute('aria-busy', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('failed', async () => {
    const user = userEvent.setup()
    const { container } = renderRoutes('/book/spirit', { service: failing })
    await toDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    const summary = (await screen.findByRole('heading', { name: 'There is a problem' })).parentElement!
    expect(summary).toHaveTextContent('We could not book your séance. Your answers are kept. Press Review and book to try again.')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('success', async () => {
    const user = userEvent.setup()
    const { container } = renderRoutes('/book/spirit', { service: instantService })
    await toDialog(user)
    await user.click(screen.getByRole('button', { name: 'Book my séance' }))
    await heading('Your séance is booked')
    expect(document.title).toBe('Séance booked — Seance')
    expect(await axe(container)).toHaveNoViolations()
  })
})
