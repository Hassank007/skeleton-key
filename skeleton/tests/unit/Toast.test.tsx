import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { ToastProvider, useToast } from '../../src/components/Toast'
import { AnnouncerContext } from '../../src/contexts/AnnouncerContext'
import { MotionProvider } from '../../src/contexts/MotionContext'

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Provider tree for Toast tests.
 * Uses a synchronous announce stub so userEvent doesn't hang on microtask chains.
 */
function Providers({ children }: { children: React.ReactNode }) {
  const announce = vi.fn()
  return (
    <MotionProvider>
      <AnnouncerContext.Provider value={announce}>
        <ToastProvider>{children}</ToastProvider>
      </AnnouncerContext.Provider>
    </MotionProvider>
  )
}

/** A button that fires a toast when clicked. */
function ToastTrigger({ message, duration }: { message: string; duration?: number }) {
  const { addToast } = useToast()
  return (
    <button type="button" onClick={() => addToast(message, { duration })}>
      Show toast
    </button>
  )
}

describe('Toast', () => {
  it('shows a toast message when triggered', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ToastTrigger message="Saved successfully" />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Show toast' }))
    expect(screen.getByText('Saved successfully')).toBeDefined()
  })

  it('renders with zero axe violations when a toast is visible', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Providers>
        <ToastTrigger message="File uploaded" />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Show toast' }))
    // Run axe on the container (not baseElement) to avoid landmark issues with
    // visually-hidden live regions outside landmarks in the test DOM.
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('dismiss button is present and has an accessible name', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ToastTrigger message="Profile updated" />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Show toast' }))
    const dismissBtn = screen.getByRole('button', { name: /Dismiss: Profile updated/i })
    expect(dismissBtn).toBeDefined()
  })

  it('dismiss button removes the toast', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ToastTrigger message="Item deleted" />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Show toast' }))
    expect(screen.getByText('Item deleted')).toBeDefined()
    await user.click(screen.getByRole('button', { name: /Dismiss: Item deleted/i }))
    await waitFor(() => expect(screen.queryByText('Item deleted')).toBeNull())
  })

  /**
   * Verifies auto-dismiss fires after the timer threshold.
   * Uses fake timers scoped to this test so we don't wait 5 real seconds.
   */
  it('auto-dismisses after the minimum 5 s duration', async () => {
    vi.useFakeTimers()
    try {
      // Use real microtasks for React reconciliation but fake macrotask timers.
      render(
        <Providers>
          <ToastTrigger message="Auto gone" duration={5000} />
        </Providers>,
      )
      // Click directly (not via userEvent) to avoid userEvent's internal timer management.
      screen.getByRole('button', { name: 'Show toast' }).click()
      // Allow React to flush state updates.
      await Promise.resolve()
      expect(screen.getByText('Auto gone')).toBeDefined()

      // Advance past the 5 s threshold to trigger auto-dismiss.
      await act(async () => {
        vi.advanceTimersByTime(5001)
      })
      expect(screen.queryByText('Auto gone')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('dismiss button is keyboard-operable (Enter key)', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ToastTrigger message="Keyboard dismiss" />
      </Providers>,
    )
    await user.click(screen.getByRole('button', { name: 'Show toast' }))
    const dismissBtn = screen.getByRole('button', { name: /Dismiss: Keyboard dismiss/i })
    dismissBtn.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.queryByText('Keyboard dismiss')).toBeNull())
  })

  it('the notification region does not steal focus when a toast appears', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ToastTrigger message="No focus steal" />
      </Providers>,
    )
    const trigger = screen.getByRole('button', { name: 'Show toast' })
    trigger.focus()
    await user.click(trigger)
    // Focus must remain on the trigger, not jump to the toast region.
    expect(document.activeElement).toBe(trigger)
  })
})
