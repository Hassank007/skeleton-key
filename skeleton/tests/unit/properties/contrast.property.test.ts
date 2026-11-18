/**
 * Invariant: every colour pair the components render meets its WCAG minimum
 * (4.5:1 text, 3:1 UI) in the light theme and in both dark theme sources.
 * Exhaustive over the token matrix, not sampled. See .kiro/specs/a11y-pbt/design.md, "Property 1: Contrast".
 */
import { describe, expect, it } from 'vitest'
import lightCss from '../../../src/tokens/tokens.css?raw'
import darkCss from '../../../src/tokens/dark.css?raw'
import { COLOR_TOKENS, THEMES, buildThemes, type ThemeName } from '../support/theme-tokens'
import { EXEMPT, MATRIX, describeFailure, findFailures, type MatrixEntry } from '../support/token-matrix'
import { contrastRatio } from '../support/contrast'

const themeNames = Object.keys(THEMES) as ThemeName[]
const cases = themeNames.flatMap((theme) =>
  MATRIX.flatMap((entry) => entry.on.map((bg) => ({ theme, entry, bg }))),
)

describe('contrast property: every theme pair', () => {
  it.each(cases)('$theme: $entry.fg on $bg', ({ theme, entry, bg }) => {
    const colors = THEMES[theme]
    const ratio = contrastRatio(colors[entry.fg], colors[bg])
    const message = describeFailure({
      theme,
      fg: entry.fg,
      fgValue: colors[entry.fg],
      bg,
      bgValue: colors[bg],
      ratio,
      min: entry.min,
    })
    expect(ratio, message).toBeGreaterThanOrEqual(entry.min)
  })

  it('covers every pair for every theme', () => {
    const pairsPerTheme = MATRIX.reduce((n, e) => n + e.on.length, 0)
    expect(cases).toHaveLength(pairsPerTheme * themeNames.length)
    expect(themeNames).toEqual(['light', 'dark-media', 'dark-attr'])
  })

  it('has the required text and UI pairs on both surfaces (REQ-3.8, 3.9)', () => {
    const find = (fg: string) => MATRIX.find((e) => e.fg === fg)
    for (const fg of ['--color-text', '--color-text-muted', '--color-link', '--color-link-hover', '--color-error', '--color-success', '--color-warning']) {
      expect(find(fg)?.on, fg).toEqual(['--color-surface', '--color-surface-raised'])
      expect(find(fg)?.min, fg).toBe(4.5)
    }
    expect(find('--color-text-on-accent')?.on).toEqual(['--color-accent', '--color-accent-hover'])
    expect(find('--color-text-on-accent')?.min).toBe(4.5)
    for (const fg of ['--color-border', '--color-focus-ring', '--color-accent']) {
      expect(find(fg)?.on, fg).toEqual(['--color-surface', '--color-surface-raised'])
      expect(find(fg)?.min, fg).toBe(3)
    }
  })

  it('has identical values in both dark theme sources (REQ-3.4)', () => {
    for (const token of COLOR_TOKENS) {
      expect(THEMES['dark-attr'][token], `${token} differs between the dark sources`).toBe(
        THEMES['dark-media'][token],
      )
    }
  })

  it('has every declared colour token in the matrix or the exemption list (REQ-3.10)', () => {
    const known = new Set([...MATRIX.map((e) => e.fg), ...Object.keys(EXEMPT)])
    for (const token of COLOR_TOKENS) {
      expect(known.has(token), `${token} is in neither MATRIX nor EXEMPT`).toBe(true)
    }
    for (const token of Object.keys(EXEMPT)) {
      expect(EXEMPT[token].length, `${token} needs a written reason`).toBeGreaterThan(0)
    }
    for (const entry of MATRIX) {
      expect(entry.use.length, `${entry.fg} needs a use`).toBeGreaterThan(0)
    }
  })

  it('reports a pair below the minimum (negative control, REQ-3.11)', () => {
    const synthetic = {
      '--color-text': '#777777',
      '--color-surface': '#ffffff',
    }
    const matrix: MatrixEntry[] = [
      { fg: '--color-text', on: ['--color-surface'], min: 4.5, criterion: '1.4.3', use: 'synthetic' },
    ]
    const failures = findFailures('synthetic', synthetic, matrix)
    expect(failures).toHaveLength(1)
    expect(failures[0].message).toBe(
      '[synthetic] --color-text (#777777) on --color-surface (#ffffff) is 4.48:1, needs at least 4.5:1',
    )
  })

  it('finds no failures in the real themes', () => {
    for (const theme of themeNames) {
      expect(findFailures(theme, THEMES[theme], MATRIX).map((f) => f.message)).toEqual([])
    }
  })

  it('fails and names the token and source for a missing or non-hex token (REQ-3.3)', () => {
    const dropped = darkCss.replace(/--color-warning:[^;]+;/, '')
    expect(() => buildThemes(lightCss, dropped)).toThrow(/--color-warning.*missing/)
    const nonHex = lightCss.replace(/--color-error:\s*#[0-9a-fA-F]+/, '--color-error: red')
    expect(() => buildThemes(nonHex, darkCss)).toThrow(/--color-error.*tokens\.css.*not a hex/)
  })
})
