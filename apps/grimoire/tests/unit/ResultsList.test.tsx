import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { ResultsList } from '../../src/components/ResultsList'
import { BOOKS } from '../../src/data/books'

function renderList(books = BOOKS) {
  return render(
    <MemoryRouter>
      <ResultsList books={books} search="" onClear={() => {}} />
    </MemoryRouter>,
  )
}

describe('ResultsList', () => {
  it('has zero axe violations with results [SC 1.3.1]', async () => {
    const { container } = renderList()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations in the empty state', async () => {
    const { container } = renderList([])
    expect(await axe(container)).toHaveNoViolations()
  })

  it('is a section named by its h2 "Results" [SC 1.3.1]', () => {
    renderList()
    const section = screen.getByRole('region', { name: 'Results' })
    expect(within(section).getByRole('heading', { level: 2, name: 'Results' })).toBeDefined()
  })

  it('renders a ul with one li per book, in alphabetical order', () => {
    renderList()
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(BOOKS.length)
    const titles = items.map((li) => li.querySelector('h3')!.textContent!)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'en')))
  })

  it('shows the visible count as plain text, not in a live region [REQ-6.7]', () => {
    const { container } = renderList(BOOKS.slice(0, 3))
    const count = screen.getByText('3 spellbooks')
    expect(count.closest('[aria-live], [role="status"], [role="alert"]')).toBeNull()
    expect(container.querySelector('[aria-live], [role="status"]')).toBeNull()
  })

  it('shows "1 spellbook" for one result', () => {
    renderList(BOOKS.slice(0, 1))
    expect(screen.getByText('1 spellbook')).toBeDefined()
  })

  it('replaces the list with the empty state for zero results [SC 3.3.3]', () => {
    renderList([])
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('0 spellbooks')).toBeDefined()
    expect(screen.getByText('Try a shorter search or clear some filters.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Clear search and filters' })).toBeDefined()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not show the empty state while a book matches [REQ-8.5]', () => {
    renderList(BOOKS.slice(0, 1))
    expect(screen.queryByText('No spellbooks found.')).toBeNull()
  })
})
