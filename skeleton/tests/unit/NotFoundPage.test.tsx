import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { NotFoundPage } from '../../src/pages/NotFoundPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  it('has an h1, a title and zero axe violations [SC 2.4.2]', async () => {
    const { container } = renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeDefined()
    expect(document.title).toBe('Page not found - Skeleton Key')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('styles the way back with the AppLink token colours, not the browser default [SC 1.4.3]', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Go to the home page' }).className).toMatch(/link/i)
  })
})
