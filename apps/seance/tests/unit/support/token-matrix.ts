/**
 * Allow-list of colour pairs the components actually render (design.md, "Token matrix").
 * Derived from `grep "var(--color-" src/**\/*.css`; each entry names the WCAG criterion it protects.
 * Only pairs that appear on screen are listed: "all tokens on all tokens" would give false failures.
 */
import { contrastRatio } from './contrast'
import type { ColorMap } from './theme-tokens'

export interface MatrixEntry {
  /** Foreground token. */
  fg: string
  /** Background tokens the foreground may be drawn on. */
  on: string[]
  /** Required minimum contrast ratio: 4.5 for text, 3 for UI components and focus rings. */
  min: 4.5 | 3
  criterion: '1.4.3' | '1.4.11'
  /** Where the pair is used (component CSS). */
  use: string
}

const SURFACES = ['--color-surface', '--color-surface-raised']
const ACCENTS = ['--color-accent', '--color-accent-hover']

export const MATRIX: MatrixEntry[] = [
  { fg: '--color-text', on: SURFACES, min: 4.5, criterion: '1.4.3', use: 'body text, dialog title and body, labels, toast, tab label (selected/hover), header' },
  { fg: '--color-text-muted', on: SURFACES, min: 4.5, criterion: '1.4.3', use: 'hints, footer, inactive tabs, dialog description, toast secondary text' },
  { fg: '--color-link', on: SURFACES, min: 4.5, criterion: '1.4.3', use: 'AppLink, skip link, secondary and ghost button text' },
  { fg: '--color-link-hover', on: SURFACES, min: 4.5, criterion: '1.4.3', use: 'AppLink hover, secondary and ghost button hover text' },
  { fg: '--color-error', on: SURFACES, min: 4.5, criterion: '1.4.3', use: 'Field error text' },
  { fg: '--color-success', on: SURFACES, min: 4.5, criterion: '1.4.3', use: 'success status text (reserved by the palette)' },
  { fg: '--color-warning', on: SURFACES, min: 4.5, criterion: '1.4.3', use: 'warning status text (reserved by the palette)' },
  { fg: '--color-text-on-accent', on: ACCENTS, min: 4.5, criterion: '1.4.3', use: 'primary button label, normal and hover' },
  { fg: '--color-border', on: SURFACES, min: 3, criterion: '1.4.11', use: 'borders of dialog, toast, header, footer, tab list, skip link, secondary button' },
  { fg: '--color-focus-ring', on: SURFACES, min: 3, criterion: '1.4.11', use: '3px focus outline on links, buttons, tabs, dialog controls, toast, skip link' },
  { fg: '--color-accent', on: SURFACES, min: 3, criterion: '1.4.11', use: 'tab underline, primary button fill, decorative art; never text' },
]

/** Tokens that are not a foreground in the matrix, each with the reason. */
export const EXEMPT: Record<string, string> = {
  '--color-surface': 'background only; checked as the `on` side of every pair',
  '--color-surface-raised': 'background only; checked as the `on` side of every pair',
  '--color-accent-hover': 'only a background for --color-text-on-accent (primary button hover); 2.79:1 on a surface in dark mode, never drawn there',
}

export interface PairFailure {
  theme: string
  fg: string
  fgValue: string
  bg: string
  bgValue: string
  ratio: number
  min: number
  message: string
}

/** Formats the failure message required by REQ-3.12. */
export function describeFailure(f: Omit<PairFailure, 'message'>): string {
  return (
    `[${f.theme}] ${f.fg} (${f.fgValue}) on ${f.bg} (${f.bgValue}) is ${f.ratio.toFixed(2)}:1, ` +
    `needs at least ${f.min}:1`
  )
}

/** Checks every matrix pair against one theme's colour map and returns the failing pairs. */
export function findFailures(theme: string, colors: ColorMap, matrix: MatrixEntry[]): PairFailure[] {
  const failures: PairFailure[] = []
  for (const entry of matrix) {
    for (const bg of entry.on) {
      const fgValue = colors[entry.fg]
      const bgValue = colors[bg]
      const ratio = contrastRatio(fgValue, bgValue)
      if (ratio < entry.min) {
        const partial = { theme, fg: entry.fg, fgValue, bg, bgValue, ratio, min: entry.min }
        failures.push({ ...partial, message: describeFailure(partial) })
      }
    }
  }
  return failures
}
