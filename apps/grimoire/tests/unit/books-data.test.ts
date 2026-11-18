import { describe, expect, it } from 'vitest'
import raw from '../../src/data/books.json'
import { BOOKS, HAZARDS, SCHOOLS, findBook, type Book } from '../../src/data/books'

const RAW = raw as unknown as Array<Record<string, unknown>>

/** Runs `check` on each raw record and collects `slug: problem` lines, so a failure names the book. */
function problems(check: (book: Record<string, unknown>) => string | undefined): string[] {
  return RAW.flatMap((b) => {
    const problem = check(b)
    return problem ? [`${String(b.slug)}: ${problem}`] : []
  })
}

describe('books data', () => {
  it('has exactly 24 books [REQ-3.1]', () => {
    expect(RAW).toHaveLength(24)
    expect(BOOKS).toHaveLength(24)
  })

  it('has unique, lower-case, hyphenated slugs', () => {
    expect(problems((b) => (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(b.slug)) ? undefined : 'bad slug format'))).toEqual([])
    const slugs = RAW.map((b) => b.slug)
    expect(slugs.filter((s, i) => slugs.indexOf(s) !== i)).toEqual([])
  })

  it('gives every book the required fields with the right types', () => {
    expect(
      problems((b) => {
        for (const key of ['title', 'author', 'school', 'hazard', 'year', 'summary']) {
          if (typeof b[key] !== 'string' || (b[key] as string).trim() === '') return `missing or empty ${key}`
        }
        if (!Number.isInteger(b.pages) || (b.pages as number) <= 0) return 'pages must be a positive integer'
        if (!SCHOOLS.includes(b.school as Book['school'])) return `unknown school ${String(b.school)}`
        if (!HAZARDS.includes(b.hazard as Book['hazard'])) return `unknown hazard ${String(b.hazard)}`
        return undefined
      }),
    ).toEqual([])
  })

  it('keeps each summary to one sentence of at most 160 characters', () => {
    expect(
      problems((b) => {
        const s = String(b.summary)
        if (s.length > 160) return `summary is ${s.length} characters`
        if ((s.match(/[.!?](\s|$)/g) ?? []).length !== 1) return 'summary must be one sentence'
        return undefined
      }),
    ).toEqual([])
  })

  it('has one to three description paragraphs', () => {
    expect(
      problems((b) => {
        const d = b.description
        if (!Array.isArray(d) || d.length < 1 || d.length > 3) return 'description needs 1 to 3 paragraphs'
        if (d.some((p) => typeof p !== 'string' || p.trim() === '')) return 'empty paragraph'
        return undefined
      }),
    ).toEqual([])
  })

  it('has one to five lower-case single-word tags', () => {
    expect(
      problems((b) => {
        const t = b.tags
        if (!Array.isArray(t) || t.length < 1 || t.length > 5) return 'tags needs 1 to 5 entries'
        if (t.some((x) => typeof x !== 'string' || x !== x.toLowerCase() || /\s/.test(x) || x === '')) return 'tags must be lower-case words'
        return undefined
      }),
    ).toEqual([])
  })

  it('covers every school with at least 3 books and every hazard with at least 5 [REQ-3.3]', () => {
    for (const school of SCHOOLS) {
      expect(BOOKS.filter((b) => b.school === school).length, `school ${school}`).toBeGreaterThanOrEqual(3)
    }
    for (const hazard of HAZARDS) {
      expect(BOOKS.filter((b) => b.hazard === hazard).length, `hazard ${hazard}`).toBeGreaterThanOrEqual(5)
    }
  })

  it('contains the anchor books the e2e tests name', () => {
    expect(findBook('the-lantern-of-small-hours')?.school).toBe('Illusion')
    expect(findBook('ember-and-ash-herbal')?.school).toBe('Herbalism')
    expect(findBook('the-hollow-index')?.school).toBe('Necromancy')
  })

  it('is sorted alphabetically by title', () => {
    const titles = BOOKS.map((b) => b.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'en')))
  })

  it('returns undefined for an unknown slug', () => {
    expect(findBook('no-such-book')).toBeUndefined()
    expect(findBook(undefined)).toBeUndefined()
  })
})
