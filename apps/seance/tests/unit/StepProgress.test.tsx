import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { StepProgress } from '../../src/components/StepProgress'

const heading = <h1 tabIndex={-1}>Pick a date and time</h1>

describe('StepProgress', () => {
  for (const n of [1, 2, 3]) {
    it(`shows the text "Step ${n} of 3" directly above the heading [SC 1.3.1]`, () => {
      const { container } = render(<StepProgress current={n - 1} heading={<h1>Heading</h1>} />)
      const count = screen.getByText(`Step ${n} of 3`)
      expect(count.tagName).toBe('P')
      expect(count.nextElementSibling).toBe(container.querySelector('h1'))
    })
  }

  it('says each step state in words [SC 1.4.1]', () => {
    render(<StepProgress current={1} heading={heading} />)
    const items = within(screen.getByRole('list', { name: 'Booking steps' })).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Choose a spirit (completed)')
    expect(items[1]).toHaveTextContent('Pick a date and time (current)')
    expect(items[2]).toHaveTextContent('Your details (not started)')
  })

  it('marks only the current item with aria-current="step" [SC 4.1.2]', () => {
    for (const current of [0, 1, 2]) {
      const { container, unmount } = render(<StepProgress current={current} heading={heading} />)
      const marked = container.querySelectorAll('[aria-current]')
      expect(marked).toHaveLength(1)
      expect(marked[0].getAttribute('aria-current')).toBe('step')
      expect(marked[0]).toBe(container.querySelectorAll('li')[current])
      unmount()
    }
  })

  it('has no live region, no landmark and no link [SC 4.1.3]', () => {
    const { container } = render(<StepProgress current={0} heading={heading} />)
    expect(container.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull()
    expect(container.querySelector('nav, aside, section[aria-label], [role="navigation"]')).toBeNull()
    expect(container.querySelector('a')).toBeNull()
  })

  it('hides the drawn markers from assistive technology', () => {
    const { container } = render(<StepProgress current={2} heading={heading} />)
    const markers = container.querySelectorAll('li > [aria-hidden="true"]')
    expect(markers).toHaveLength(3)
  })

  it('has zero axe violations on every step', async () => {
    for (const current of [0, 1, 2]) {
      const { container, unmount } = render(<StepProgress current={current} heading={heading} />)
      expect(await axe(container)).toHaveNoViolations()
      unmount()
    }
  })
})