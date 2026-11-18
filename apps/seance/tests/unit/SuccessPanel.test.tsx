import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { SuccessPanel } from '../../src/components/SuccessPanel'
import { VALID_VALUES } from './support/booking-fixtures'

describe('SuccessPanel', () => {
  it('says who, when and that this is a demo [SC 1.3.1]', () => {
    render(<SuccessPanel values={VALID_VALUES} onBookAnother={() => {}} />)
    expect(screen.getByText('Mara the Weeping Widow will meet you on Wednesday, November 13, 2030 at 8:30 PM.')).toBeInTheDocument()
    expect(screen.getByText('This is a demo. Nothing was stored or sent.')).toBeInTheDocument()
  })

  it('has a "Book another séance" button that calls the handler', async () => {
    const onBookAnother = vi.fn()
    render(<SuccessPanel values={VALID_VALUES} onBookAnother={onBookAnother} />)
    await userEvent.click(screen.getByRole('button', { name: 'Book another séance' }))
    expect(onBookAnother).toHaveBeenCalledTimes(1)
  })

  it('renders no live region of its own [SC 4.1.3]', () => {
    const { container } = render(<SuccessPanel values={VALID_VALUES} onBookAnother={() => {}} />)
    expect(container.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull()
  })

  it('has zero axe violations', async () => {
    const { container } = render(<SuccessPanel values={VALID_VALUES} onBookAnother={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})