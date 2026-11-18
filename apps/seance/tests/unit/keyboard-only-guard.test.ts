/** The two keyboard specs may drive the page only with page.keyboard (REQ-16.1, WCAG 2.1.1). */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const E2E = path.resolve(__dirname, '../e2e')
const FILES = ['booking-happy.keyboard.spec.ts', 'booking-errors.keyboard.spec.ts']
const FORBIDDEN = /\.(click|fill|check|selectOption|dispatchEvent|focus)\s*\(/g

/** Returns the forbidden calls in a source text (comments and strings of prose are not code, so comments are removed first). */
export function forbiddenCalls(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  return [...code.matchAll(FORBIDDEN)].map((m) => m[0])
}

describe('keyboard-only guard', () => {
  for (const file of FILES) {
    it(`${file} exists and uses no click, fill, check, selectOption, dispatchEvent or focus call [SC 2.1.1]`, () => {
      const source = fs.readFileSync(path.join(E2E, file), 'utf8')
      expect(source).toContain('page.keyboard')
      expect(forbiddenCalls(source)).toEqual([])
    })
  }

  describe('negative control', () => {
    it('catches each forbidden call in a sample', () => {
      for (const call of ['click', 'fill', 'check', 'selectOption', 'dispatchEvent', 'focus']) {
        expect(forbiddenCalls(`await page.locator('#x').${call}()`), call).toHaveLength(1)
      }
    })
    it('allows keyboard calls, assertions such as toBeFocused, and commented-out calls', () => {
      const ok = "await page.keyboard.press('Tab')\nawait expect(a).toBeFocused()\nawait expect(b).toBeChecked()\n// await x.click()"
      expect(forbiddenCalls(ok)).toEqual([])
    })
  })
})