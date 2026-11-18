/** About page — sets document title and renders the page h1 for focus management (WCAG 2.4.2, 2.4.3). */
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'

export function AboutPage() {
  useEffect(() => {
    document.title = 'About — Seance'
  }, [])

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <article>
      <h1 tabIndex={-1}>About</h1>
      <p>
        Seance is a demo booking form for meeting invented spirits. It is built from
        the Skeleton Key accessibility template, so it works with a keyboard, a screen
        reader, zoom and reduced motion. This is a demo: nothing you type is stored or sent.
      </p>
      <h2>How it is built</h2>
      <ul>
        <li>Three steps, each with its own page title and heading, and a visible step count.</li>
        <li>Errors are written in words, listed in a summary, and linked to each field.</li>
        <li>Native date, time and radio controls, with autocomplete for your name, email and phone.</li>
        <li>A confirmation dialog before anything is booked, and a spoken status message afterwards.</li>
        <li>Reduced-motion support and an in-app motion toggle.</li>
      </ul>
      <h2>Dialog demo</h2>
      <p>The button below opens an accessible modal dialog. Focus moves inside, Tab cycles within it, and Escape closes it.</p>
      <Button
        type="button"
        onClick={() => setDialogOpen(true)}
        data-testid="open-demo-dialog"
      >
        Open demo dialog
      </Button>

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Demo Dialog"
        description="This dialog demonstrates the APG modal pattern. Focus is trapped inside; Escape closes it and returns focus to the trigger button."
      >
        <p>You can Tab through the controls below. Press Escape or use the close button to dismiss.</p>
        <Button type="button" onClick={() => setDialogOpen(false)}>
          Done
        </Button>
      </Dialog>
    </article>
  )
}
