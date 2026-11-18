/** Catalogue page: h1 for route focus, labelled search form, visible count and a polite debounced announcement of the result count (WCAG 2.4.2, 2.4.3, 3.3.7, 4.1.3). */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Candle } from '../components/Candle'
import { ResultsList } from '../components/ResultsList'
import { SearchFilters } from '../components/SearchFilters'
import { BOOKS } from '../data/books'
import { useDebouncedAnnouncement } from '../hooks/useDebouncedAnnouncement'
import { announcementFor, filterBooks } from '../lib/filterBooks'
import { EMPTY_STATE, parseQuery, toSearchParams, type SearchState } from '../lib/searchState'
import styles from './CataloguePage.module.css'

const keyOf = (state: SearchState): string => toSearchParams(state).toString()

export function CataloguePage() {
  const [params, setParams] = useSearchParams()
  const urlKey = params.toString()
  // Local state drives the input, so typing is never delayed by a router transition. The URL follows it with `replace`.
  const [state, setState] = useState<SearchState>(() => parseQuery(params))
  const lastWritten = useRef(urlKey)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = 'Catalogue — Grimoire'
  }, [])

  // A change to the address that this page did not write (a link, Back, Forward) replaces the state.
  useEffect(() => {
    if (urlKey === lastWritten.current) return
    lastWritten.current = urlKey
    setState(parseQuery(new URLSearchParams(urlKey)))
  }, [urlKey])

  const update = (next: SearchState) => {
    const nextParams = toSearchParams(next)
    lastWritten.current = nextParams.toString()
    setState(next)
    setParams(nextParams, { replace: true })
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
    <article>
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
