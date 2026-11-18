/**
 * Invariant: after every key press, selection (aria-selected), roving tabindex, focus and panel
 * visibility all describe the same single tab, and that tab is the one an independent model predicts.
 * See .kiro/specs/a11y-pbt/design.md, "Property 4: Tabs".
 */
import { describe, it, expect } from 'vitest'
import { act, render, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fc from 'fast-check'
import { Tabs, TabList, Tab, TabPanel } from '../../../src/components/Tabs'
import { checkProperty } from '../support/pbt'

type Key = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End'

const text = fc
  .string({ unit: 'grapheme-ascii', minLength: 1, maxLength: 20 })
  .map((s) => s.replace(/\s+/g, ' ').trim())
  .filter((s) => s.length > 0)

/** `chain` ties the initial index and array lengths to the generated count, so shrinking stays valid. */
const config = fc.integer({ min: 1, max: 12 }).chain((n) =>
  fc.record({
    values: fc.uniqueArray(fc.stringMatching(/^[a-z][a-z0-9-]{0,9}$/), { minLength: n, maxLength: n }),
    labels: fc.array(text, { minLength: n, maxLength: n }),
    initial: fc.integer({ min: 0, max: n - 1 }),
    keys: fc.array(fc.constantFrom<Key>('ArrowLeft', 'ArrowRight', 'Home', 'End'), { maxLength: 50 }),
  }),
)

/** Reference model: the next selected index from (tab count, current index, key). */
function next(count: number, index: number, key: Key): number {
  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count
    case 'ArrowLeft':
      return (index - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
  }
}

describe('Tabs property', () => {
  it(
    'keeps selection, tabindex, focus and panel visibility in step for any key sequence [SC 2.1.1, 4.1.2]',
    async () => {
      await checkProperty(config, async (c) => {
        const user = userEvent.setup({ delay: null })
        const { container, unmount } = render(
          <Tabs defaultValue={c.values[c.initial]}>
            <TabList aria-label="Sections">
              {c.values.map((v, i) => (
                <Tab key={v} value={v}>{c.labels[i]}</Tab>
              ))}
            </TabList>
            {c.values.map((v) => (
              <TabPanel key={v} value={v}>{`Panel ${v}`}</TabPanel>
            ))}
          </Tabs>,
        )
        try {
          const tabs = within(container).getAllByRole('tab')
          expect(tabs).toHaveLength(c.values.length)

          /** Asserts every view of the state agrees on `expectedIndex`; `focused` also checks focus. */
          const checkState = (expectedIndex: number, focused: boolean, when: string) => {
            const selected = tabs.filter((t) => t.getAttribute('aria-selected') === 'true')
            expect(selected, `${when}: exactly one aria-selected=true`).toHaveLength(1)
            expect(
              tabs.filter((t) => t.getAttribute('aria-selected') === 'false'),
              `${when}: all others aria-selected=false`,
            ).toHaveLength(tabs.length - 1)
            const tab = selected[0]
            expect(tabs.indexOf(tab), `${when}: selected index equals the model`).toBe(expectedIndex)

            expect(
              tabs.filter((t) => t.getAttribute('tabindex') === '0'),
              `${when}: only the selected tab has tabindex=0`,
            ).toEqual([tab])
            expect(tabs.filter((t) => t.getAttribute('tabindex') === '-1')).toHaveLength(tabs.length - 1)

            const visible = within(container)
              .getAllByRole('tabpanel', { hidden: true })
              .filter((p) => !p.hidden)
            expect(visible, `${when}: exactly one visible tabpanel`).toHaveLength(1)
            expect(visible[0]).toBeVisible()
            expect(visible[0].id, `${when}: panel is the one aria-controls points to`).toBe(
              tab.getAttribute('aria-controls'),
            )
            expect(visible[0].getAttribute('aria-labelledby'), `${when}: panel labelled by the selected tab`).toBe(tab.id)

            if (focused) expect(document.activeElement, `${when}: focus is on the selected tab`).toBe(tab)
          }

          let index = c.initial
          checkState(index, false, 'after render')

          // Start each case with the initially selected tab focused.
          act(() => tabs[index].focus())
          checkState(index, true, 'after initial focus')

          for (const [step, key] of c.keys.entries()) {
            await user.keyboard(`{${key}}`)
            index = next(c.values.length, index, key)
            checkState(index, true, `after key ${step + 1} (${key})`)
          }
        } finally {
          unmount()
        }
      })
    },
    60_000,
  )
})
