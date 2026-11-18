/** Search and filter state kept in the URL query, so Back returns to the same results (WCAG 3.3.7). */
import { HAZARDS, SCHOOLS, type Hazard, type School } from '../data/books'

export interface SearchState {
  q: string
  schools: School[]
  hazards: Hazard[]
}

export const MAX_QUERY_LENGTH = 100

export const EMPTY_STATE: SearchState = { q: '', schools: [], hazards: [] }

/** Reads a state from URL params. Unknown school or hazard values are dropped; `q` is capped at 100 characters. */
export function parseQuery(params: URLSearchParams): SearchState {
  const schoolValues = params.getAll('school')
  const hazardValues = params.getAll('hazard')
  return {
    q: (params.get('q') ?? '').slice(0, MAX_QUERY_LENGTH),
    schools: SCHOOLS.filter((s) => schoolValues.includes(s.toLowerCase())),
    hazards: HAZARDS.filter((h) => hazardValues.includes(h.toLowerCase())),
  }
}

/** Writes a state to URL params: empty parts are omitted, schools and hazards are in canonical order. */
export function toSearchParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams()
  if (state.q !== '') params.set('q', state.q.slice(0, MAX_QUERY_LENGTH))
  for (const school of SCHOOLS) if (state.schools.includes(school)) params.append('school', school.toLowerCase())
  for (const hazard of HAZARDS) if (state.hazards.includes(hazard)) params.append('hazard', hazard.toLowerCase())
  return params
}

/** True when the search text or any filter is set. */
export function isActive(state: SearchState): boolean {
  return state.q.trim() !== '' || state.schools.length > 0 || state.hazards.length > 0
}
