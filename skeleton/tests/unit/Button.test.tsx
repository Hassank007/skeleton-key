import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { Button } from '../../src/components/Button'

describe('Button', () => {
  it('renders a native button element', () => {
    const { getByRole } = render(<Button>Click me</Button>)
    expect(getByRole('button')).toBeDefined()
  })

  it('primary variant has zero axe violations', async () => {
    const { container } = render(<Button variant="primary">Save</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('secondary variant has zero axe violations', async () => {
    const { container } = render(<Button variant="secondary">Cancel</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('ghost variant has zero axe violations', async () => {
    const { container } = render(<Button variant="ghost">More</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('disabled button has zero axe violations', async () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('Button type', () => {
  it('defaults to type="button"', () => {
    const { getByRole } = render(<Button>Plain</Button>)
    expect(getByRole('button').getAttribute('type')).toBe('button')
  })

  it('lets an explicit type="submit" win', () => {
    const { getByRole } = render(<Button type="submit">Send</Button>)
    expect(getByRole('button').getAttribute('type')).toBe('submit')
  })

  it('does not submit a form when it has no explicit type', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    const { getByRole } = render(
      <form onSubmit={onSubmit}>
        <Button>Plain</Button>
      </form>,
    )
    fireEvent.click(getByRole('button'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a form when type="submit"', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    const { getByRole } = render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Send</Button>
      </form>,
    )
    fireEvent.click(getByRole('button'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})