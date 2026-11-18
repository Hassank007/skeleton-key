import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(__dirname, '../../src')

/** Every CSS file under `dir` as raw text (read from disk, so CSS-module processing cannot change it). */
function readCss(dir: string, out: Record<string, string> = {}): Record<string, string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (full !== path.join(SRC, 'tokens')) readCss(full, out)
    } else if (entry.name.endsWith('.css')) {
      out[`src/${path.relative(SRC, full).replace(/\\/g, '/')}`] = fs.readFileSync(full, 'utf8')
    }
  }
  return out
}

/** Every CSS file in src, as raw text, except the token files (REQ-11.6). */
const FILES = readCss(SRC)

const NAMED = [
  'red', 'blue', 'green', 'black', 'white', 'gray', 'grey', 'purple', 'orange', 'yellow', 'pink', 'brown',
  'crimson', 'teal', 'navy', 'gold', 'silver', 'cyan', 'magenta', 'maroon', 'olive', 'lime', 'indigo', 'violet',
  'tan', 'beige', 'ivory', 'coral', 'salmon', 'khaki',
]

/** Matches a colour value in a declaration: hex, rgb(a), hsl(a), or a named colour as a whole value word. */
const HEX = /#[0-9a-fA-F]{3,8}\b/
const FUNC = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i
const NAMED_RE = new RegExp(`(?:^|[\\s:,(])(?:${NAMED.join('|')})(?=[\\s;,)!]|$)`, 'i')

/** Returns the offending lines of one CSS text (comments removed first). */
export function findColourLiterals(css: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  const hits: string[] = []
  stripped.split('\n').forEach((line, i) => {
    // Only look inside declarations: `prop: value`. Selectors and at-rules are skipped.
    const decl = line.match(/^\s*[a-z-]+\s*:\s*(.+)$/i)
    if (!decl) return
    const value = decl[1].replace(/var\([^)]*\)/g, '')
    if (HEX.test(value) || FUNC.test(value) || NAMED_RE.test(` ${value}`)) hits.push(`line ${i + 1}: ${line.trim()}`)
  })
  return hits
}

describe('components use colour tokens only', () => {
  it('finds at least one component CSS file to scan', () => {
    expect(Object.keys(FILES).length).toBeGreaterThan(0)
  })

  for (const [file, css] of Object.entries(FILES)) {
    it(`${file} has no hex, rgb, hsl or named colour [SC 1.4.3]`, () => {
      expect(findColourLiterals(css)).toEqual([])
    })
  }

  describe('negative control', () => {
    it('catches a hex colour', () => {
      expect(findColourLiterals('.a {\n  color: #fff;\n}')).toHaveLength(1)
    })
    it('catches rgb(), hsl() and a named colour', () => {
      expect(findColourLiterals('.a {\n  color: rgb(1, 2, 3);\n}')).toHaveLength(1)
      expect(findColourLiterals('.a {\n  background: hsl(10 20% 30%);\n}')).toHaveLength(1)
      expect(findColourLiterals('.a {\n  border: 1px solid red;\n}')).toHaveLength(1)
    })
    it('allows tokens, transparent, currentColor and commented-out colours', () => {
      const ok = '.a {\n  color: var(--color-text);\n  background: transparent;\n  border-color: currentColor;\n  /* color: #fff; */\n}'
      expect(findColourLiterals(ok)).toEqual([])
    })
  })
})
