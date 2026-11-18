import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { ErrorSummary } from '../../src/components/ErrorSummary'

const items = [
  { field: 'spirit' as const, message: 'Choose a spirit to continue.' },
  { field: 'date' as const, message: 'Enter a date.' },
]

describe('ErrorSummary', () => {
  it('is focusable by script only and named by its heading [SC 1.3.1]', () => {
    const { container } = render(<ErrorSummary items={items} onActivate={() => {}} />)
    const summary = container.firstElementChild as HTMLElement
    expect(summary.getAttribute('tabindex')).toBe('-1')
    const heading = screen.getByRole('heading', { level: 2, name: 'There is a problem' })
    expect(summary.getAttribute('aria-labelledby')).toBe(heading.id)
    expect(summary.getAttribute('role')).toBe('group')
  })

  it('renders one link per item with href="#field-..." [SC 3.3.1]', () => {
    render(<ErrorSummary items={items} onActivate={() => {}} />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['#field-spirit', '#field-date'])
    expect(links.map((l) => l.textContent)).toEqual(['Choose a spirit to continue.', 'Enter a date.'])
  })

  it('renders an item without a field as text, not a link', () => {
    render(<ErrorSummary items={[{ message: 'We could not book your séance.' }]} onActivate={() => {}} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('We could not book your séance.')).toBeInTheDocument()
  })

  it('calls the handler on activation without changing the location [SC 2.4.3]', async () => {
    const onActivate = vi.fn()
    const before = window.location.href
    render(<ErrorSummary items={items} onActivate={onActivate} />)
    await userEvent.click(screen.getByRole('link', { name: 'Enter a date.' }))
    expect(onActivate).toHaveBeenCalledWith('date')
    expect(window.location.href).toBe(before)
  })

  it('activates with the keyboard (Enter)', async () => {
    const onActivate = vi.fn()
    render(<ErrorSummary items={items} onActivate={onActivate} />)
    screen.getByRole('link', { name: 'Choose a spirit to continue.' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(onActivate).toHaveBeenCalledWith('spirit')
  })

  it('has zero axe violations', async () => {
    const { container } = render(<ErrorSummary items={items} onActivate={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations with a text-only failure item', async () => {
    const { container } = render(<ErrorSummary items={[{ message: 'We could not book your séance.' }]} onActivate={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})