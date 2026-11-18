import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { EmptyState } from '../../src/components/EmptyState'

describe('EmptyState', () => {
  it('has zero axe violations [SC 1.3.1]', async () => {
    const { container } = render(<EmptyState onClear={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('says what happened and how to fix it [SC 3.3.3]', () => {
    render(<EmptyState onClear={() => {}} />)
    expect(screen.getByText('No spellbooks found.')).toBeDefined()
    expect(screen.getByText('Try a shorter search or clear some filters.')).toBeDefined()
  })

  it('is not an alert and not a live region [SC 4.1.3]', () => {
    const { container } = render(<EmptyState onClear={() => {}} />)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(container.querySelector('[aria-live], [role="status"]')).toBeNull()
  })

  it('has a clear button that calls back', async () => {
    const onClear = vi.fn()
    render(<EmptyState onClear={onClear} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Clear search and filters' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('keeps its illustration decorative [SC 1.1.1]', () => {
    const { container } = render(<EmptyState onClear={() => {}} />)
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
})
