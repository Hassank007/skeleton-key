import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { Tabs, TabList, Tab, TabPanel } from '../../src/components/Tabs'

// ── Helper: a standard three-tab fixture ─────────────────────────────────

function ThreeTabs() {
  return (
    <Tabs defaultValue="spells">
      <TabList aria-label="Grimoire sections">
        <Tab value="spells">Spells</Tab>
        <Tab value="potions">Potions</Tab>
        <Tab value="tomes">Tomes</Tab>
      </TabList>
      <TabPanel value="spells">Spell content</TabPanel>
      <TabPanel value="potions">Potion content</TabPanel>
      <TabPanel value="tomes">Tome content</TabPanel>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('renders with zero axe violations', async () => {
    const { container } = render(<ThreeTabs />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('the first tab is selected by default', () => {
    render(<ThreeTabs />)
    const spellsTab = screen.getByRole('tab', { name: 'Spells' })
    expect(spellsTab.getAttribute('aria-selected')).toBe('true')
  })

  it('non-selected tabs have aria-selected="false"', () => {
    render(<ThreeTabs />)
    expect(screen.getByRole('tab', { name: 'Potions' }).getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('tab', { name: 'Tomes' }).getAttribute('aria-selected')).toBe('false')
  })

  it('the selected panel is visible and others are hidden', () => {
    render(<ThreeTabs />)
    // Active panel: not hidden (accessible via role query without hidden:true).
    const spellsPanel = screen.getByRole('tabpanel', { name: 'Spells' })
    expect(spellsPanel.hasAttribute('hidden')).toBe(false)
    // Inactive panels: hidden attribute present. Query all panels (including hidden ones).
    const allPanels = screen.getAllByRole('tabpanel', { hidden: true })
    const potionsPanel = allPanels.find((p) => p.getAttribute('aria-labelledby')?.includes('potions'))
    const tomesPanel = allPanels.find((p) => p.getAttribute('aria-labelledby')?.includes('tomes'))
    expect(potionsPanel?.hasAttribute('hidden')).toBe(true)
    expect(tomesPanel?.hasAttribute('hidden')).toBe(true)
  })

  it('ArrowRight moves focus to the next tab and activates it', async () => {
    const user = userEvent.setup()
    render(<ThreeTabs />)
    const spellsTab = screen.getByRole('tab', { name: 'Spells' })
    spellsTab.focus()
    await user.keyboard('{ArrowRight}')
    const potionsTab = screen.getByRole('tab', { name: 'Potions' })
    expect(document.activeElement).toBe(potionsTab)
    expect(potionsTab.getAttribute('aria-selected')).toBe('true')
  })

  it('ArrowLeft moves focus to the previous tab and activates it', async () => {
    const user = userEvent.setup()
    render(<ThreeTabs />)
    const potionsTab = screen.getByRole('tab', { name: 'Potions' })
    potionsTab.focus()
    await user.keyboard('{ArrowLeft}')
    const spellsTab = screen.getByRole('tab', { name: 'Spells' })
    expect(document.activeElement).toBe(spellsTab)
    expect(spellsTab.getAttribute('aria-selected')).toBe('true')
  })

  it('ArrowRight wraps from last to first tab', async () => {
    const user = userEvent.setup()
    render(<ThreeTabs />)
    const tomesTab = screen.getByRole('tab', { name: 'Tomes' })
    tomesTab.focus()
    await user.keyboard('{ArrowRight}')
    const spellsTab = screen.getByRole('tab', { name: 'Spells' })
    expect(document.activeElement).toBe(spellsTab)
  })

  it('ArrowLeft wraps from first to last tab', async () => {
    const user = userEvent.setup()
    render(<ThreeTabs />)
    const spellsTab = screen.getByRole('tab', { name: 'Spells' })
    spellsTab.focus()
    await user.keyboard('{ArrowLeft}')
    const tomesTab = screen.getByRole('tab', { name: 'Tomes' })
    expect(document.activeElement).toBe(tomesTab)
  })

  it('Home moves focus to the first tab', async () => {
    const user = userEvent.setup()
    render(<ThreeTabs />)
    const tomesTab = screen.getByRole('tab', { name: 'Tomes' })
    tomesTab.focus()
    await user.keyboard('{Home}')
    const spellsTab = screen.getByRole('tab', { name: 'Spells' })
    expect(document.activeElement).toBe(spellsTab)
  })

  it('End moves focus to the last tab', async () => {
    const user = userEvent.setup()
    render(<ThreeTabs />)
    const spellsTab = screen.getByRole('tab', { name: 'Spells' })
    spellsTab.focus()
    await user.keyboard('{End}')
    const tomesTab = screen.getByRole('tab', { name: 'Tomes' })
    expect(document.activeElement).toBe(tomesTab)
  })

  it('clicking a tab selects it and shows its panel', async () => {
    const user = userEvent.setup()
    render(<ThreeTabs />)
    await user.click(screen.getByRole('tab', { name: 'Potions' }))
    expect(screen.getByRole('tab', { name: 'Potions' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel', { name: 'Potions' }).hasAttribute('hidden')).toBe(false)
  })

  it('tab has aria-controls pointing to its panel id', () => {
    render(<ThreeTabs />)
    const spellsTab = screen.getByRole('tab', { name: 'Spells' })
    const controlsId = spellsTab.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    const panel = document.getElementById(controlsId!)
    expect(panel?.getAttribute('role')).toBe('tabpanel')
  })

  it('panel has aria-labelledby pointing to its tab id', () => {
    render(<ThreeTabs />)
    const spellsPanel = screen.getByRole('tabpanel', { name: 'Spells' })
    const labelledById = spellsPanel.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()
    const tab = document.getElementById(labelledById!)
    expect(tab?.getAttribute('role')).toBe('tab')
  })

  it('selected tab has tabindex 0, others have tabindex -1 (roving)', () => {
    render(<ThreeTabs />)
    expect(screen.getByRole('tab', { name: 'Spells' }).getAttribute('tabindex')).toBe('0')
    expect(screen.getByRole('tab', { name: 'Potions' }).getAttribute('tabindex')).toBe('-1')
    expect(screen.getByRole('tab', { name: 'Tomes' }).getAttribute('tabindex')).toBe('-1')
  })
})
