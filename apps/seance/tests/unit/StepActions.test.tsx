import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { StepActions } from '../../src/components/StepActions'

describe('StepActions', () => {
  it('step 1 has only "Next", as a submit button', () => {
    render(<StepActions index={0} submitting={false} onBack={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('type', 'submit')
  })

  it('step 2 has "Back" (a plain button) and "Next"', () => {
    render(<StepActions index={1} submitting={false} onBack={() => {}} />)
    expect(screen.getByRole('button', { name: 'Back' })).toHaveAttribute('type', 'button')
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('type', 'submit')
  })

  it('step 3 has "Back" and "Review and book"', () => {
    render(<StepActions index={2} submitting={false} onBack={() => {}} />)
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review and book' })).toHaveAttribute('type', 'submit')
  })

  it('"Back" calls the handler', async () => {
    const onBack = vi.fn()
    render(<StepActions index={1} submitting={false} onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('while submitting the submit uses aria-disabled and not disabled, so it keeps focus [SC 2.4.3]', () => {
    render(<StepActions index={2} submitting onBack={() => {}} />)
    const button = screen.getByRole('button', { name: 'Review and book' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()
  })

  it('has zero axe violations', async () => {
    const { container } = render(<StepActions index={2} submitting={false} onBack={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})