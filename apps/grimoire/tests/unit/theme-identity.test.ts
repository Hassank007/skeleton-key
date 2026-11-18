import { describe, expect, it } from 'vitest'
import { THEMES, type ColorMap } from './support/theme-tokens'
import { hueOf } from './support/hue'

/** The colour tokens the skeleton defines. Grimoire may change values, never this list (REQ-11.1). */
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
].sort()

const SKELETON_PURPLES = [
  '#f5f0ff', '#ede5ff', '#6b21a8', '#581c87', '#7c3aed', '#4f46e5',
  '#c084fc', '#9333ea', '#a78bfa', '#818cf8', '#0f0a1a', '#1e1030',
]

/** Tokens whose hue must be in the warm band. */
const WARM_TOKENS = ['--color-surface', '--color-accent', '--color-link', '--color-border']
const WARM_MIN = 0
const WARM_MAX = 45

/** Returns a message per token outside the warm band. */
function findOutOfBand(theme: string, colors: ColorMap): string[] {
  const out: string[] = []
  for (const token of WARM_TOKENS) {
    const hue = hueOf(colors[token])
    if (hue < WARM_MIN || hue > WARM_MAX) {
      out.push(`[${theme}] ${token} (${colors[token]}) has hue ${hue.toFixed(0)}°, needs ${WARM_MIN}° to ${WARM_MAX}°`)
    }
  }
  return out
}

/** Returns a message per token that still holds a skeleton purple. */
function findPurples(theme: string, colors: ColorMap): string[] {
  return Object.entries(colors)
    .filter(([, value]) => SKELETON_PURPLES.includes(value.toLowerCase()))
    .map(([token, value]) => `[${theme}] ${token} still has the skeleton purple ${value}`)
}

describe('Grimoire theme identity', () => {
  for (const [theme, colors] of Object.entries(THEMES)) {
    it(`${theme}: has exactly the skeleton's colour tokens [SC 1.4.3]`, () => {
      expect(Object.keys(colors).sort()).toEqual(SKELETON_TOKENS)
    })

    it(`${theme}: surface, accent, link and border are in the warm band`, () => {
      expect(findOutOfBand(theme, colors)).toEqual([])
    })

    it(`${theme}: no token keeps a skeleton purple value`, () => {
      expect(findPurples(theme, colors)).toEqual([])
    })
  }

  describe('negative controls', () => {
    const purple: ColorMap = { ...THEMES.light, '--color-link': '#6b21a8', '--color-accent': '#7c3aed' }

    it('reports a purple token by name', () => {
      const found = findPurples('control', purple)
      expect(found.some((m) => m.includes('--color-link'))).toBe(true)
      expect(found.some((m) => m.includes('--color-accent'))).toBe(true)
    })

    it('reports a cool token outside the warm band by name', () => {
      const found = findOutOfBand('control', purple)
      expect(found.some((m) => m.includes('--color-link'))).toBe(true)
    })
  })
})
