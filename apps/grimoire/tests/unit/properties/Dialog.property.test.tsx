/**
 * Invariant: while the Dialog is open, no sequence of Tab, Shift+Tab or clicks inside it puts focus
 * outside it; when it closes by any route, focus is on the trigger and the page is no longer inert.
 * See .kiro/specs/a11y-pbt/design.md, "Property 3: Dialog".
 *
 * Documented exclusion: positive tabindex values are not generated (design.md, REQ-5.4).
 * jsdom has no `inert` and no native Tab order. user-event moves focus to the next tabbable
 * element in the document when the handler does not call preventDefault, so a leak is detected.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { computeAccessibleName } from 'dom-accessibility-api'
import fc from 'fast-check'
import { createElement, useState, type ReactNode } from 'react'
import { axe } from 'vitest-axe'
import { Dialog } from '../../../src/components/Dialog'
import { checkProperty } from '../support/pbt'

const FOCUSABLE = ['button', 'input', 'textarea', 'select', 'link', 'tabindex0'] as const
const DISTRACTOR = ['disabledButton', 'disabledInput', 'anchorNoHref', 'tabindexMinus1', 'text'] as const
type FocusableKind = (typeof FOCUSABLE)[number]
type DistractorKind = (typeof DISTRACTOR)[number]
type Action = 'Tab' | 'Shift+Tab' | 'clickPanel'
type CloseVia = 'escape' | 'closeButton' | 'backdrop'

/** Focusables (1 to 10) with distractors inserted at generated positions. */
const content = fc
  .record({
    focusables: fc.array(fc.constantFrom<FocusableKind>(...FOCUSABLE), { minLength: 1, maxLength: 10 }),
    distractors: fc.array(
      fc.record({ kind: fc.constantFrom<DistractorKind>(...DISTRACTOR), at: fc.nat({ max: 20 }) }),
      { maxLength: 6 },
    ),
  })
  .map(({ focusables, distractors }) => {
    const items: Array<{ focusable: boolean; kind: FocusableKind | DistractorKind }> = focusables.map((kind) => ({
      focusable: true,
      kind,
    }))
    for (const d of distractors) {
      items.splice(d.at % (items.length + 1), 0, { focusable: false, kind: d.kind })
    }
    return items
  })

const actions = fc.array(fc.constantFrom<Action>('Tab', 'Shift+Tab', 'clickPanel'), { minLength: 1, maxLength: 30 })
const closeVia = fc.constantFrom<CloseVia>('escape', 'closeButton', 'backdrop')
const title = fc
  .string({ unit: 'grapheme-ascii', minLength: 1, maxLength: 30 })
  .map((s) => s.replace(/\s+/g, ' ').trim())
  .filter((s) => s.length > 0)

const scenario = fc.record({ items: content, actions, closeVia, title })

/** Renders one child; each gets a unique accessible name so axe stays quiet. */
function renderItem(item: { kind: FocusableKind | DistractorKind }, index: number): ReactNode {
  const key = `item-${index}`
  const name = `Item ${index}`
  switch (item.kind) {
    case 'button':
      return <button key={key} type="button">{name}</button>
    case 'input':
      return <input key={key} type="text" aria-label={name} />
    case 'textarea':
      return <textarea key={key} aria-label={name} />
    case 'select':
      return (
        <select key={key} aria-label={name}>
          <option value="a">A</option>
        </select>
      )
    case 'link':
      return <a key={key} href="/somewhere">{name}</a>
    case 'tabindex0':
      return <div key={key} role="button" tabIndex={0} aria-label={name} />
    case 'disabledButton':
      return <button key={key} type="button" disabled>{name}</button>
    case 'disabledInput':
      return <input key={key} type="text" disabled aria-label={name} />
    case 'anchorNoHref':
      return createElement('a', { key }, name)
    case 'tabindexMinus1':
      return <div key={key} tabIndex={-1}>{name}</div>
    case 'text':
      return <span key={key}>{name}</span>
  }
}

function Harness({ items, dialogTitle }: { items: Array<{ kind: FocusableKind | DistractorKind }>; dialogTitle: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open dialog
      </button>
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title={dialogTitle}>
        {items.map(renderItem)}
      </Dialog>
    </>
  )
}

describe('Dialog property', () => {
  it(
    'keeps focus inside while open and returns it to the trigger on close [SC 2.4.3, 4.1.2]',
    async () => {
      await checkProperty(scenario, async (c) => {
        // The app root is what Dialog makes inert; mimic index.html.
        const root = document.createElement('div')
        root.id = 'root'
        document.body.appendChild(root)
        const user = userEvent.setup({ delay: null })
        const { unmount, baseElement } = render(<Harness items={c.items} dialogTitle={c.title} />, { container: root })
        try {
          const trigger = within(root).getByRole('button', { name: 'Open dialog' })
          await user.click(trigger)
          expect(trigger).toHaveFocus()

          const panel = await screen.findByRole('dialog')
          // Focus moves into the dialog before the first action (REQ-5.7).
          await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))

          // Open dialog semantics and axe (REQ-5.10).
          expect(panel.getAttribute('role')).toBe('dialog')
          expect(panel.getAttribute('aria-modal')).toBe('true')
          expect(computeAccessibleName(panel)).toBe(c.title)
          expect(await axe(baseElement)).toHaveNoViolations()

          for (const [step, action] of c.actions.entries()) {
            if (action === 'Tab') await user.keyboard('{Tab}')
            else if (action === 'Shift+Tab') await user.keyboard('{Shift>}{Tab}{/Shift}')
            else await user.click(panel)
            expect(
              panel.contains(document.activeElement),
              `focus left the dialog after action ${step + 1} (${action}); active element: ${document.activeElement?.outerHTML}`,
            ).toBe(true)
          }

          // Close by the generated method (REQ-5.8, 5.9).
          if (c.closeVia === 'escape') await user.keyboard('{Escape}')
          else if (c.closeVia === 'closeButton') await user.click(within(panel).getByRole('button', { name: 'Close dialog' }))
          else await user.click(screen.getByTestId('dialog-backdrop'))

          await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
          expect(trigger).toHaveFocus()
          expect(root.hasAttribute('inert')).toBe(false)
        } finally {
          unmount()
          root.remove()
          // Leave no portal nodes or inert attributes behind (REQ-1.9).
          document.body.replaceChildren()
        }
      })
    },
    60_000,
  )
})
