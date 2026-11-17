import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { HomePage } from '../../src/pages/HomePage'

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('renders with zero axe violations', async () => {
    const { container } = renderHomePage()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('renders an h1', () => {
    renderHomePage()
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
  })

  it('decorative ghost SVG has aria-hidden="true" and is not in the accessibility tree', () => {
    const { container } = renderHomePage()
    // All SVG elements on the page must be aria-hidden (they are decorative)
    const svgs = container.querySelectorAll('svg')
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true')
    })
  })

  it('decorative SVG carries no meaningful alt text or title', () => {
    const { container } = renderHomePage()
    const titles = container.querySelectorAll('svg title')
    expect(titles.length).toBe(0)
  })
})
