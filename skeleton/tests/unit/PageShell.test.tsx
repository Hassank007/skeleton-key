import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { PageShell } from '../../src/components/PageShell'

/** Minimal wrapper: PageShell needs a router context (AppLink inside uses Link). */
function renderShell() {
  return render(
    <MemoryRouter>
      <PageShell>
        <h1 tabIndex={-1}>Test page heading</h1>
        <p>Page content.</p>
      </PageShell>
    </MemoryRouter>,
  )
}

describe('PageShell', () => {
  it('renders with zero axe violations', async () => {
    const { container } = renderShell()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('renders exactly one <header> landmark', () => {
    renderShell()
    expect(screen.getByRole('banner')).toBeDefined()
  })

  it('renders exactly one <nav> landmark with an accessible label', () => {
    renderShell()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toBeDefined()
  })

  it('renders exactly one <main> landmark', () => {
    renderShell()
    expect(screen.getByRole('main')).toBeDefined()
  })

  it('renders exactly one <footer> landmark', () => {
    renderShell()
    expect(screen.getByRole('contentinfo')).toBeDefined()
  })

  it('the skip link is present and href targets #main-content', () => {
    renderShell()
    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink.getAttribute('href')).toBe('#main-content')
  })

  it('the skip link is the first focusable element in the DOM', () => {
    const { container } = renderShell()
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    expect(focusable[0].textContent?.toLowerCase()).toContain('skip to main content')
  })

  it('renders the children inside the <main> element', () => {
    renderShell()
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1 })).toBeDefined()
  })

  it('the main element has id="main-content" so the skip link target exists', () => {
    renderShell()
    const main = screen.getByRole('main')
    expect(main.id).toBe('main-content')
  })
})
