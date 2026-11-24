/** Catalogue page: h1 for route focus, labelled search form, visible count and a polite debounced announcement of the result count (WCAG 2.4.2, 2.4.3, 3.3.7, 4.1.3). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Candle } from '../components/Candle'
import { ResultsList } from '../components/ResultsList'
import { SearchFilters } from '../components/SearchFilters'
import { BOOKS } from '../data/books'
import { useDebouncedAnnouncement } from '../hooks/useDebouncedAnnouncement'
import { announcementFor, filterBooks } from '../lib/filterBooks'
import { EMPTY_STATE, parseQuery, toSearchParams, type SearchState } from '../lib/searchState'
import styles from './CataloguePage.module.css'

const keyOf = (state: SearchState): string => toSearchParams(state).toString()

// Every address this page writes carries a number. React Router commits each write inside a transition, so an older
// write can land after newer typing. A commit with a number newer than any committed before is our own and is ignored.
// Anything else (a link, Back, Forward, even to an address written earlier) has an older number or none and is followed.
const SESSION = Math.random().toString(36).slice(2)
let writeCounter = 0

const writeNumber = (locationState: unknown): number | null => {
  const mark = (locationState as { grimoireWrite?: { session?: unknown; n?: unknown } } | null)?.grimoireWrite
  return mark && mark.session === SESSION && typeof mark.n === 'number' ? mark.n : null
}

export function CataloguePage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  // Local state drives the input, so typing is never delayed by a router transition. The URL follows it with `replace`.
  const [state, setState] = useState<SearchState>(() => parseQuery(params))
  const committedWrite = useRef(writeCounter) // highest write number of this page that has reached the address
  const handledKey = useRef(location.key)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = 'Catalogue — Grimoire'
  }, [])

  // A change to the address that this page did not write (a link, Back, Forward) replaces the state.
  useEffect(() => {
    if (location.key === handledKey.current) return
    handledKey.current = location.key
    const n = writeNumber(location.state)
    if (n !== null && n > committedWrite.current && n <= writeCounter) {
      committedWrite.current = n
      return
    }
    committedWrite.current = writeCounter
    setState(parseQuery(new URLSearchParams(location.search)))
  }, [location])

  const update = (next: SearchState) => {
    const n = ++writeCounter
    setState(next)
    setParams(toSearchParams(next), { replace: true, state: { grimoireWrite: { session: SESSION, n } } })
  }

  const clear = () => {
    update(EMPTY_STATE)
    // The clear button disappears now, so focus moves to the search input first (WCAG 2.4.3).
    inputRef.current?.focus()
  }

  const stateKey = keyOf(state)
  const books = useMemo(() => filterBooks(BOOKS, state), [state])
  useDebouncedAnnouncement(announcementFor(books.length), stateKey)

  return (
    <article className={styles.catalogue}>
      <div className={styles.hero}>
        <h1 tabIndex={-1} className={styles.title}>
          The Grimoire: a catalogue of spellbooks
        </h1>
        <Candle />
      </div>
      <p className={styles.intro}>
        Twenty-four invented spellbooks, from gentle primers to volumes the library keeps behind glass. Search by word,
        or narrow the list by school of magic and hazard.
      </p>

      <section aria-labelledby="find-heading" className={styles.find}>
        <h2 id="find-heading">Find a spellbook</h2>
        <SearchFilters state={state} onChange={update} onClear={clear} inputRef={inputRef} />
      </section>

      <ResultsList books={books} search={stateKey ? `?${stateKey}` : ''} onClear={clear} />
    </article>
  )
}
