import { afterEach, describe, expect, it, vi } from 'vitest'
import fc from 'fast-check'
import { MIN_RUNS, SKIPPED, checkProperty, numRuns, seed } from './pbt'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('pbt helper', () => {
  it('raises FC_NUM_RUNS=5 to the floor of 100', () => {
    vi.stubEnv('FC_NUM_RUNS', '5')
    expect(numRuns()).toBe(100)
  })

  it('uses FC_NUM_RUNS=250 as given', () => {
    vi.stubEnv('FC_NUM_RUNS', '250')
    expect(numRuns()).toBe(250)
  })

  it('defaults to the floor when FC_NUM_RUNS is unset', () => {
    vi.stubEnv('FC_NUM_RUNS', '')
    expect(numRuns()).toBe(MIN_RUNS)
  })

  it('passes FC_SEED through', () => {
    vi.stubEnv('FC_SEED', '12345')
    expect(seed()).toBe(12345)
    vi.stubEnv('FC_SEED', '')
    expect(seed()).toBeUndefined()
  })

  it('runs the same cases for the same seed', async () => {
    vi.stubEnv('FC_SEED', '42')
    const first: number[] = []
    const second: number[] = []
    await checkProperty(fc.integer(), (n) => void first.push(n))
    await checkProperty(fc.integer(), (n) => void second.push(n))
    expect(second).toEqual(first)
  })

  it('fails when most cases are skipped', async () => {
    await expect(checkProperty(fc.integer(), (n) => (n % 10 === 0 ? undefined : SKIPPED))).rejects.toThrow(
      /effective cases/,
    )
  })

  it('reports the seed and counterexample when a property fails', async () => {
    await expect(
      checkProperty(fc.integer({ min: 0, max: 1000 }), (n) => {
        expect(n).toBeLessThan(500)
      }),
    ).rejects.toThrow(/seed/i)
  })
})
