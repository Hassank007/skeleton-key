/**
 * Parses the real token CSS into three colour maps (design.md, "Reading tokens from the real CSS").
 * No colour values are duplicated here: everything is read from tokens.css and dark.css (REQ-3.1).
 */
import lightCss from '../../../src/tokens/tokens.css?raw'
import darkCss from '../../../src/tokens/dark.css?raw'

export type ColorMap = Record<string, string>
export type ThemeName = 'light' | 'dark-media' | 'dark-attr'

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** Reads `--color-*` declarations from one `{ ... }` block body. */
function colorDeclarations(blockBody: string, source: string): ColorMap {
  const map: ColorMap = {}
  for (const match of blockBody.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1]
    const value = match[2].trim()
    if (!HEX.test(value)) {
      throw new Error(`Token ${name} in ${source} is not a hex value: ${JSON.stringify(value)}`)
    }
    map[name] = value.toLowerCase()
  }
  return map
}

/** Returns the body of the first `{ ... }` block whose header starts at `headerNeedle`, searching from `from`. */
function blockBodyAfter(css: string, headerNeedle: string, from = 0): string {
  const start = css.indexOf(headerNeedle, from)
  const open = start === -1 ? -1 : css.indexOf('{', start)
  if (open === -1) throw new Error(`Could not find a block for "${headerNeedle}"`)
  let depth = 1
  let j = open + 1
  for (; j < css.length && depth > 0; j++) {
    if (css[j] === '{') depth++
    else if (css[j] === '}') depth--
  }
  return css.slice(open + 1, j - 1)
}

/** Checks every colour token defined in `light` also exists in `other`. */
function assertCovers(light: ColorMap, other: ColorMap, source: string): void {
  for (const token of Object.keys(light)) {
    if (!(token in other)) {
      throw new Error(`Token ${token} is defined in the light theme but missing from ${source}`)
    }
  }
}

/**
 * Builds the three colour maps from CSS text. Throws, naming the token and the source, on a
 * token missing from a dark source or on a non-hex value (REQ-3.3).
 */
export function buildThemes(tokensCss: string, darkThemeCss: string): Record<ThemeName, ColorMap> {
  const light = colorDeclarations(blockBodyAfter(tokensCss, ':root'), 'tokens.css :root')

  const mediaStart = darkThemeCss.indexOf('@media')
  if (mediaStart === -1) throw new Error('dark.css has no @media block')
  const darkMedia = colorDeclarations(
    blockBodyAfter(darkThemeCss, ':root', mediaStart),
    'dark.css @media (prefers-color-scheme: dark) :root',
  )
  const darkAttr = colorDeclarations(
    blockBodyAfter(darkThemeCss, "[data-theme='dark']"),
    "dark.css [data-theme='dark']",
  )

  assertCovers(light, darkMedia, 'dark via prefers-color-scheme')
  assertCovers(light, darkAttr, "dark via [data-theme='dark']")
  return { light, 'dark-media': darkMedia, 'dark-attr': darkAttr }
}

export const THEMES = buildThemes(lightCss, darkCss)

/** Every colour token declared in any theme source. */
export const COLOR_TOKENS: string[] = [
  ...new Set(Object.values(THEMES).flatMap((map) => Object.keys(map))),
]