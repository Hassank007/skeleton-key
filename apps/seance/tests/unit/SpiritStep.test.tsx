import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { axe } from 'vitest-axe'
import { SpiritStep } from '../../src/components/SpiritStep'
import { SPIRITS } from '../../src/data/spirits'
import { EMPTY_VALUES } from './support/booking-fixtures'
import type { FieldErrors } from '../../src/lib/validate'

function Harness({ errors = {} as FieldErrors, initial = '' }) {
  const [spirit, setSpirit] = useState(initial)
  return <SpiritStep values={{ ...EMPTY_VALUES, spirit }} errors={errors} onChange={(_, v) => setSpirit(v)} onBlur={() => {}} />
}

const ERROR = { spirit: 'Choose a spirit to continue.' }

describe('SpiritStep', () => {
  it('is a fieldset with a legend and four native radios, each with a label and a described-by blurb [SC 1.3.1, 3.3.2]', () => {
    const { container } = render(<Harness />)
    const group = screen.getByRole('radiogroup', { name: 'Which spirit would you like to meet?' })
    expect(group.tagName).toBe('FIELDSET')
    expect(group.querySelector('legend')).not.toBeNull()
    const radios = within(group).getAllByRole('radio')
    expect(radios).toHaveLength(4)
    for (const [i, radio] of radios.entries()) {
      expect(radio.tagName).toBe('INPUT')
      expect(radio.getAttribute('type')).toBe('radio')
      expect(radio.getAttribute('name')).toBe('spirit')
      expect(radio).toHaveAccessibleName(SPIRITS[i].name)
      const blurb = container.querySelector(`#${radio.getAttribute('aria-describedby')}`)
      expect(blurb?.textContent).toContain(SPIRITS[i].blurb)
      expect(radio).toHaveAccessibleDescription(expect.stringContaining(SPIRITS[i].blurb))
    }
  })

  it('selects nothing on first render [REQ-4.4]', () => {
    render(<Harness />)
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked()
  })

  it('selects the spirit that the booking already holds', () => {
    render(<Harness initial={SPIRITS[2].id} />)
    expect(screen.getByRole('radio', { name: SPIRITS[2].name })).toBeChecked()
  })

  it('the first radio has the id the error summary links to', () => {
    render(<Harness />)
    expect(screen.getAllByRole('radio')[0].id).toBe('field-spirit')
  })

  it('arrow keys move and select with the native behaviour [SC 2.1.1]', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.tab()
    expect(screen.getAllByRole('radio')[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('radio')[1]).toBeChecked()
    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('radio')[2]).toBeChecked()
    await user.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('radio')[1]).toBeChecked()
  })

  it('clicking the label selects the radio [SC 2.5.8]', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByText(SPIRITS[3].name))
    expect(screen.getByRole('radio', { name: SPIRITS[3].name })).toBeChecked()
  })

  it('calls onBlur with the field when focus leaves a radio', async () => {
    const onBlur = vi.fn()
    render(<SpiritStep values={EMPTY_VALUES} errors={{}} onChange={() => {}} onBlur={onBlur} />)
    await userEvent.tab()
    await userEvent.tab()
    expect(onBlur).toHaveBeenCalledWith('spirit')
  })

  it('in the error state the group has aria-invalid and aria-describedby that resolves to the error text [SC 3.3.1, 4.1.2]', () => {
    render(<Harness errors={ERROR} />)
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    const errorId = group.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    const error = document.getElementById(errorId!)
    expect(error).toHaveTextContent('Error: Choose a spirit to continue.')
  })

  it('without an error the group has no aria-invalid and no aria-describedby', () => {
    render(<Harness />)
    const group = screen.getByRole('radiogroup')
    expect(group).not.toHaveAttribute('aria-invalid')
    expect(group).not.toHaveAttribute('aria-describedby')
  })

  it('has zero axe violations when clean', async () => {
    const { container } = render(<Harness />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations in the error state', async () => {
    const { container } = render(<Harness errors={ERROR} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations with a spirit selected', async () => {
    const { container } = render(<Harness initial={SPIRITS[0].id} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})