import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { SearchFilters } from '../../src/components/SearchFilters'
import { EMPTY_STATE, type SearchState } from '../../src/lib/searchState'

function Harness({ initial = EMPTY_STATE, onClear }: { initial?: SearchState; onClear?: () => void }) {
  const [state, setState] = useState<SearchState>(initial)
  return (
    <SearchFilters
      state={state}
      onChange={setState}
      onClear={() => {
        onClear?.()
        setState(EMPTY_STATE)
      }}
    />
  )
}

describe('SearchFilters', () => {
  it('has zero axe violations in the default state [SC 1.3.1]', async () => {
    const { container } = render(<Harness />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has zero axe violations in an active state', async () => {
    const { container } = render(<Harness initial={{ q: 'ash', schools: ['Alchemy'], hazards: ['Mild', 'Forbidden'] }} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ties a visible label to the search input and links the hint [SC 3.3.2, 4.1.2]', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Search spellbooks')
    expect(input.tagName).toBe('INPUT')
    const hint = screen.getByText('Searches title, author, summary and tags.')
    expect(input.getAttribute('aria-describedby')).toContain(hint.id)
  })

  it('is a labelled search landmark with a type=search, autocomplete=off input [SC 1.3.1]', () => {
    render(<Harness />)
    expect(screen.getByRole('search', { name: 'Catalogue search' })).toBeDefined()
    const input = screen.getByLabelText('Search spellbooks')
    expect(input.getAttribute('type')).toBe('search')
    expect(input.getAttribute('autocomplete')).toBe('off')
  })

  it('has two fieldsets with the exact legends [SC 1.3.1]', () => {
    render(<Harness />)
    const groups = screen.getAllByRole('group')
    expect(groups.map((g) => g.querySelector('legend')?.textContent)).toEqual(['School of magic', 'Hazard'])
  })

  it('has nine native checkboxes, each with a label [SC 4.1.2]', () => {
    render(<Harness />)
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes).toHaveLength(9)
    for (const box of boxes) {
      expect(box.getAttribute('type')).toBe('checkbox')
      expect(box.id).not.toBe('')
      expect(document.querySelector(`label[for="${box.id}"]`)?.textContent?.trim()).toBeTruthy()
    }
    expect(within(screen.getByRole('group', { name: 'School of magic' })).getAllByRole('checkbox')).toHaveLength(6)
    expect(within(screen.getByRole('group', { name: 'Hazard' })).getAllByRole('checkbox')).toHaveLength(3)
  })

  it('does not submit or navigate when Enter is pressed in the input [REQ-4.6]', async () => {
    const user = userEvent.setup()
    const submit = vi.fn((e: Event) => e.defaultPrevented)
    render(<Harness />)
    // React handles events at the root, so look at the event after it has bubbled to the document.
    const listener = (e: Event) => submit(e)
    document.addEventListener('submit', listener)
    await user.type(screen.getByLabelText('Search spellbooks'), 'ash{Enter}')
    document.removeEventListener('submit', listener)
    expect(submit).toHaveBeenCalled()
    expect(submit.mock.results[0].value).toBe(true)
  })

  it('toggles a checkbox with Space [SC 2.1.1]', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const box = screen.getByRole('checkbox', { name: 'Warding' })
    box.focus()
    await user.keyboard(' ')
    expect((box as HTMLInputElement).checked).toBe(true)
    await user.keyboard(' ')
    expect((box as HTMLInputElement).checked).toBe(false)
  })

  it('shows no clear button when nothing is active [REQ-5.6]', () => {
    render(<Harness />)
    expect(screen.queryByRole('button', { name: 'Clear search and filters' })).toBeNull()
  })

  it('shows the clear button when active and calls back when used [REQ-5.5]', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<Harness onClear={onClear} />)
    await user.type(screen.getByLabelText('Search spellbooks'), 'x')
    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }))
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Clear search and filters' })).toBeNull()
  })

  it('shows the clear button when only a filter is checked', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('checkbox', { name: 'Mild' }))
    expect(screen.getByRole('button', { name: 'Clear search and filters' })).toBeDefined()
  })
})
