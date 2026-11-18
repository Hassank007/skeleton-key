import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { AboutPage } from '../../src/pages/AboutPage'

describe('AboutPage', () => {
  it('has zero axe violations [SC 1.3.1]', async () => {
    const { container } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has one h1, a Grimoire title and no Skeleton Key text [SC 2.4.2]', () => {
    const { container } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    )
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).getAttribute('tabindex')).toBe('-1')
    expect(document.title).toBe('About — Grimoire')
    expect(container.textContent).not.toContain('Skeleton Key is')
  })
})
