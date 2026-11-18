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
})