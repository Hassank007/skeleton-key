import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { axe } from 'vitest-axe'
import { DetailsStep } from '../../src/components/DetailsStep'
import { EMPTY_VALUES } from './support/booking-fixtures'
import type { FieldErrors } from '../../src/lib/validate'

function Harness({ errors = {} as FieldErrors }) {
  const [values, setValues] = useState(EMPTY_VALUES)
  return (
    <DetailsStep
      values={values}
      errors={errors}
      onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
      onBlur={() => {}}
    />
  )
}

const ERRORS = { name: 'Enter your full name.', email: 'Enter your email address.', phone: 'Enter your phone number.' }

describe('DetailsStep', () => {
  it('has exactly three inputs of type text, email and tel [SC 1.3.1]', () => {
    const { container } = render(<Harness />)
    const inputs = [...container.querySelectorAll('input')]
    expect(inputs.map((i) => i.type)).toEqual(['text', 'email', 'tel'])
  })

  it('labels each input and marks it required [SC 3.3.2]', () => {
    render(<Harness />)
    for (const [label, text] of [['Full name', 'Full name (required)'], ['Email address', 'Email address (required)'], ['Phone number', 'Phone number (required)']]) {
      const input = screen.getByLabelText(new RegExp(`^${label}`))
      expect(input).toBeRequired()
      expect(screen.getByText(label, { exact: false, selector: 'label' })).toHaveTextContent(text)
    }
  })

  it('uses the autocomplete tokens name, email and tel [SC 1.3.5]', () => {
    render(<Harness />)
    expect(screen.getByLabelText(/^Full name/)).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText(/^Email address/)).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText(/^Phone number/)).toHaveAttribute('autocomplete', 'tel')
  })

  it('sets inputMode, autoCapitalize and spellCheck for each input', () => {
    render(<Harness />)
    expect(screen.getByLabelText(/^Phone number/)).toHaveAttribute('inputmode', 'tel')
    expect(screen.getByLabelText(/^Email address/)).toHaveAttribute('spellcheck', 'false')
    expect(screen.getByLabelText(/^Email address/)).toHaveAttribute('autocapitalize', 'none')
    expect(screen.getByLabelText(/^Full name/)).toHaveAttribute('autocapitalize', 'words')
  })

  it('links a hint to each input; the phone hint names the allowed characters [SC 3.3.2]', () => {
    render(<Harness />)
    expect(screen.getByLabelText(/^Phone number/)).toHaveAccessibleDescription(
      'Digits, spaces, plus, hyphens and brackets. For example +44 20 7946 0000.',
    )
    expect(screen.getByLabelText(/^Email address/)).toHaveAccessibleDescription('For example name@example.com.')
  })

  it('does not block paste [SC 3.3.8]', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const name = screen.getByLabelText(/^Full name/) as HTMLInputElement
    await user.click(name)
    await user.paste('Ada Example')
    expect(name.value).toBe('Ada Example')
  })

  it('asks for no password and no confirmation field [SC 3.3.8]', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('input[type="password"]')).toBeNull()
    expect(screen.queryByLabelText(/confirm/i)).toBeNull()
  })

  it('error state: aria-invalid and aria-describedby resolve to the error text for every field [SC 3.3.1]', () => {
    render(<Harness errors={ERRORS} />)
    for (const [label, text] of [[/^Full name/, ERRORS.name], [/^Email address/, ERRORS.email], [/^Phone number/, ERRORS.phone]] as const) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      const ids = input.getAttribute('aria-describedby')!.split(' ')
      expect(document.getElementById(ids[ids.length - 1])).toHaveTextContent(`Error: ${text}`)
    }
  })

  it('has zero axe violations when clean', async () => {
    const { container } = render(<Harness />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations in the error state', async () => {
    const { container } = render(<Harness errors={ERRORS} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})