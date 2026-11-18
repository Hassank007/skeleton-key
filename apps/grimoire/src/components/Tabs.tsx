/** APG tabs pattern: tablist/tab/tabpanel, aria-selected, aria-controls/aria-labelledby, roving tabindex, arrow-key navigation with automatic activation (WCAG 2.1.1, 4.1.2). */
import {
  type KeyboardEvent,
  type ReactNode,
  createContext,
  useContext,
  useId,
  useRef,
  useState,
} from 'react'
import styles from './Tabs.module.css'

// ── Context shared between Tabs, Tab, and TabPanel ────────────────────────

interface TabsContextValue {
  /** The id of the currently selected tab. */
  selectedId: string
  /** Set the selected tab by id. */
  select: (id: string) => void
  /** Namespace prefix for aria-controls / aria-labelledby. */
  prefix: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tab and TabPanel must be used inside <Tabs>')
  return ctx
}

// ── Tabs ──────────────────────────────────────────────────────────────────

interface TabsProps {
  /** Initial selected tab value. Must match one Tab's `value`. */
  defaultValue: string
  /** Controlled selected tab value. */
  value?: string
  /** Callback when the selected tab changes. */
  onChange?: (value: string) => void
  children: ReactNode
}

export function Tabs({ defaultValue, value: controlledValue, onChange, children }: TabsProps) {
  const prefix = useId()
  const [internalValue, setInternalValue] = useState(defaultValue)
  const selectedId = controlledValue ?? internalValue

  function select(id: string) {
    if (!controlledValue) setInternalValue(id)
    onChange?.(id)
  }

  return (
    <TabsContext.Provider value={{ selectedId, select, prefix }}>
      <div className={styles.tabs}>{children}</div>
    </TabsContext.Provider>
  )
}

// ── TabList ───────────────────────────────────────────────────────────────

interface TabListProps {
  /** Accessible label for the tablist. */
  'aria-label': string
  children: ReactNode
}

export function TabList({ 'aria-label': ariaLabel, children }: TabListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const { select } = useTabsContext()

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const list = listRef.current
    if (!list) return

    const tabs = Array.from(
      list.querySelectorAll<HTMLElement>('[role="tab"]'),
    )
    if (tabs.length === 0) return

    const currentIndex = tabs.findIndex((t) => t === document.activeElement)

    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = (currentIndex + 1) % tabs.length
        break
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = tabs.length - 1
        break
      default:
        return
    }

    if (nextIndex !== null) {
      const nextTab = tabs[nextIndex]
      nextTab.focus()
      // Automatic activation: selecting on focus (APG "automatic activation").
      const value = nextTab.getAttribute('data-value')
      if (value) select(value)
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- tablist uses roving tabindex on child tabs, not direct focus
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={styles.tabList}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}

// ── Tab ───────────────────────────────────────────────────────────────────

interface TabProps {
  /** Unique identifier for this tab; must match the corresponding TabPanel's `value`. */
  value: string
  children: ReactNode
}

export function Tab({ value, children }: TabProps) {
  const { selectedId, select, prefix } = useTabsContext()
  const isSelected = selectedId === value

  return (
    <button
      type="button"
      role="tab"
      id={`${prefix}-tab-${value}`}
      aria-controls={`${prefix}-panel-${value}`}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      data-value={value}
      className={[styles.tab, isSelected ? styles.selected : ''].filter(Boolean).join(' ')}
      onClick={() => select(value)}
    >
      {children}
    </button>
  )
}

// ── TabPanel ──────────────────────────────────────────────────────────────

interface TabPanelProps {
  /** Must match the corresponding Tab's `value`. */
  value: string
  children: ReactNode
}

export function TabPanel({ value, children }: TabPanelProps) {
  const { selectedId, prefix } = useTabsContext()
  const isSelected = selectedId === value

  return (
    <div
      role="tabpanel"
      id={`${prefix}-panel-${value}`}
      aria-labelledby={`${prefix}-tab-${value}`}
      className={styles.panel}
      hidden={!isSelected}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- APG tab pattern: tabpanel should be focusable so keyboard users can Tab into panel content
      tabIndex={0}
    >
      {children}
    </div>
  )
}
