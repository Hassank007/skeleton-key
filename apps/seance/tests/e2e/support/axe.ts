import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import AxeBuilder from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'
import type { AxeResults } from 'axe-core'

/** The WCAG tag sets every page scan runs with. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Where scan files go: `evidence/axe/` next to the Playwright config (never `outputDir`, which Playwright empties). */
export function axeEvidenceDir(configFile: string | undefined): string {
  return path.join(configFile ? path.dirname(configFile) : process.cwd(), 'evidence', 'axe')
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/**
 * Accessibility guarantee: every page-level axe scan is recorded as evidence for the ACR generator,
 * before the caller asserts on it, so a failing scan is also on record. Only ids, tags and node counts are
 * written (no HTML or selectors). The caller still asserts `results.violations` is empty.
 */
export async function scanPage(page: Page, testInfo: TestInfo, label?: string): Promise<AxeResults> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

  const colorScheme = await page.evaluate(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  const scan = {
    schema: 1,
    axeVersion: results.testEngine.version,
    url: new URL(results.url).pathname,
    colorScheme,
    tags: WCAG_TAGS,
    violations: results.violations.map((v) => ({ id: v.id, impact: v.impact ?? null, tags: v.tags, nodes: v.nodes.length })),
    passes: results.passes.map((p) => ({ id: p.id, tags: p.tags })),
    incomplete: results.incomplete.map((i) => ({ id: i.id, tags: i.tags, nodes: i.nodes.length })),
    inapplicable: results.inapplicable.map((i) => i.id),
  }

  const dir = axeEvidenceDir(testInfo.config.configFile)
  fs.mkdirSync(dir, { recursive: true })
  const base = [testInfo.project.name, slug(testInfo.titlePath.slice(1).join(' ')), label ? slug(label) : '']
    .filter(Boolean)
    .join('-')
  let file = path.join(dir, `${base}.json`)
  for (let n = 2; fs.existsSync(file); n++) file = path.join(dir, `${base}-${n}.json`)
  fs.writeFileSync(file, `${JSON.stringify(scan, null, 2)}\n`, 'utf8')

  return results
}
