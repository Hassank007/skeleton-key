import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeBrowser } from '../src/lib/browser.js'
import { findOutlineIssues, pageOutline, type OutlineFacts } from '../src/tools/pageOutline.js'
import { startFixtureServer, type FixtureServer } from './helpers/fixture-server.js'

const good: OutlineFacts = {
  title: 'A page',
  lang: 'en',
  landmarks: [
    { role: 'banner', name: '', selector: 'header' },
    { role: 'navigation', name: 'Primary', selector: 'nav' },
    { role: 'main', name: '', selector: 'main' },
  ],
  headings: [
    { level: 1, text: 'Title', selector: 'h1' },
    { level: 2, text: 'Section', selector: 'h2' },
  ],
}

const ids = (facts: OutlineFacts): string[] => findOutlineIssues(facts).map((i) => i.id)

describe('findOutlineIssues', () => {
  it('finds nothing in a good outline', () => {
    expect(findOutlineIssues(good)).toEqual([])
  })
  it('flags a missing or blank title (2.4.2)', () => {
    expect(findOutlineIssues({ ...good, title: '  ' })).toEqual([expect.objectContaining({ id: 'missing-title', criterion: '2.4.2' })])
  })
  it('flags a missing lang (3.1.1)', () => {
    expect(findOutlineIssues({ ...good, lang: '' })).toEqual([expect.objectContaining({ id: 'missing-lang', criterion: '3.1.1' })])
  })
  it('flags no main and several main landmarks (1.3.1)', () => {
    const noMain = { ...good, landmarks: good.landmarks.filter((l) => l.role !== 'main') }
    expect(ids(noMain)).toEqual(['no-main'])
    const two = { ...good, landmarks: [...good.landmarks, { role: 'main', name: '', selector: 'main:nth-of-type(2)' }] }
    expect(findOutlineIssues(two)).toEqual([
      expect.objectContaining({ id: 'multiple-main', selector: 'main:nth-of-type(2)' }),
    ])
  })
  it('flags navigation landmarks without distinct names (1.3.1)', () => {
    const nav = (name: string, selector: string) => ({ role: 'navigation', name, selector })
    const base = good.landmarks.filter((l) => l.role !== 'navigation')
    expect(ids({ ...good, landmarks: [...base, nav('', 'a'), nav('', 'b')] })).toEqual(['duplicate-nav-name'])
    expect(ids({ ...good, landmarks: [...base, nav('Main', 'a'), nav('main', 'b')] })).toEqual(['duplicate-nav-name'])
    expect(ids({ ...good, landmarks: [...base, nav('Main', 'a'), nav('Footer', 'b')] })).toEqual([])
    expect(ids({ ...good, landmarks: [...base, nav('', 'a')] })).toEqual([])
  })
  it('flags no h1 and several h1 (1.3.1)', () => {
    expect(ids({ ...good, headings: [{ level: 2, text: 'x', selector: 'h2' }] })).toEqual(['no-h1', 'first-heading-not-h1'])
    expect(ids({ ...good, headings: [] })).toEqual(['no-h1'])
    expect(
      ids({ ...good, headings: [{ level: 1, text: 'a', selector: 'a' }, { level: 1, text: 'b', selector: 'b' }] }),
    ).toEqual(['multiple-h1'])
  })
  it('flags a skipped level going down, but not going back up (1.3.1)', () => {
    const h = (level: number, selector: string) => ({ level, text: 't', selector })
    expect(findOutlineIssues({ ...good, headings: [h(1, 'a'), h(2, 'b'), h(4, 'c')] })).toEqual([
      expect.objectContaining({ id: 'skipped-heading-level', selector: 'c' }),
    ])
    expect(ids({ ...good, headings: [h(1, 'a'), h(2, 'b'), h(3, 'c'), h(2, 'd'), h(3, 'e')] })).toEqual([])
    expect(ids({ ...good, headings: [h(1, 'a'), h(2, 'b'), h(3, 'c'), h(4, 'd'), h(2, 'e')] })).toEqual([])
  })
  it('flags an empty heading (2.4.6)', () => {
    expect(
      findOutlineIssues({ ...good, headings: [{ level: 1, text: ' ', selector: 'h1' }] }),
    ).toEqual([expect.objectContaining({ id: 'empty-heading', criterion: '2.4.6', selector: 'h1' })])
  })
  it('returns issues in a fixed order', () => {
    const all = findOutlineIssues({
      title: '',
      lang: '',
      landmarks: [],
      headings: [
        { level: 2, text: '', selector: 'a' },
        { level: 4, text: 'x', selector: 'b' },
      ],
    })
    expect(all.map((i) => i.id)).toEqual([
      'missing-title',
      'missing-lang',
      'no-main',
      'no-h1',
      'first-heading-not-h1',
      'skipped-heading-level',
      'empty-heading',
    ])
  })
})

describe('page_outline in a browser', () => {
  let fixtures: FixtureServer
  beforeAll(async () => {
    fixtures = await startFixtureServer()
  })
  afterAll(async () => {
    await fixtures.close()
    await closeBrowser()
  })

  it('reads the clean fixture', async () => {
    const r = await pageOutline({ url: `${fixtures.baseUrl}/clean.html` })
    expect(r.title).toBe('Clean fixture page')
    expect(r.lang).toBe('en')
    expect(r.landmarks.map((l) => [l.role, l.name])).toEqual([
      ['banner', ''],
      ['navigation', 'Primary'],
      ['main', ''],
      ['contentinfo', ''],
    ])
    expect(r.landmarks.find((l) => l.role === 'main')?.selector).toBe('#main')
    expect(r.headings.map((h) => [h.level, h.text, h.selector])).toEqual([
      [1, 'Clean fixture', '#main > h1'],
      [2, 'Contact form', '#main > h2'],
    ])
    expect(r.issues).toEqual([])
  })

  it('finds every issue in the outline-issues fixture', async () => {
    const r = await pageOutline({ url: `${fixtures.baseUrl}/outline-issues.html` })
    expect(r.title).toBe('')
    expect(r.lang).toBe('')
    expect(r.issues.map((i) => i.id)).toEqual([
      'missing-title',
      'missing-lang',
      'multiple-main',
      'duplicate-nav-name',
      'no-h1',
      'first-heading-not-h1',
      'skipped-heading-level',
      'empty-heading',
    ])
    expect(r.issues.find((i) => i.id === 'multiple-main')?.selector).toBe('#main-b')
    expect(r.issues.find((i) => i.id === 'empty-heading')?.selector).toBe('#empty-heading')
  })

  it('returns equal results for equal input', async () => {
    const url = `${fixtures.baseUrl}/outline-issues.html`
    expect(await pageOutline({ url })).toEqual(await pageOutline({ url }))
  })
})
