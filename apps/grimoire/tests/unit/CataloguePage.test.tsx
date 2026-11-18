import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { AnnouncerProvider } from '../../src/contexts/AnnouncerContext'
import { MotionProvider } from '../../src/contexts/MotionContext'
import { CataloguePage } from '../../src/pages/CataloguePage'
import { BOOKS } from '../../src/data/books'
import { filterBooks } from '../../src/lib/filterBooks'
import { EMPTY_STATE } from '../../src/lib/searchState'

const polite = () => document.querySelector('[aria-live="polite"]')!.textContent
const assertive = () => document.querySelector('[aria-live="assertive"]')!.textContent

function renderPage(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MotionProvider>
        <AnnouncerProvider>
          <CataloguePage />
        </AnnouncerProvider>
      </MotionProvider>
    </MemoryRouter>,
  )
}

const searchBox = () => screen.getByLabelText('Search spellbooks') as HTMLInputElement
const cards = () => screen.queryAllByRole('heading', { level: 3 })

describe('CataloguePage', () => {
  it('has zero axe violations by default [SC 1.3.1]', async () => {
    const { container } = renderPage()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations with filtered results', async () => {
    const { container } = renderPage('/?q=ash&school=herbalism&hazard=mild')
    expect(cards().length).toBeGreaterThan(0)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations in the empty state', async () => {
    const { container } = renderPage('/?q=zzzzzz')
    expect(screen.getByText('No spellbooks found.')).toBeDefined()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('sets the document title [SC 2.4.2]', () => {
    renderPage()
    expect(document.title).toBe('Catalogue — Grimoire')
  })

  it('has exactly one h1 and an ordered heading outline [SC 1.3.1, 2.4.6]', () => {
    renderPage()
    const headings = screen.getAllByRole('heading')
    expect(headings.filter((h) => h.tagName === 'H1')).toHaveLength(1)
    const levels = headings.map((h) => Number(h.tagName[1]))
    expect(levels[0]).toBe(1)
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    expect(headings.slice(0, 3).map((h) => h.textContent)).toEqual([
      'The Grimoire: a catalogue of spellbooks',
      'Find a spellbook',
      'Results',
    ])
    expect(screen.getByRole('heading', { level: 1 }).getAttribute('tabindex')).toBe('-1')
  })

  it('shows all 24 books by default', () => {
    renderPage()
    expect(cards()).toHaveLength(24)
    expect(screen.getByText('24 spellbooks')).toBeDefined()
  })

  it('changes the visible count as the user types [SC 4.1.3]', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(searchBox(), 'hollow index')
    const expected = filterBooks(BOOKS, { ...EMPTY_STATE, q: 'hollow index' }).length
    expect(expected).toBe(1)
    expect(screen.getByText('1 spellbook')).toBeDefined()
    expect(cards()).toHaveLength(1)
  })

  it('applies the initial URL query before the first paint [REQ-10.2]', () => {
    renderPage('/?q=ember&school=herbalism&hazard=mild')
    expect(searchBox().value).toBe('ember')
    expect((screen.getByRole('checkbox', { name: 'Herbalism' }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('checkbox', { name: 'Mild' }) as HTMLInputElement).checked).toBe(true)
    const expected = filterBooks(BOOKS, { q: 'ember', schools: ['Herbalism'], hazards: ['Mild'] })
    expect(cards()).toHaveLength(expected.length)
  })

  it('ignores unknown query values [REQ-10.2]', () => {
    renderPage('/?school=pyromancy&hazard=deadly&q=')
    expect(cards()).toHaveLength(24)
    for (const box of screen.getAllByRole('checkbox')) expect((box as HTMLInputElement).checked).toBe(false)
  })

  it('shows the empty state, and the clear button empties the box and focuses it [SC 2.4.3, 3.3.3]', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(searchBox(), 'zzzzzz')
    await user.click(screen.getByRole('checkbox', { name: 'Mild' }))
    expect(screen.getByText('No spellbooks found.')).toBeDefined()
    expect(screen.getByText('Try a shorter search or clear some filters.')).toBeDefined()
    const clear = screen.getAllByRole('button', { name: 'Clear search and filters' })
    await user.click(clear[clear.length - 1])
    expect(searchBox().value).toBe('')
    expect((screen.getByRole('checkbox', { name: 'Mild' }) as HTMLInputElement).checked).toBe(false)
    expect(document.activeElement).toBe(searchBox())
    expect(cards()).toHaveLength(24)
    expect(screen.queryByRole('button', { name: 'Clear search and filters' })).toBeNull()
  })

  it('makes each card link go to its book and carry the query', () => {
    renderPage('/?q=lantern')
    const link = screen.getByRole('link', { name: 'The Lantern of Small Hours' })
    expect(link.getAttribute('href')).toBe('/books/the-lantern-of-small-hours')
  })

  it('renders no live region of its own [REQ-6.5]', () => {
    const { container } = renderPage()
    expect(container.querySelectorAll('[aria-live], [role="status"], [role="alert"]')).toHaveLength(2)
    const region = within(container)
    expect(region.queryByRole('alert')).toBeNull()
  })

  describe('announcements', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('says nothing on first render [REQ-6.4]', async () => {
      renderPage()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000)
      })
      expect(polite()).toBe('')
      expect(assertive()).toBe('')
    })

    it('announces the count politely after 500 ms and never assertively [SC 4.1.3]', async () => {
      renderPage()
      fireEvent.change(searchBox(), { target: { value: 'hollow index' } })
      expect(polite()).toBe('')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })
      expect(polite()).toBe('1 spellbook found')
      expect(assertive()).toBe('')
    })

    it('announces the empty result with the fix, once [SC 3.3.3, 4.1.3]', async () => {
      renderPage()
      fireEvent.change(searchBox(), { target: { value: 'zzzzzz' } })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })
      expect(polite()).toBe('No spellbooks found. Try a shorter search or clear some filters.')
      expect(assertive()).toBe('')
    })
  })
})
