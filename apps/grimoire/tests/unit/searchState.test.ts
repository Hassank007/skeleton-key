import { describe, expect, it } from 'vitest'
import { isActive, parseQuery, toSearchParams } from '../../src/lib/searchState'

describe('parseQuery', () => {
  it('reads q, schools and hazards', () => {
    const s = parseQuery(new URLSearchParams('q=ember&school=alchemy&school=warding&hazard=mild'))
    expect(s).toEqual({ q: 'ember', schools: ['Warding', 'Alchemy'], hazards: ['Mild'] })
  })

  it('drops unknown school and hazard values', () => {
    const s = parseQuery(new URLSearchParams('school=pyromancy&school=illusion&hazard=deadly&hazard=forbidden'))
    expect(s.schools).toEqual(['Illusion'])
    expect(s.hazards).toEqual(['Forbidden'])
  })

  it('caps q at 100 characters', () => {
    expect(parseQuery(new URLSearchParams({ q: 'a'.repeat(250) })).q).toHaveLength(100)
  })

  it('returns an empty state for an empty query', () => {
    expect(parseQuery(new URLSearchParams(''))).toEqual({ q: '', schools: [], hazards: [] })
  })
})

describe('toSearchParams', () => {
  it('omits empty parts', () => {
    expect(toSearchParams({ q: '', schools: [], hazards: [] }).toString()).toBe('')
  })

  it('writes a canonical order: q, schools, hazards', () => {
    const p = toSearchParams({ q: 'ash', schools: ['Alchemy', 'Necromancy'], hazards: ['Forbidden', 'Mild'] })
    expect(p.toString()).toBe('q=ash&school=necromancy&school=alchemy&hazard=mild&hazard=forbidden')
  })

  it('caps q at 100 characters', () => {
    expect(toSearchParams({ q: 'b'.repeat(150), schools: [], hazards: [] }).get('q')).toHaveLength(100)
  })
})

describe('isActive', () => {
  it('is false for an empty or whitespace-only state', () => {
    expect(isActive({ q: '', schools: [], hazards: [] })).toBe(false)
    expect(isActive({ q: '   ', schools: [], hazards: [] })).toBe(false)
  })
  it('is true when text or a filter is set', () => {
    expect(isActive({ q: 'x', schools: [], hazards: [] })).toBe(true)
    expect(isActive({ q: '', schools: ['Warding'], hazards: [] })).toBe(true)
    expect(isActive({ q: '', schools: [], hazards: ['Mild'] })).toBe(true)
  })
})
