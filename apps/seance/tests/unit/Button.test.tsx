import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
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
