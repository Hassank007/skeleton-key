/** Native toggle button (aria-pressed) that stops or allows animation app-wide; gives users a pause control for moving content (WCAG 2.2.2, 2.3.3). */
import { Button } from './Button'
import { useMotion } from '../contexts/MotionContext'

export function MotionToggle() {
  const { reducedMotion, toggle } = useMotion()

  return (
    <Button variant="secondary" size="sm" aria-pressed={reducedMotion} onClick={toggle}>
      Reduce motion
    </Button>
  )
}
