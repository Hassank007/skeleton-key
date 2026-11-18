/** About page — sets document title and renders the page h1 for focus management (WCAG 2.4.2, 2.4.3). */
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'

export function AboutPage() {
  useEffect(() => {
    document.title = 'About — Grimoire'
  }, [])

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <article>
      <h1 tabIndex={-1}>About</h1>
      <p>
        Grimoire is a catalogue of 24 invented spellbooks. Every book, author
        and year is fictional. It is built from the Skeleton Key template, so
        it starts with an accessible page shell, tested colour contrast and a
        full keyboard path through every page.
      </p>
      <h2>What you get</h2>
      <ul>
        <li>Search by title, author, summary or tag, with results that update as you type.</li>
        <li>Filters for school of magic and hazard, kept in the address so Back returns to your search.</li>
        <li>A polite spoken result count, sent once the search settles.</li>
        <li>A page per book, with every detail as real text.</li>
        <li>Light and dark themes, and a Reduce motion toggle.</li>
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
