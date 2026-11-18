import axe from 'axe-core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { compareCriteria, CRITERIA, criterionFromTag, tagsFor } from '../src/lib/axeTags.js'
import { closeBrowser } from '../src/lib/browser.js'
import { auditPage, type AuditResult } from '../src/tools/auditPage.js'
import { startFixtureServer, type FixtureServer } from './helpers/fixture-server.js'

let fixtures: FixtureServer

beforeAll(async () => {
  fixtures = await startFixtureServer()
})

afterAll(async () => {
  await fixtures.close()
  await closeBrowser()
})

const ruleIdsIn = (result: AuditResult, criterion: string): string[] =>
  result.criteria.find((c) => c.criterion === criterion)?.violations.map((v) => v.ruleId) ?? []

describe('violations fixture', () => {
  let result: AuditResult
  beforeAll(async () => {
    result = await auditPage({ url: `${fixtures.baseUrl}/violations.html`, wcagLevel: 'AA' })
  })

  it('groups violations by criterion and rule id', () => {
    expect(ruleIdsIn(result, '1.1.1')).toContain('image-alt')
    expect(ruleIdsIn(result, '1.4.3')).toContain('color-contrast')
    expect(ruleIdsIn(result, '4.1.2')).toEqual(expect.arrayContaining(['button-name', 'label', 'link-name']))
  })

  it('lists a rule under every criterion it maps to', () => {
    const link = result.criteria.filter((c) => c.violations.some((v) => v.ruleId === 'link-name'))
    expect(link.map((c) => c.criterion)).toEqual(['2.4.4', '4.1.2'])
  })

  it('gives selectors, snippets and a failure summary', () => {
    const img = result.criteria
      .find((c) => c.criterion === '1.1.1')
      ?.violations.find((v) => v.ruleId === 'image-alt')
    expect(img?.nodes[0]?.selector).toBe('#no-alt')
    expect(img?.nodes[0]?.html).toContain('<img')
    expect(img?.nodes[0]?.failureSummary).not.toBe('')
    expect(img?.helpUrl).toMatch(/^https:\/\//)
  })

  it('reports counts, version and level metadata', () => {
    expect(result.wcagLevel).toBe('AA')
    expect(result.tags).toEqual(tagsFor('AA'))
    expect(result.axeVersion).toMatch(/^\d+\.\d+/)
    expect(result.counts.violations).toBeGreaterThanOrEqual(4)
    expect(result.counts.nodes).toBeGreaterThanOrEqual(4)
    expect(result.finalUrl).toBe(result.url)
  })

  it('orders criteria numerically', () => {
    const numbers = result.criteria.map((c) => c.criterion)
    expect([...numbers].sort(compareCriteria)).toEqual(numbers)
  })

  it('returns equal results for equal input', async () => {
    const again = await auditPage({ url: `${fixtures.baseUrl}/violations.html`, wcagLevel: 'AA' })
    expect(again).toEqual(result)
  })
})

describe('clean fixture', () => {
  it('has zero violations and says automation cannot prove conformance', async () => {
    const result = await auditPage({ url: `${fixtures.baseUrl}/clean.html`, wcagLevel: 'AA' })
    expect(result.counts.violations).toBe(0)
    expect(result.criteria).toEqual([])
    expect(result.note).toMatch(/cannot prove conformance/)
  })
})

describe('level tags', () => {
  it('uses the exact tags for each level', () => {
    expect(tagsFor('A')).toEqual(['wcag2a', 'wcag21a'])
    expect(tagsFor('AA')).toEqual(['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    expect(tagsFor('AAA')).toEqual([...tagsFor('AA'), 'wcag2aaa'])
  })
  it('reports the tags that were used', async () => {
    const a = await auditPage({ url: `${fixtures.baseUrl}/clean.html`, wcagLevel: 'A' })
    const aaa = await auditPage({ url: `${fixtures.baseUrl}/clean.html`, wcagLevel: 'AAA' })
    expect(a.tags).toEqual(tagsFor('A'))
    expect(aaa.tags).toEqual(tagsFor('AAA'))
  })
  it('finds fewer problems at level A than at AA on the violations fixture', async () => {
    const a = await auditPage({ url: `${fixtures.baseUrl}/violations.html`, wcagLevel: 'A' })
    expect(ruleIdsIn(a, '1.4.3')).toEqual([])
    expect(ruleIdsIn(a, '1.1.1')).toContain('image-alt')
  })
})

describe('tag to criterion mapping', () => {
  it.each([
    ['wcag111', '1.1.1'],
    ['wcag143', '1.4.3'],
    ['wcag1410', '1.4.10'],
    ['wcag1411', '1.4.11'],
    ['wcag2411', '2.4.11'],
    ['wcag258', '2.5.8'],
  ])('maps %s to %s', (tag, criterion) => {
    expect(criterionFromTag(tag)).toBe(criterion)
  })
  it.each(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'wcag2aaa', 'best-practice', 'cat.aria'])(
    'maps level or other tag %s to null',
    (tag) => {
      expect(criterionFromTag(tag)).toBeNull()
    },
  )
  it("covers every WCAG criterion tag in axe's rule list", () => {
    const tags = new Set(axe.getRules().flatMap((r) => r.tags))
    const criterionTags = [...tags].filter((t) => /^wcag\d{3,4}$/.test(t))
    expect(criterionTags.length).toBeGreaterThan(10)
    for (const tag of criterionTags) {
      const criterion = criterionFromTag(tag)
      expect(criterion, `tag ${tag} is not parsed`).not.toBeNull()
      expect(CRITERIA[criterion ?? ''], `criterion ${criterion ?? ''} (tag ${tag}) is missing from the table`).toBeDefined()
    }
  })
})
