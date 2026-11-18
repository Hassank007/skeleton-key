import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { Field } from '../../src/components/Field'

describe('Field', () => {
  it('renders a label associated with the input', () => {
    const { getByLabelText } = render(
      <Field id="name" label="Full name">
        <input type="text" />
      </Field>,
    )
    expect(getByLabelText('Full name')).toBeDefined()
  })

  it('label-only: zero axe violations', async () => {
    const { container } = render(
      <Field id="email" label="Email address">
        <input type="email" />
      </Field>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('with hint: zero axe violations', async () => {
    const { container } = render(
      <Field id="username" label="Username" hint="Between 3 and 20 characters">
        <input type="text" />
      </Field>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('with error: zero axe violations', async () => {
    const { container } = render(
      <Field id="pass" label="Password" error="Must be at least 8 characters">
        <input type="password" />
      </Field>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('with both hint and error: zero axe violations', async () => {
    const { container } = render(
      <Field
        id="zip"
        label="ZIP code"
        hint="5-digit US ZIP code"
        error="ZIP code is required"
      >
        <input type="text" />
      </Field>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('with hint: input aria-describedby references the hint id', () => {
    const { getByLabelText } = render(
      <Field id="bio" label="Bio" hint="Tell us about yourself">
        <input type="text" />
      </Field>,
    )
    const input = getByLabelText('Bio')
    expect(input.getAttribute('aria-describedby')).toContain('bio-hint')
  })

  it('with error: input aria-describedby references the error id', () => {
    const { getByLabelText } = render(
      <Field id="city" label="City" error="City is required">
        <input type="text" />
      </Field>,
    )
    const input = getByLabelText('City')
    expect(input.getAttribute('aria-describedby')).toContain('city-error')
  })

  it('with both hint and error: aria-describedby contains both ids', () => {
    const { getByLabelText } = render(
      <Field id="phone" label="Phone" hint="Include country code" error="Invalid phone number">
        <input type="tel" />
      </Field>,
    )
    const input = getByLabelText('Phone')
    const describedBy = input.getAttribute('aria-describedby') ?? ''
    expect(describedBy).toContain('phone-hint')
    expect(describedBy).toContain('phone-error')
  })

  it('with error: aria-invalid is true on the input', () => {
    const { getByLabelText } = render(
      <Field id="dob" label="Date of birth" error="Invalid date">
        <input type="text" />
      </Field>,
    )
    const input = getByLabelText('Date of birth')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('without error: aria-invalid is not set on the input', () => {
    const { getByLabelText } = render(
      <Field id="age" label="Age">
        <input type="number" />
      </Field>,
    )
    const input = getByLabelText('Age')
    expect(input.getAttribute('aria-invalid')).toBeNull()
  })

  it('error message contains "Error:" prefix (not colour-only)', () => {
    const { getByText } = render(
      <Field id="card" label="Card number" error="Card number is invalid">
        <input type="text" />
      </Field>,
    )
    expect(getByText(/Error:/)).toBeDefined()
  })

  it('inline error span has NO role="alert" (flooding prevention)', () => {
    const { container } = render(
      <Field id="flood" label="Test field" error="Something is wrong">
        <input type="text" />
      </Field>,
    )
    // The error span must not carry role="alert" — multiple simultaneous alerts
    // on form submit would flood screen-reader users. aria-describedby + aria-invalid
    // are the correct pattern; submit-time announcement is an error summary's job.
    const alertEl = container.querySelector('[role="alert"]')
    expect(alertEl).toBeNull()
  })

  it('with error: aria-describedby on input includes the error id', () => {
    const { getByLabelText } = render(
      <Field id="inline-err" label="Inline error field" error="This is required">
        <input type="text" />
      </Field>,
    )
    const input = getByLabelText('Inline error field')
    expect(input.getAttribute('aria-describedby')).toContain('inline-err-error')
  })

  it('treats an empty or whitespace-only hint and error as absent (property-test counterexample)', () => {
    const { getByLabelText, container } = render(
      <Field id="a" label="Say hi" hint="" error="   ">
        <input type="text" />
      </Field>,
    )
    const input = getByLabelText('Say hi')
    expect(input.hasAttribute('aria-describedby')).toBe(false)
    expect(input.hasAttribute('aria-invalid')).toBe(false)
    expect(container.querySelector('#a-hint')).toBeNull()
    expect(container.querySelector('#a-error')).toBeNull()
  })

  it('required field includes "(required)" text in label', () => {
    const { getByText } = render(
      <Field id="terms" label="Agree to terms" required>
        <input type="checkbox" />
      </Field>,
    )
    expect(getByText(/\(required\)/)).toBeDefined()
  })
})
