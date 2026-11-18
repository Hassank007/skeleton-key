/** Introduction page: sets a unique title, one h1 for route-change focus, and explains in plain text what the flow asks and that nothing is stored (WCAG 2.4.2, 2.4.3, 3.3.2). */
import { useEffect } from 'react'
import { AppLink } from '../components/AppLink'
import { MistArt } from '../components/MistArt'
import { STEPS } from '../lib/steps'
import styles from './IntroPage.module.css'

export function IntroPage() {
  useEffect(() => {
    document.title = 'Book a séance — Seance'
  }, [])

  return (
    <article className={styles.ticket}>
      <MistArt />
      <h1 tabIndex={-1} className={styles.title}>
        Book a séance with a spirit
      </h1>
      <p>
        The form has three short steps and takes about two minutes. You will choose a spirit, pick a date and time, and
        give your name, email address and phone number. You can review everything before it is booked.
      </p>
      <ol className={styles.steps} aria-label="The three steps">
        {STEPS.map((step) => (
          <li key={step.id}>{step.name}</li>
        ))}
      </ol>
      <p className={styles.notice}>This is a demo. The spirits are invented, and nothing you type is stored or sent.</p>
      <AppLink href="/book/spirit" className={styles.start}>
        Start booking
      </AppLink>
    </article>
  )
}