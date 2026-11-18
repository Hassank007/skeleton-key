/**
 * Shared fast-check configuration for the property tests (design.md, "Shared support").
 * Holds the case-count floor, seed handling and the guard against vacuous passes.
 */
import fc from 'fast-check'
import { expect } from 'vitest'

/** Minimum number of effective cases per property. */
export const MIN_RUNS = 100

/** FC_NUM_RUNS can raise the case count, never lower it below MIN_RUNS. */
export function numRuns(): number {
  return Math.max(MIN_RUNS, Number(import.meta.env.FC_NUM_RUNS) || MIN_RUNS)
}

/** FC_SEED, when set, replays a run. */
export function seed(): number | undefined {
  const raw: string | undefined = import.meta.env.FC_SEED
  if (raw === undefined || raw === '') return undefined
  const n = Number(raw)
  return Number.isInteger(n) ? n : undefined
}

/** A predicate may return SKIPPED when a case was vacuous; skipped cases do not count toward the floor. */
export const SKIPPED = 'skipped' as const
export type Outcome = void | typeof SKIPPED

/**
 * Runs `predicate` over cases from `arbitrary`. Failures include the seed, path and shrunk
 * counterexample (verbose reporting). Fails when fewer than MIN_RUNS effective cases ran.
 */
export async function checkProperty<T>(
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => Outcome | Promise<Outcome>,
): Promise<number> {
  let effective = 0
  const property = fc.asyncProperty(arbitrary, async (value) => {
    const outcome = await predicate(value)
    if (outcome !== SKIPPED) effective += 1
  })
  await fc.assert(property, {
    numRuns: numRuns(),
    seed: seed(),
    verbose: fc.VerbosityLevel.Verbose,
  })
  expect(effective, `only ${effective} effective cases ran; at least ${MIN_RUNS} are required`).toBeGreaterThanOrEqual(
    MIN_RUNS,
  )
  return effective
}
