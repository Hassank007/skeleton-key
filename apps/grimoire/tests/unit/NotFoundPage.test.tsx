import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { NotFoundPage } from '../../src/pages/NotFoundPage'

describe('NotFoundPage', () => {
  it('has an h1, a title and zero axe violations [SC 2.4.2]', async () => {
    const { container } = render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeDefined()
    expect(document.title).toBe('Page not found — Grimoire')
    expect(await axe(container)).toHaveNoViolations()
  })
})
