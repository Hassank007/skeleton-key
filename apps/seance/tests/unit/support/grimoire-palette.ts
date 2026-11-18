/**
 * Grimoire's palette, copied as constants from `.kiro/specs/grimoire/design.md` section 6 (6.1 light, 6.2 dark).
 * Seance is a standalone project and must not import from `apps/grimoire`. The theme identity test
 * compares Seance against these values so the two apps cannot drift towards each other.
 */
export type PaletteKey =
  | '--color-surface'
  | '--color-surface-raised'
  | '--color-accent'
  | '--color-link'
  | '--color-border'
  | '--color-focus-ring'
  | '--color-error'
  | '--color-success'
  | '--color-warning'

export type Palette = Record<PaletteKey, string>

export const GRIMOIRE_LIGHT: Palette = {
  '--color-surface': '#f4ead5',
  '--color-surface-raised': '#e9dbbd',
  '--color-accent': '#8a1c1c',
  '--color-link': '#8a1c1c',
  '--color-border': '#8a5a2b',
  '--color-focus-ring': '#0b4f6c',
  '--color-error': '#9b1c1c',
  '--color-success': '#1f5f2e',
  '--color-warning': '#8a4b00',
}

export const GRIMOIRE_DARK: Palette = {
  '--color-surface': '#130d08',
  '--color-surface-raised': '#241810',
  '--color-accent': '#b45309',
  '--color-link': '#f0b45a',
  '--color-border': '#c58b4e',
  '--color-focus-ring': '#7dd3fc',
  '--color-error': '#ff9d8f',
  '--color-success': '#9be39b',
  '--color-warning': '#ffd166',
}
