import '@testing-library/jest-dom'
import { expect, vi } from 'vitest'
import * as axeMatchers from 'vitest-axe/matchers'

// Register vitest-axe matchers (toHaveNoViolations) with vitest's expect.
// vitest-axe v0.1.0 ships an empty extend-expect.js, so we register via the
// matchers subpath as the README recommends.
expect.extend(axeMatchers)

// ── jsdom shims ──────────────────────────────────────────────────────────────

// jsdom does not implement window.matchMedia; stub it so MotionContext works.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// jsdom does not implement ResizeObserver; stub it so PageShell works.
class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
// In jsdom, window is the global object.
window.ResizeObserver = ResizeObserverStub
