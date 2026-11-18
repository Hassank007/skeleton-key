import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { ConfirmDialog } from '../../src/components/ConfirmDialog'
import { VALID_VALUES } from './support/booking-fixtures'

function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  render(<ConfirmDialog isOpen onClose={onClose} onConfirm={onConfirm} values={VALID_VALUES} {...props} />)
  return { onClose, onConfirm }
}

describe('ConfirmDialog', () => {
  it('has the title and the description [SC 4.1.2]', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog', { name: 'Confirm your séance' })
    expect(dialog).toHaveAccessibleDescription('Check your booking. Nothing is booked until you confirm.')
  })

  it('lists the booking in a description list with six rows [SC 1.3.1]', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog')
    const terms = [...dialog.querySelectorAll('dt')].map((t) => t.textContent)
    const values = [...dialog.querySelectorAll('dd')].map((d) => d.textContent)
    expect(terms).toEqual(['Spirit', 'Date', 'Time', 'Name', 'Email', 'Phone'])
    expect(values).toEqual([
      'Mara the Weeping Widow',
      'Wednesday, November 13, 2030',
      '8:30 PM',
      'Ada Example',
      'ada@example.com',
      '+44 20 7946 0000',
    ])
  })

  it('has two action buttons and no input [REQ-10.4, 11.3]', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('input, select, textarea')).toBeNull()
    expect(within(dialog).getByRole('button', { name: 'Book my séance' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Go back and edit' })).toBeInTheDocument()
  })

  it('renders user values as text, so markup is shown literally [SC 1.3.1]', () => {
    renderDialog({ values: { ...VALID_VALUES, name: '<b>x</b>', email: '"><img src=x onerror=alert(1)>' } })
    const dialog = screen.getByRole('dialog')
    expect(dialog.querySelector('b')).toBeNull()
    expect(dialog.querySelector('img')).toBeNull()
    expect(within(dialog).getByText('<b>x</b>')).toBeInTheDocument()
  })

  it('"Book my séance" calls onConfirm', async () => {
    const { onConfirm } = renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Book my séance' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('"Go back and edit" calls onClose', async () => {
    const { onClose, onConfirm } = renderDialog()
    await userEvent.click(screen.getByRole('button', { name: 'Go back and edit' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Escape calls onClose [SC 2.1.2]', async () => {
    const { onClose } = renderDialog()
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    renderDialog({ isOpen: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('has zero axe violations with the dialog open', async () => {
    renderDialog()
    expect(await axe(document.body)).toHaveNoViolations()
  })
})