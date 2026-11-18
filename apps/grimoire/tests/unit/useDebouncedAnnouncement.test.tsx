import { StrictMode, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { AnnouncerProvider } from '../../src/contexts/AnnouncerContext'
import { useDebouncedAnnouncement } from '../../src/hooks/useDebouncedAnnouncement'

const polite = () => document.querySelector('[aria-live="polite"]')!.textContent
const assertive = () => document.querySelector('[aria-live="assertive"]')!.textContent

function wrapper({ children }: { children: ReactNode }) {
  return <AnnouncerProvider>{children}</AnnouncerProvider>
}

function setup(initial: { message: string; key: string }, wrap = wrapper) {
  return renderHook((p: { message: string; key: string }) => useDebouncedAnnouncement(p.message, p.key), {
    initialProps: initial,
    wrapper: wrap,
  })
}

describe('useDebouncedAnnouncement [SC 4.1.3]', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('says nothing on first render', async () => {
    setup({ message: '24 spellbooks found', key: '' })
    await vi.advanceTimersByTimeAsync(2000)
    expect(polite()).toBe('')
  })

  it('says nothing on first render in StrictMode (double effect run)', async () => {
    const strict = ({ children }: { children: ReactNode }) => (
      <StrictMode>
        <AnnouncerProvider>{children}</AnnouncerProvider>
      </StrictMode>
    )
    setup({ message: '24 spellbooks found', key: '' }, strict)
    await vi.advanceTimersByTimeAsync(2000)
    expect(polite()).toBe('')
  })

  it('says nothing at 499 ms and one message at 500 ms', async () => {
    const { rerender } = setup({ message: '24 spellbooks found', key: '' })
    rerender({ message: '3 spellbooks found', key: 'q=ash' })
    await vi.advanceTimersByTimeAsync(499)
    expect(polite()).toBe('')
    await vi.advanceTimersByTimeAsync(1)
    expect(polite()).toBe('3 spellbooks found')
  })

  it('announces only the last value after rapid changes', async () => {
    const { rerender } = setup({ message: '24 spellbooks found', key: '' })
    rerender({ message: '10 spellbooks found', key: 'q=a' })
    await vi.advanceTimersByTimeAsync(300)
    rerender({ message: '4 spellbooks found', key: 'q=as' })
    await vi.advanceTimersByTimeAsync(300)
    rerender({ message: '2 spellbooks found', key: 'q=ash' })
    await vi.advanceTimersByTimeAsync(499)
    expect(polite()).toBe('')
    await vi.advanceTimersByTimeAsync(1)
    expect(polite()).toBe('2 spellbooks found')
  })

  it('sends exactly one message per settled change', async () => {
    const { rerender } = setup({ message: 'first', key: '' })
    const spy = vi.spyOn(document.querySelector('[aria-live="polite"]')!, 'textContent', 'set')
    rerender({ message: 'second', key: 'a' })
    await vi.advanceTimersByTimeAsync(2000)
    // The announcer clears, then writes: one clear and one message.
    expect(spy.mock.calls.filter(([v]) => v === 'second')).toHaveLength(1)
  })

  it('says nothing after unmount', async () => {
    const { rerender, unmount } = setup({ message: '24 spellbooks found', key: '' })
    rerender({ message: '3 spellbooks found', key: 'q=ash' })
    await vi.advanceTimersByTimeAsync(200)
    unmount()
    await vi.advanceTimersByTimeAsync(2000)
    expect(document.querySelector('[aria-live="polite"]')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('never uses the assertive region', async () => {
    const { rerender } = setup({ message: '24 spellbooks found', key: '' })
    rerender({ message: 'No spellbooks found. Try a shorter search or clear some filters.', key: 'q=zzz' })
    await vi.advanceTimersByTimeAsync(500)
    expect(polite()).toBe('No spellbooks found. Try a shorter search or clear some filters.')
    expect(assertive()).toBe('')
  })

  it('announces the same text again after a new change', async () => {
    const { rerender } = setup({ message: '5 spellbooks found', key: 'a' })
    rerender({ message: '5 spellbooks found', key: 'b' })
    await vi.advanceTimersByTimeAsync(500)
    expect(polite()).toBe('5 spellbooks found')
    const region = document.querySelector('[aria-live="polite"]')!
    region.textContent = ''
    rerender({ message: '5 spellbooks found', key: 'c' })
    await vi.advanceTimersByTimeAsync(500)
    expect(polite()).toBe('5 spellbooks found')
  })

  it('does nothing when the key has not changed', async () => {
    const { rerender } = setup({ message: 'x', key: 'same' })
    rerender({ message: 'y', key: 'same' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(polite()).toBe('')
  })
})
