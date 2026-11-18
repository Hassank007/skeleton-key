/** One book as a list item: heading holding the card's only link, stretched over the card; school and hazard are real text (WCAG 1.4.1, 2.4.4, 4.1.2). */
import { Link } from 'react-router-dom'
import type { Book } from '../data/books'
import { BookCover } from './BookCover'
import styles from './BookCard.module.css'

interface BookCardProps {
  book: Book
  /** The current query string (for example `?q=ash`), passed to the detail page for its back link. */
  search: string
}

export function BookCard({ book, search }: BookCardProps) {
  return (
    <li className={styles.card}>
      <BookCover school={book.school} />
      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={`/books/${book.slug}`} state={{ search }} className={styles.link}>
            {book.title}
          </Link>
        </h3>
        <p className={styles.meta}>
          {book.author} · {book.school} · {book.hazard}
        </p>
        <p className={styles.summary}>{book.summary}</p>
      </div>
    </li>
  )
}
