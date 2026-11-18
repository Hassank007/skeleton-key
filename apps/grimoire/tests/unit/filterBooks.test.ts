import { describe, expect, it } from 'vitest'
import { BOOKS } from '../../src/data/books'
import { announcementFor, countLabel, filterBooks, normalise, resultsMessage } from '../../src/lib/filterBooks'
import type { SearchState } from '../../src/lib/searchState'

const none: SearchState = { q: '', schools: [], hazards: [] }
const slugs = (s: Partial<SearchState>) => filterBooks(BOOKS, { ...none, ...s }).map((b) => b.slug)

describe('normalise', () => {
  it('lower-cases and strips diacritics', () => {
    expect(normalise('Émber ÀÉÎõü')).toBe('ember aeiou')
  })
})

describe('filterBooks: search text', () => {
  it('returns all books for an empty search', () => {
    expect(slugs({})).toHaveLength(24)
  })

  it('is case-insensitive', () => {
    expect(slugs({ q: 'LANTERN' })).toContain('the-lantern-of-small-hours')
    expect(slugs({ q: 'lantern' })).toEqual(slugs({ q: 'LaNtErN' }))
  })

  it('ignores diacritics in both directions', () => {
    expect(slugs({ q: 'Émber' })).toContain('ember-and-ash-herbal')
    expect(slugs({ q: 'marchenoir' })).toContain('the-almanac-of-near-mornings')
    expect(slugs({ q: 'Marchénoir' })).toContain('the-almanac-of-near-mornings')
  })

  it('requires every word (AND), in any order', () => {
    expect(slugs({ q: 'ash ember' })).toContain('ember-and-ash-herbal')
    expect(slugs({ q: 'ember zzzz' })).toEqual([])
    expect(slugs({ q: 'ember ash' }).length).toBeLessThanOrEqual(slugs({ q: 'ember' }).length)
  })

  it('treats extra whitespace as one separator', () => {
    expect(slugs({ q: '  ember    ash  ' })).toEqual(slugs({ q: 'ember ash' }))
  })

  it('matches in the title', () => {
    expect(slugs({ q: 'hollow index' })).toEqual(['the-hollow-index'])
  })

  it('matches in the author', () => {
    expect(slugs({ q: 'kindlewood' })).toEqual(['ember-and-ash-herbal'])
  })

  it('matches in the summary only', () => {
    const book = BOOKS.find((b) => b.slug === 'shadows-for-beginners')!
    const word = 'casting'
    const rest = [book.title, book.author, ...book.tags].join(' ').toLowerCase()
    expect(book.summary.toLowerCase()).toContain(word)
    expect(rest).not.toContain(word)
    expect(slugs({ q: word })).toContain('shadows-for-beginners')
  })

  it('matches in the tags only', () => {
    const book = BOOKS.find((b) => b.slug === 'the-copper-tongue')!
    const tag = 'speech'
    const rest = [book.title, book.author, book.summary].join(' ').toLowerCase()
    expect(book.tags).toContain(tag)
    expect(rest).not.toContain(tag)
    expect(slugs({ q: tag })).toContain('the-copper-tongue')
  })

  it('computes expectations from the data, not from a fixed count', () => {
    const expected = BOOKS.filter((b) =>
      [b.title, b.author, b.summary, ...b.tags].join(' ').toLowerCase().includes('ash'),
    ).map((b) => b.slug)
    expect(slugs({ q: 'ash' })).toEqual(expected)
  })
})

describe('filterBooks: filters', () => {
  it('ORs values within a group', () => {
    const result = filterBooks(BOOKS, { ...none, schools: ['Warding', 'Alchemy'] })
    expect(result.every((b) => b.school === 'Warding' || b.school === 'Alchemy')).toBe(true)
    expect(result.some((b) => b.school === 'Warding')).toBe(true)
    expect(result.some((b) => b.school === 'Alchemy')).toBe(true)
  })

  it('ANDs across groups and with the search text', () => {
    const result = filterBooks(BOOKS, { q: 'the', schools: ['Illusion'], hazards: ['Mild'] })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((b) => b.school === 'Illusion' && b.hazard === 'Mild')).toBe(true)
  })

  it('treats an empty group as no restriction', () => {
    expect(filterBooks(BOOKS, { ...none, hazards: ['Forbidden'] }).length).toBe(
      BOOKS.filter((b) => b.hazard === 'Forbidden').length,
    )
  })

  it('keeps the alphabetical order of BOOKS', () => {
    const titles = filterBooks(BOOKS, { ...none, hazards: ['Mild', 'Perilous'] }).map((b) => b.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'en')))
  })
})

describe('messages', () => {
  it('words the result message for 0, 1 and N', () => {
    expect(resultsMessage(0)).toBe('No spellbooks found')
    expect(resultsMessage(1)).toBe('1 spellbook found')
    expect(resultsMessage(7)).toBe('7 spellbooks found')
  })

  it('words the visible count', () => {
    expect(countLabel(0)).toBe('0 spellbooks')
    expect(countLabel(1)).toBe('1 spellbook')
    expect(countLabel(24)).toBe('24 spellbooks')
  })

  it('adds the fix to the empty-result announcement', () => {
    expect(announcementFor(0)).toBe('No spellbooks found. Try a shorter search or clear some filters.')
    expect(announcementFor(3)).toBe('3 spellbooks found')
  })
})
