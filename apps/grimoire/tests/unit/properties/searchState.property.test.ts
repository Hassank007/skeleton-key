import { describe, it } from 'vitest'
import fc from 'fast-check'
import { HAZARDS, SCHOOLS } from '../../../src/data/books'
import { parseQuery, toSearchParams, type SearchState } from '../../../src/lib/searchState'
import { checkProperty } from '../support/pbt'

/** A valid state: schools and hazards in canonical order, no duplicates, q up to 100 characters. */
export const validState: fc.Arbitrary<SearchState> = fc.record({
  q: fc.string({ maxLength: 100 }),
  schools: fc.subarray([...SCHOOLS]),
  hazards: fc.subarray([...HAZARDS]),
})

describe('searchState properties', () => {
  it('parseQuery(toSearchParams(s)) equals s for every valid state [SC 3.3.7]', async () => {
    await checkProperty(validState, (state) => {
      const back = parseQuery(new URLSearchParams(toSearchParams(state).toString()))
      if (JSON.stringify(back) !== JSON.stringify(state)) {
        throw new Error(`round trip changed ${JSON.stringify(state)} into ${JSON.stringify(back)}`)
      }
    })
  })

  it('unknown school and hazard values never reach the state', async () => {
    await checkProperty(fc.array(fc.string(), { maxLength: 6 }), (junk) => {
      const params = new URLSearchParams()
      for (const j of junk) {
        params.append('school', `x-${j}`)
        params.append('hazard', `x-${j}`)
      }
      const s = parseQuery(params)
      if (s.schools.length !== 0 || s.hazards.length !== 0) throw new Error('unknown value was kept')
    })
  })
})
