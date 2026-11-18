import { describe, expect, it } from 'vitest'
import { SPIRITS, findSpirit } from '../../src/data/spirits'

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

describe('spirits data', () => {
  it('has exactly four spirits', () => {
    expect(SPIRITS).toHaveLength(4)
  })

  it('has unique ids', () => {
    const ids = SPIRITS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  for (const s of SPIRITS) {
    it(`${s.id}: kebab-case id, required fields, blurb of at most 140 characters`, () => {
      expect(s.id, `id ${s.id}`).toMatch(KEBAB)
      for (const key of ['name', 'blurb', 'speciality'] as const) {
        expect(typeof s[key], `${s.id}.${key}`).toBe('string')
        expect(s[key].trim().length, `${s.id}.${key} is empty`).toBeGreaterThan(0)
      }
      expect(s.blurb.length, `${s.id} blurb is ${s.blurb.length} characters`).toBeLessThanOrEqual(140)
    })
  }

  it('findSpirit returns a spirit by id and undefined otherwise', () => {
    expect(findSpirit(SPIRITS[0].id)).toBe(SPIRITS[0])
    expect(findSpirit('nobody')).toBeUndefined()
  })
})
