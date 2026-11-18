/** Pure search and filter logic; the result message wording is shared by the visible count and the announcement (WCAG 4.1.3). */
import type { Book } from '../data/books'
import type { SearchState } from './searchState'

/** Lower-case, no diacritics. */
export function normalise(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/**
 * Keeps a book when every search word is in its title, author, summary or tags (AND),
 * its school is checked or no school is checked, and its hazard is checked or no hazard is checked.
 * Never reorders.
 */
export function filterBooks(books: readonly Book[], state: SearchState): Book[] {
  const words = normalise(state.q).split(/\s+/).filter(Boolean)
  return books.filter((book) => {
    if (state.schools.length > 0 && !state.schools.includes(book.school)) return false
    if (state.hazards.length > 0 && !state.hazards.includes(book.hazard)) return false
    if (words.length === 0) return true
    const haystack = normalise([book.title, book.author, book.summary, ...book.tags].join(' '))
    return words.every((word) => haystack.includes(word))
  })
}

/** 'No spellbooks found' | '1 spellbook found' | 'N spellbooks found'. */
export function resultsMessage(count: number): string {
  if (count === 0) return 'No spellbooks found'
  if (count === 1) return '1 spellbook found'
  return `${count} spellbooks found`
}

/** The visible count text: '24 spellbooks', '1 spellbook', '0 spellbooks'. */
export function countLabel(count: number): string {
  return `${count} ${count === 1 ? 'spellbook' : 'spellbooks'}`
}

export const EMPTY_HINT = 'Try a shorter search or clear some filters.'

/** The text sent to the announcer: the empty result adds the fix (WCAG 3.3.3). */
export function announcementFor(count: number): string {
  return count === 0 ? `${resultsMessage(0)}. ${EMPTY_HINT}` : resultsMessage(count)
}
