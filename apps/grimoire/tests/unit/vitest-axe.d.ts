/**
 * Extend @vitest/expect Matchers with vitest-axe's toHaveNoViolations.
 * vitest-axe v0.1.0 augments the deprecated Vi namespace; this file bridges it
 * to the @vitest/expect Matchers interface used by vitest v3.
 */
import type { AxeMatchers } from 'vitest-axe/matchers'

declare module '@vitest/expect' {
  interface Matchers<R = void> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
