import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { AppLink } from '../../src/components/AppLink'

describe('AppLink', () => {
  it('internal link renders an <a> element with zero axe violations', async () => {
    const { container, getByRole } = render(
      <MemoryRouter>
        <AppLink href="/about">About</AppLink>
      </MemoryRouter>,
    )
    expect(getByRole('link', { name: 'About' })).toBeDefined()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('external link renders an <a> with target=_blank and zero axe violations', async () => {
    const { container, getByRole } = render(
      <MemoryRouter>
        <AppLink href="https://example.com">Visit Example</AppLink>
      </MemoryRouter>,
    )
    const link = getByRole('link', { name: /Visit Example/i })
    expect(link).toBeDefined()
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('external link contains visually-hidden "opens in new tab" text', () => {
    const { getByText } = render(
      <MemoryRouter>
        <AppLink href="https://example.com">Visit Example</AppLink>
      </MemoryRouter>,
    )
    // The span is in the DOM even though visually hidden
    expect(getByText(/opens in new tab/i)).toBeDefined()
  })
})
