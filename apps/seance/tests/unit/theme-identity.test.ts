import { describe, expect, it } from 'vitest'
import { THEMES, type ColorMap } from './support/theme-tokens'
import { hueDistance, hueOf } from './support/hue'
import { GRIMOIRE_DARK, GRIMOIRE_LIGHT, type Palette } from './support/grimoire-palette'

/** The token names the skeleton defines. Seance must not add, remove or rename one (REQ-13.1). */
const SKELETON_TOKENS = [
  '--color-surface',
  '--color-surface-raised',
  '--color-text',
  '--color-text-muted',
  '--color-text-on-accent',
  '--color-link',
  '--color-link-hover',
  '--color-accent',
  '--color-accent-hover',
  '--color-error',
  '--color-success',
  '--color-warning',
  '--color-border',
  '--color-focus-ring',
]

/** Purple values of the skeleton palette. None may survive in Seance (REQ-13.4). */
const SKELETON_PURPLES = [
  '#f5f0ff', '#ede5ff', '#6b21a8', '#581c87', '#7c3aed', '#4f46e5',
  '#c084fc', '#9333ea', '#a78bfa', '#818cf8', '#0f0a1a', '#1e1030',
]

/** Tokens bound to the cool band (REQ-13.3). */
const COOL_TOKENS = ['--color-surface', '--color-surface-raised', '--color-accent', '--color-link', '--color-border']
/** Tokens whose hue must be at least 90 degrees from Grimoire's (REQ-13.4). */
const DISTANT_TOKENS = ['--color-surface', '--color-accent', '--color-link', '--color-border'] as const
const COOL_MIN = 160
const COOL_MAX = 280
const MIN_DISTANCE = 90

const ALL_GRIMOIRE = new Set(
  [...Object.values(GRIMOIRE_LIGHT), ...Object.values(GRIMOIRE_DARK)].map((v) => v.toLowerCase()),
)

/** Each problem is a sentence that names the token. */
export function themeProblems(
  maps: Record<string, ColorMap>,
  grimoire: { light: Palette; dark: Palette },
): string[] {
  const problems: string[] = []
  for (const [source, map] of Object.entries(maps)) {
    const isDark = source !== 'light'
    const rival = isDark ? grimoire.dark : grimoire.light
    const names = Object.keys(map).sort()
    if (names.join() !== [...SKELETON_TOKENS].sort().join()) {
      problems.push(`${source}: token set differs from the skeleton (${names.join(', ')})`)
    }
    for (const [token, value] of Object.entries(map)) {
      if (SKELETON_PURPLES.includes(value)) problems.push(`${source}: ${token} keeps a skeleton purple (${value})`)
      if (ALL_GRIMOIRE.has(value)) problems.push(`${source}: ${token} equals a Grimoire value (${value})`)
    }
    for (const token of COOL_TOKENS) {
      if (!(token in map)) continue
      const hue = hueOf(map[token])
      if (hue < COOL_MIN || hue > COOL_MAX) {
        problems.push(`${source}: ${token} hue ${hue} is outside the cool band ${COOL_MIN} to ${COOL_MAX}`)
      }
    }
    for (const token of DISTANT_TOKENS) {
      if (!(token in map)) continue
      const distance = hueDistance(hueOf(map[token]), hueOf(rival[token]))
      if (distance < MIN_DISTANCE) {
        problems.push(`${source}: ${token} is only ${distance} degrees from Grimoire (needs ${MIN_DISTANCE})`)
      }
    }
  }
  return problems
}

const GRIMOIRE = { light: GRIMOIRE_LIGHT, dark: GRIMOIRE_DARK }

describe('Seance theme identity (Spectral Slate)', () => {
  it('the light theme and both dark sources pass every identity rule', () => {
    expect(themeProblems(THEMES, GRIMOIRE)).toEqual([])
  })

  it('has the same token set as the skeleton in all three sources', () => {
    for (const map of Object.values(THEMES)) expect(Object.keys(map).sort()).toEqual([...SKELETON_TOKENS].sort())
  })

  describe('negative control', () => {
    it('names the token when a skeleton purple is used', () => {
      const bad = { light: { ...THEMES.light, '--color-accent': '#6b21a8' } }
      const problems = themeProblems(bad, GRIMOIRE)
      expect(problems.some((p) => p.includes('--color-accent') && p.includes('skeleton purple'))).toBe(true)
    })

    it('names the token when a Grimoire value is used', () => {
      const bad = { light: { ...THEMES.light, '--color-border': '#8a5a2b' } }
      const problems = themeProblems(bad, GRIMOIRE)
      expect(problems.some((p) => p.includes('--color-border') && p.includes('Grimoire value'))).toBe(true)
    })

    it('names the token when a hue leaves the cool band', () => {
      const bad = { light: { ...THEMES.light, '--color-surface': '#f4ead5' } }
      const problems = themeProblems(bad, GRIMOIRE)
      expect(problems.some((p) => p.includes('--color-surface') && p.includes('cool band'))).toBe(true)
    })

    it('names the token when a token is renamed or missing', () => {
      const { '--color-link': _removed, ...rest } = THEMES.light
      void _removed
      const problems = themeProblems({ light: rest }, GRIMOIRE)
      expect(problems.some((p) => p.includes('token set differs'))).toBe(true)
    })
  })
})
