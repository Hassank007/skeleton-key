/** Book detail page: h1 with the title, a definition list of facts as text, a back link that keeps the search (WCAG 1.3.1, 2.4.2, 3.3.7). */
import { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { AppLink } from '../components/AppLink'
import { BookCover } from '../components/BookCover'
import { findBook } from '../data/books'
import styles from './BookDetailPage.module.css'

/** The query string the catalogue passed in `location.state`, or '' when the page was opened directly. */
function searchFrom(state: unknown): string {
  const search = (state as { search?: unknown } | null)?.search
  return typeof search === 'string' && (search === '' || search.startsWith('?')) ? search : ''
}

export function BookDetailPage() {
  const { slug } = useParams()
  const location = useLocation()
  const book = findBook(slug)
  const backHref = `/${searchFrom(location.state)}`

  useEffect(() => {
    document.title = `${book ? book.title : 'Spellbook not found'} — Grimoire`
  }, [book])

  if (!book) {
    return (
      <article>
        <h1 tabIndex={-1}>Spellbook not found</h1>
        <p className={styles.paragraph}>There is no spellbook with this address. It may have been moved, or it may never have existed.</p>
        <p className={styles.paragraph}>
          <AppLink href={backHref}>Back to catalogue</AppLink>
        </p>
      </article>
    )
  }

  return (
    <article>
      <div className={styles.head}>
        <BookCover school={book.school} className={styles.cover} />
        <h1 tabIndex={-1} className={styles.title}>
          {book.title}
        </h1>
      </div>
      <p className={styles.back}>
        <AppLink href={backHref}>Back to catalogue</AppLink>
      </p>

      <dl className={styles.facts}>
        <div>
          <dt>Author</dt>
          <dd>{book.author}</dd>
        </div>
        <div>
          <dt>School</dt>
          <dd>{book.school}</dd>
        </div>
        <div>
          <dt>Hazard</dt>
          <dd>{book.hazard}</dd>
        </div>
        <div>
          <dt>Year</dt>
          <dd>{book.year}</dd>
        </div>
        <div>
          <dt>Pages</dt>
          <dd>{book.pages}</dd>
        </div>
      </dl>

      {book.description.map((paragraph) => (
        <p key={paragraph} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}

      <h2 className={styles.tagsHeading}>Tags</h2>
      <ul className={styles.tags}>
        {book.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </article>
  )
}
