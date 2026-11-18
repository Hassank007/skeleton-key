/** Vertical stack of Fields with readable, 2.75 rem high native inputs and a scroll margin below the sticky header (WCAG 2.4.11, 2.5.8). */
import type { ReactNode } from 'react'
import styles from './FormStack.module.css'

export function FormStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>
}