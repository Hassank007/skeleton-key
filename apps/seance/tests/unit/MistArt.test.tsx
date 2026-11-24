import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { MistArt } from '../../src/components/MistArt'

describe('MistArt', () => {
  it('is hidden from assistive technology and not focusable [SC 1.1.1]', () => {
    const { container } = render(<MistArt />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
  })

  it('carries no title, text or role', () => {
    const { container } = render(<MistArt />)
    expect(container.querySelector('title, desc')).toBeNull()
    expect(container.textContent).toBe('')
    expect(container.querySelector('[role], a, button, [tabindex]')).toBeNull()
  })

  it('has zero axe violations', async () => {
    const { container } = render(<MistArt />)
    expect(await axe(container)).toHaveNoViolations()
  })

  for (const phase of [0, 1, 2, 3] as const) {
    describe(`phase ${phase}`, () => {
      it('has exactly one <g> (the animated one), is aria-hidden and has no text', () => {
        const { container } = render(<MistArt phase={phase} />)
        const svg = container.querySelector('svg')!
        expect(svg).toHaveAttribute('aria-hidden', 'true')
        expect(svg).toHaveAttribute('focusable', 'false')
        expect(svg.querySelectorAll('g')).toHaveLength(1)
        expect(container.querySelector('title, desc')).toBeNull()
        expect(container.textContent).toBe('')
      })

      it('has zero axe violations', async () => {
        const { container } = render(<MistArt phase={phase} />)
        expect(await axe(container)).toHaveNoViolations()
      })
    })
  }

  it('draws a different moon in each phase', () => {
    const shapes = ([0, 1, 2, 3] as const).map((phase) => {
      const { container, unmount } = render(<MistArt phase={phase} />)
      const d = container.querySelectorAll('path')[0].getAttribute('d')
      unmount()
      return d
    })
    expect(new Set(shapes).size).toBe(4)
  })
})