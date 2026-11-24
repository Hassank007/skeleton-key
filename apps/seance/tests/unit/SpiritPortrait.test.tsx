import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { SpiritPortrait } from '../../src/components/SpiritPortrait'
import { SPIRITS } from '../../src/data/spirits'

describe('SpiritPortrait', () => {
  it('covers all four spirits', () => {
    expect(SPIRITS).toHaveLength(4)
  })

  for (const spirit of SPIRITS) {
    describe(spirit.id, () => {
      it('is hidden from assistive technology and not focusable [SC 1.1.1]', () => {
        const { container } = render(<SpiritPortrait id={spirit.id} />)
        const svg = container.querySelector('svg')!
        expect(svg).toHaveAttribute('aria-hidden', 'true')
        expect(svg).toHaveAttribute('focusable', 'false')
        expect(svg).toHaveAttribute('viewBox', '0 0 64 80')
        expect(svg.querySelector('path')).not.toBeNull()
        expect(svg.querySelector('g')).toBeNull()
      })

      it('carries no title, text or role', () => {
        const { container } = render(<SpiritPortrait id={spirit.id} />)
        expect(container.querySelector('title, desc')).toBeNull()
        expect(container.textContent).toBe('')
        expect(container.querySelector('[role], a, button, [tabindex]')).toBeNull()
      })

      it('has zero axe violations', async () => {
        const { container } = render(<SpiritPortrait id={spirit.id} />)
        expect(await axe(container)).toHaveNoViolations()
      })
    })
  }

  it('draws nothing for an unknown id', () => {
    const { container } = render(<SpiritPortrait id="nobody" />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
