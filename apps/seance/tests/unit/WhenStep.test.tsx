import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { axe } from 'vitest-axe'
import { WhenStep } from '../../src/components/WhenStep'
import { EMPTY_VALUES, TODAY } from './support/booking-fixtures'
import type { FieldErrors } from '../../src/lib/validate'

function Harness({ errors = {} as FieldErrors }) {
  const [values, setValues] = useState(EMPTY_VALUES)
  return (
    <WhenStep
      values={values}
      errors={errors}
      today={TODAY}
      onChange={(field, value) => setValues((v) => ({ ...v, [field]: value }))}
      onBlur={() => {}}
    />
  )
}

const ERRORS = { date: 'Enter a date.', time: 'Enter a time.' }

describe('WhenStep', () => {
  it('has a native date input with min and max from today [SC 1.3.1, 2.1.1]', () => {
    render(<Harness />)
    const date = screen.getByLabelText(/^Date/)
    expect(date).toHaveAttribute('type', 'date')
    expect(date).toHaveAttribute('min', '2030-10-31')
    expect(date).toHaveAttribute('max', '2031-01-28')
    expect(date).toBeRequired()
  })

  it('has a native time input with min, max and step', () => {
    render(<Harness />)
    const time = screen.getByLabelText(/^Time/)
    expect(time).toHaveAttribute('type', 'time')
    expect(time).toHaveAttribute('min', '18:00')
    expect(time).toHaveAttribute('max', '23:30')
    expect(time).toHaveAttribute('step', '1800')
    expect(time).toBeRequired()
  })

  it('shows "(required)" in each label [SC 3.3.2]', () => {
    render(<Harness />)
    expect(screen.getByText('Date', { exact: false, selector: 'label' })).toHaveTextContent('Date (required)')
    expect(screen.getByText('Time', { exact: false, selector: 'label' })).toHaveTextContent('Time (required)')
  })

  it('links hints with aria-describedby: the date hint names the window, the time hint names the hours [SC 3.3.2]', () => {
    render(<Harness />)
    expect(screen.getByLabelText(/^Date/)).toHaveAccessibleDescription(
      expect.stringContaining('Thursday, October 31, 2030 to Tuesday, January 28, 2031'),
    )
    expect(screen.getByLabelText(/^Time/)).toHaveAccessibleDescription(
      'Visiting hours are 6:00 PM to 11:30 PM, every 30 minutes.',
    )
  })

  it('has no autocomplete attribute and no custom picker (SC 1.3.5 does not apply)', () => {
    const { container } = render(<Harness />)
    for (const input of container.querySelectorAll('input')) expect(input).not.toHaveAttribute('autocomplete')
    expect(container.querySelectorAll('input')).toHaveLength(2)
    expect(container.querySelector('[role="grid"], [role="dialog"], [role="listbox"]')).toBeNull()
  })

  it('accepts typed values', async () => {
    render(<Harness />)
    const date = screen.getByLabelText(/^Date/) as HTMLInputElement
    await userEvent.type(date, '2030-11-13')
    expect(date.value).toBe('2030-11-13')
  })

  it('error state: aria-invalid and aria-describedby resolve to the error text [SC 3.3.1]', () => {
    render(<Harness errors={ERRORS} />)
    for (const [label, text] of [[/^Date/, 'Error: Enter a date.'], [/^Time/, 'Error: Enter a time.']] as const) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      const ids = input.getAttribute('aria-describedby')!.split(' ')
      expect(document.getElementById(ids[ids.length - 1])).toHaveTextContent(text)
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