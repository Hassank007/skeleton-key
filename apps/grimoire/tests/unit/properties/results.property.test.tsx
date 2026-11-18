import { describe, it } from 'vitest'
import fc from 'fast-check'
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResultsList } from '../../../src/components/ResultsList'
import { BOOKS, HAZARDS, SCHOOLS } from '../../../src/data/books'
import { countLabel, filterBooks } from '../../../src/lib/filterBooks'
import { checkProperty } from '../support/pbt'

const vocabulary = BOOKS.flatMap((b) => [...b.tags, ...b.title.split(' ')])
const state = fc.record({
  q: fc.array(fc.oneof(fc.constantFrom(...vocabulary), fc.string({ maxLength: 5 })), { maxLength: 3 }).map((w) => w.join(' ')),
  schools: fc.subarray([...SCHOOLS]),
  hazards: fc.subarray([...HAZARDS]),
})

describe('ResultsList properties', () => {
  it('the visible count equals the number of rendered cards, or the empty state when it is zero', async () => {
    await checkProperty(state, (s) => {
      const books = filterBooks(BOOKS, s)
      const { container } = render(
        <MemoryRouter>
          <ResultsList books={books} search="" onClear={() => {}} />
        </MemoryRouter>,
      )
      const cards = container.querySelectorAll('li').length
      const text = container.querySelector('p')!.textContent
      const empty = container.textContent!.includes('Try a shorter search or clear some filters.')
      cleanup()
      if (cards !== books.length) throw new Error(`rendered ${cards} cards for ${books.length} books`)
      if (text !== countLabel(books.length)) throw new Error(`count text was ${text}`)
      if (empty !== (books.length === 0)) throw new Error('empty state shown wrongly')
    })
  })
})
