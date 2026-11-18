/** Results section: named by its h2, visible count as plain text (not a live region), a list of cards or the empty state (WCAG 1.3.1, 4.1.3). */
import type { Book } from '../data/books'
import { countLabel } from '../lib/filterBooks'
import { BookCard } from './BookCard'
import { EmptyState } from './EmptyState'
import styles from './ResultsList.module.css'

interface ResultsListProps {
  books: readonly Book[]
  search: string
  onClear: () => void
}

export function ResultsList({ books, search, onClear }: ResultsListProps) {
  return (
    <section aria-labelledby="results-heading" className={styles.results}>
      <h2 id="results-heading" className={styles.heading}>
        Results
      </h2>
      <p className={styles.count}>{countLabel(books.length)}</p>
      {books.length === 0 ? (
        <EmptyState onClear={onClear} />
      ) : (
        <ul className={styles.list}>
          {books.map((book) => (
            <BookCard key={book.slug} book={book} search={search} />
          ))}
        </ul>
      )}
    </section>
  )
}
