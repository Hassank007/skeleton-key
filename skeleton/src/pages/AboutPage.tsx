/** About page — sets document title and renders the page h1 for focus management (WCAG 2.4.2, 2.4.3). */
import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'

export function AboutPage() {
  useEffect(() => {
    document.title = 'About — Skeleton Key'
  }, [])

  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <article>
      <h1 tabIndex={-1}>About</h1>
      <p>
        Skeleton Key is built for developers and small teams who want to ship
        fast without leaving disabled users behind, and who do not have an
        accessibility specialist on staff.
      </p>
      <h2>What you get</h2>
      <ul>
        <li>Semantic page shell with skip link, landmarks, and one h1 per page.</li>
        <li>Route changes that move focus to the new page heading.</li>
        <li>A live-region announcer for status messages (WCAG 4.1.3).</li>
        <li>
          Accessible primitives: Button, Link, Field, Dialog, Toast, and Tabs.
        </li>
        <li>Design tokens with contrast verified in both light and dark themes.</li>
        <li>Reduced-motion support and an in-app motion toggle.</li>
        <li>Axe tests built into the test suite from day one.</li>
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
