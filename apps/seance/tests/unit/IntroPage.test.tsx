import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { IntroPage } from '../../src/pages/IntroPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <IntroPage />
    </MemoryRouter>,
  )
}

describe('IntroPage', () => {
  it('has the unique title [SC 2.4.2]', () => {
    renderPage()
    expect(document.title).toBe('Book a séance — Seance')
  })

  it('has exactly one h1 that can receive focus [SC 2.4.3, 1.3.1]', () => {
    renderPage()
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveAttribute('tabindex', '-1')
  })

  it('explains the three steps, the time it takes, and that nothing is stored or sent', () => {
    renderPage()
    expect(screen.getByText(/three short steps and takes about two minutes/)).toBeInTheDocument()
    expect(screen.getByText(/nothing you type is stored or sent/i)).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Choose a spirit',
      'Pick a date and time',
      'Your details',
    ])
  })

  it('offers one "Start booking" link to step 1', () => {
    renderPage()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Start booking' })).toHaveAttribute('href', '/book/spirit')
  })

  it('has zero axe violations', async () => {
    const { container } = renderPage()
    expect(await axe(container)).toHaveNoViolations()
  })
})