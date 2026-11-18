import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { BookDetailPage } from '../../src/pages/BookDetailPage'
import { findBook } from '../../src/data/books'

const book = findBook('the-lantern-of-small-hours')!

function renderDetail(slug: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/books/${slug}`, state }]}>
      <Routes>
        <Route path="/books/:slug" element={<BookDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BookDetailPage: found', () => {
  it('has zero axe violations [SC 1.3.1]', async () => {
    const { container } = renderDetail(book.slug)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has one h1 with the book title and sets the document title [SC 2.4.2]', () => {
    renderDetail(book.slug)
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0].textContent).toBe(book.title)
    expect(h1[0].getAttribute('tabindex')).toBe('-1')
    expect(document.title).toBe(`${book.title} — Grimoire`)
  })

  it('shows author, school, hazard, year and pages in a definition list [SC 1.3.1]', () => {
    const { container } = renderDetail(book.slug)
    const terms = [...container.querySelectorAll('dt')].map((t) => t.textContent)
    expect(terms).toEqual(['Author', 'School', 'Hazard', 'Year', 'Pages'])
    const values = [...container.querySelectorAll('dd')].map((d) => d.textContent)
    expect(values).toEqual([book.author, book.school, book.hazard, book.year, String(book.pages)])
  })

  it('shows the hazard as text and the tags as a list of text [SC 1.4.1]', () => {
    renderDetail(book.slug)
    expect(screen.getByText(book.hazard)).toBeDefined()
    const tags = within(screen.getByRole('list')).getAllByRole('listitem').map((li) => li.textContent)
    expect(tags).toEqual(book.tags)
  })

  it('shows every description paragraph', () => {
    renderDetail(book.slug)
    for (const p of book.description) expect(screen.getByText(p)).toBeDefined()
  })

  it('goes back to the catalogue with the earlier search [SC 3.3.7]', () => {
    renderDetail(book.slug, { search: '?q=lantern&hazard=mild' })
    expect(screen.getByRole('link', { name: 'Back to catalogue' }).getAttribute('href')).toBe('/?q=lantern&hazard=mild')
  })

  it('goes back to plain / when opened directly', () => {
    renderDetail(book.slug)
    expect(screen.getByRole('link', { name: 'Back to catalogue' }).getAttribute('href')).toBe('/')
  })

  it('ignores a malformed state', () => {
    renderDetail(book.slug, { search: 'https://evil.example' })
    expect(screen.getByRole('link', { name: 'Back to catalogue' }).getAttribute('href')).toBe('/')
  })

  it('keeps the cover decorative [SC 1.1.1]', () => {
    const { container } = renderDetail(book.slug)
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('BookDetailPage: unknown slug', () => {
  it('has zero axe violations', async () => {
    const { container } = renderDetail('no-such-book')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has the not-found h1, a sentence, the back link and the right title [SC 2.4.2, 3.3.3]', () => {
    renderDetail('no-such-book', { search: '?q=x' })
    expect(screen.getByRole('heading', { level: 1, name: 'Spellbook not found' })).toBeDefined()
    expect(screen.getByText(/There is no spellbook with this address/)).toBeDefined()
    expect(screen.getByRole('link', { name: 'Back to catalogue' }).getAttribute('href')).toBe('/?q=x')
    expect(document.title).toBe('Spellbook not found — Grimoire')
  })
})
