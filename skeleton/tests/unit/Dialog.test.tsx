import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { useState } from 'react'
import { Dialog } from '../../src/components/Dialog'

// ── Helper: a controlled wrapper that exposes a trigger button ───────────

function DialogWrapper({
  title = 'Confirm action',
  description,
  children = <p>Dialog content here.</p>,
}: {
  title?: string
  description?: string
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open dialog
      </button>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        description={description}
      >
        {children}
      </Dialog>
    </>
  )
}

afterEach(() => {
  // Clean up any inert attributes left on document.body children.
  document.getElementById('root')?.removeAttribute('inert')
})

describe('Dialog', () => {
  it('is not in the DOM when closed', () => {
    render(<DialogWrapper />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders with zero axe violations when open', async () => {
    const user = userEvent.setup()
    const { baseElement } = render(<DialogWrapper />)
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())
    const results = await axe(baseElement)
    expect(results).toHaveNoViolations()
  })

  it('moves focus into the dialog on open [SC 2.4.3]', async () => {
    const user = userEvent.setup()
    render(<DialogWrapper />)
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    // The first focusable element inside is the Close dialog button.
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Close dialog' }),
      )
    })
  })

  it('closes on Escape and returns focus to the trigger [SC 2.1.1, 2.1.2]', async () => {
    const user = userEvent.setup()
    render(<DialogWrapper />)
    const trigger = screen.getByRole('button', { name: 'Open dialog' })
    await user.click(trigger)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('closes via the close button and returns focus to the trigger [SC 2.4.3]', async () => {
    const user = userEvent.setup()
    render(<DialogWrapper />)
    const trigger = screen.getByRole('button', { name: 'Open dialog' })
    await user.click(trigger)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })

  it('traps Tab focus inside the dialog [SC 2.4.3]', async () => {
    const user = userEvent.setup()
    render(
      <DialogWrapper>
        <button type="button">First</button>
        <button type="button">Second</button>
      </DialogWrapper>,
    )
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())

    // keyboard('{Tab}') fires the keydown event that the dialog panel intercepts.
    // Focus starts on Close dialog (first focusable), move to First, then Second,
    // then Tab should wrap back to Close dialog.
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' })
    const firstBtn = screen.getByRole('button', { name: 'First' })
    const secondBtn = screen.getByRole('button', { name: 'Second' })

    // Start at Close dialog (auto-focused on open), Tab to First.
    await waitFor(() => expect(document.activeElement).toBe(closeBtn))
    await user.keyboard('{Tab}')
    expect(document.activeElement).toBe(firstBtn)
    // Tab to Second.
    await user.keyboard('{Tab}')
    expect(document.activeElement).toBe(secondBtn)
    // Tab from last should wrap back to Close dialog.
    await user.keyboard('{Tab}')
    expect(document.activeElement).toBe(closeBtn)
  })

  it('keeps Shift+Tab inside the dialog when the panel itself has focus (property-test counterexample) [SC 2.4.3]', async () => {
    const user = userEvent.setup()
    render(
      <DialogWrapper>
        <button type="button">Item 0</button>
      </DialogWrapper>,
    )
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    const panel = await screen.findByRole('dialog')
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true))

    // Click the panel's padding: focus moves to the panel (tabIndex -1).
    await user.click(panel)
    expect(document.activeElement).toBe(panel)

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Item 0' }))

    await user.click(panel)
    await user.keyboard('{Tab}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' }))
  })

  it('traps Shift+Tab focus inside the dialog [SC 2.4.3]', async () => {
    const user = userEvent.setup()
    render(
      <DialogWrapper>
        <button type="button">Inner</button>
      </DialogWrapper>,
    )
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())

    // Focus starts on Close dialog (first focusable), Shift+Tab should wrap to Inner (last).
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' })
    const innerBtn = screen.getByRole('button', { name: 'Inner' })
    await waitFor(() => expect(document.activeElement).toBe(closeBtn))
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(document.activeElement).toBe(innerBtn)
  })

  it('has role="dialog", aria-modal, and aria-labelledby pointing to the title [SC 4.1.2]', async () => {
    const user = userEvent.setup()
    render(<DialogWrapper title="Delete file" />)
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const labelId = dialog.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    const heading = document.getElementById(labelId!)
    expect(heading?.textContent).toBe('Delete file')
  })
})
