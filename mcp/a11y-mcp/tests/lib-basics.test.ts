import { describe, expect, it } from 'vitest'
import { ToolError, toErrorResult } from '../src/lib/errors.js'
import { truncate } from '../src/lib/text.js'

describe('truncate', () => {
  it('keeps short text unchanged', () => {
    expect(truncate('hello')).toBe('hello')
  })
  it('keeps text of exactly 200 characters', () => {
    expect(truncate('a'.repeat(200))).toBe('a'.repeat(200))
  })
  it('cuts longer text to 200 characters, the last being an ellipsis', () => {
    const out = truncate('a'.repeat(500))
    expect(Array.from(out)).toHaveLength(200)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('toErrorResult', () => {
  it('returns the message of a ToolError with isError set', () => {
    const r = toErrorResult(new ToolError('Bad input'))
    expect(r.isError).toBe(true)
    expect(r.content).toEqual([{ type: 'text', text: 'Bad input' }])
  })
  it('hides details of unknown errors', () => {
    const r = toErrorResult(new Error('secret stack detail'))
    expect(r.isError).toBe(true)
    expect(r.content[0]?.text).not.toContain('secret')
  })
})
