import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { SCHOOLS } from '../../src/data/books'
import { BookCover } from '../../src/components/BookCover'
import { Candle } from '../../src/components/Candle'

describe('BookCover', () => {
  for (const school of SCHOOLS) {
    it(`${school} cover is decorative: aria-hidden, no title, no text [SC 1.1.1]`, async () => {
      const { container } = render(<BookCover school={school} />)
      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.querySelector('title')).toBeNull()
      expect(svg.hasAttribute('aria-label')).toBe(false)
      expect(svg.textContent).toBe('')
      expect(await axe(container)).toHaveNoViolations()
    })
  }
})

describe('Candle', () => {
  it('is decorative and has zero axe violations [SC 1.1.1]', async () => {
    const { container } = render(<Candle />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.querySelector('title')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })
})
