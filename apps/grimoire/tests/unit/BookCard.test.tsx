import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { BookCard } from '../../src/components/BookCard'
import { findBook } from '../../src/data/books'

const book = findBook('the-lantern-of-small-hours')!

function renderCard() {
  return render(
    <MemoryRouter>
      <ul>
        <BookCard book={book} search="?q=lantern" />
      </ul>
    </MemoryRouter>,
  )
}

describe('BookCard', () => {
  it('has zero axe violations [SC 1.3.1]', async () => {
    const { container } = renderCard()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has one h3 that contains the one link [SC 2.4.6]', () => {
    renderCard()
    const heading = screen.getByRole('heading', { level: 3 })
    expect(within(heading).getAllByRole('link')).toHaveLength(1)
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('names the link with the book title and points to /books/<slug> [SC 2.4.4]', () => {
    renderCard()
    const link = screen.getByRole('link', { name: book.title })
    expect(link.getAttribute('href')).toBe(`/books/${book.slug}`)
  })

  it('contains no other interactive element [SC 4.1.2]', () => {
    const { container } = renderCard()
    expect(container.querySelectorAll('button, input, select, textarea, a[href]')).toHaveLength(1)
  })

  it('shows school and hazard as text [SC 1.4.1]', () => {
    renderCard()
    expect(screen.getByText(new RegExp(`${book.school}.*${book.hazard}`))).toBeDefined()
  })

  it('shows author and summary as text outside the link', () => {
    renderCard()
    expect(screen.getByText(book.summary)).toBeDefined()
    expect(screen.getByText(new RegExp(book.author))).toBeDefined()
    expect(screen.getByRole('link').textContent).toBe(book.title)
  })

  it('hides the decorative cover from assistive technology [SC 1.1.1]', () => {
    const { container } = renderCard()
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
})
