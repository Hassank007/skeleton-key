import { describe, it } from 'vitest'
import fc from 'fast-check'
import { BOOKS, HAZARDS, SCHOOLS } from '../../../src/data/books'
import { filterBooks, normalise } from '../../../src/lib/filterBooks'
import type { SearchState } from '../../../src/lib/searchState'
import { checkProperty } from '../support/pbt'

/** Search text built from real words, tags and random noise, so both matching and empty results are common. */
const vocabulary = BOOKS.flatMap((b) => [...b.tags, ...b.title.split(' '), ...b.author.split(' ')])
const word = fc.oneof(fc.constantFrom(...vocabulary), fc.string({ maxLength: 6 }))
const query = fc.array(word, { maxLength: 3 }).map((w) => w.join(' '))

const state: fc.Arbitrary<SearchState> = fc.record({
  q: query,
  schools: fc.subarray([...SCHOOLS]),
  hazards: fc.subarray([...HAZARDS]),
})

function matchesAll(book: (typeof BOOKS)[number], s: SearchState): boolean {
  const words = normalise(s.q).split(/\s+/).filter(Boolean)
  const hay = normalise([book.title, book.author, book.summary, ...book.tags].join(' '))
  return (
    words.every((w) => hay.includes(w)) &&
    (s.schools.length === 0 || s.schools.includes(book.school)) &&
    (s.hazards.length === 0 || s.hazards.includes(book.hazard))
  )
}

describe('filterBooks properties', () => {
  it('every returned book matches every active part, and no matching book is left out', async () => {
    await checkProperty(state, (s) => {
      const result = filterBooks(BOOKS, s)
      const expected = BOOKS.filter((b) => matchesAll(b, s))
      if (result.map((b) => b.slug).join() !== expected.map((b) => b.slug).join()) {
        throw new Error(`result differs from the definition for ${JSON.stringify(s)}`)
      }
    })
  })

  it('the result is a subset of all books in the same order', async () => {
    await checkProperty(state, (s) => {
      const order = BOOKS.map((b) => b.slug)
      const slugs = filterBooks(BOOKS, s).map((b) => b.slug)
      const positions = slugs.map((slug) => order.indexOf(slug))
      if (positions.some((p) => p === -1)) throw new Error('returned a book that is not in BOOKS')
      for (let i = 1; i < positions.length; i++) if (positions[i] <= positions[i - 1]) throw new Error('order changed')
    })
  })

  it('no search and no filters returns all 24 books', async () => {
    await checkProperty(fc.constantFrom('', ' ', '   ', '\t'), (q) => {
      const result = filterBooks(BOOKS, { q, schools: [], hazards: [] })
      if (result.length !== 24) throw new Error(`got ${result.length} books`)
    })
  })

  it('adding a checked value in a fieldset never removes a book (OR within a group)', async () => {
    // The group that gains a value already has one checked: an empty group means "no restriction".
    await checkProperty(
      fc.record({
        q: query,
        schools: fc.subarray([...SCHOOLS], { minLength: 1 }),
        hazards: fc.subarray([...HAZARDS], { minLength: 1 }),
        school: fc.constantFrom(...SCHOOLS),
        hazard: fc.constantFrom(...HAZARDS),
      }),
      ({ school, hazard, ...s }) => {
        const before = new Set(filterBooks(BOOKS, s).map((b) => b.slug))
        const next = [
          { ...s, schools: [...new Set([...s.schools, school])] },
          { ...s, hazards: [...new Set([...s.hazards, hazard])] },
        ]
        for (const n of next) {
          const after = new Set(filterBooks(BOOKS, n).map((b) => b.slug))
          for (const slug of before) if (!after.has(slug)) throw new Error(`${slug} was removed`)
        }
      },
    )
  })

  it('adding a search word never adds a book (AND)', async () => {
    await checkProperty(fc.tuple(state, word), ([s, extra]) => {
      const before = new Set(filterBooks(BOOKS, s).map((b) => b.slug))
      const after = filterBooks(BOOKS, { ...s, q: `${s.q} ${extra}` })
      for (const book of after) if (!before.has(book.slug)) throw new Error(`${book.slug} was added`)
    })
  })
})
