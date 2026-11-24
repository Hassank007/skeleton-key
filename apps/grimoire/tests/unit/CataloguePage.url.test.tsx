import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { AnnouncerProvider } from '../../src/contexts/AnnouncerContext'
import { MotionProvider } from '../../src/contexts/MotionContext'
import { CataloguePage } from '../../src/pages/CataloguePage'

type Navigate = ReturnType<typeof createMemoryRouter>['navigate']

/**
 * Renders the page in a data router. `holdWrites()` makes the router keep every navigation the page itself starts
 * (typing, filters, Clear) in a queue, so a test decides when each one commits. That is what a slow device does:
 * React Router applies the URL inside a transition, after later keystrokes have already changed the input.
 */
function setup(entries: string[], index = entries.length - 1) {
  const router = createMemoryRouter(
    [
      { path: '/', element: <CataloguePage /> },
      { path: '/about', element: <p>About page</p> },
    ],
    { initialEntries: entries, initialIndex: index },
  )
  const realNavigate: Navigate = router.navigate.bind(router)
  const held: Array<() => Promise<void>> = []
  const holdWrites = () => {
    router.navigate = ((to: unknown, opts?: unknown) => {
      held.push(() => realNavigate(to as never, opts as never))
      return Promise.resolve()
    }) as Navigate
  }
  const commitNext = async () => {
    const run = held.shift()
    if (!run) throw new Error('no held navigation to commit')
    await act(async () => {
      await run()
    })
  }
  render(
    <MotionProvider>
      <AnnouncerProvider>
        <RouterProvider router={router} />
      </AnnouncerProvider>
    </MotionProvider>,
  )
  const go = (to: string | number) =>
    act(async () => {
      await (realNavigate as (t: string | number) => Promise<void>)(to)
    })
  const search = () => router.state.location.search
  return { router, held, holdWrites, commitNext, go, search }
}

const box = () => screen.getByLabelText('Search spellbooks') as HTMLInputElement

describe('CataloguePage: the address and the page state stay in step', () => {
  it('keeps newer typing when an OLDER address this page wrote commits late [slow device]', async () => {
    const page = setup(['/'])
    page.holdWrites()
    fireEvent.change(box(), { target: { value: 'a' } })
    fireEvent.change(box(), { target: { value: 'ab' } })
    fireEvent.change(box(), { target: { value: 'abc' } })
    expect(page.held).toHaveLength(3)

    await page.commitNext() // ?q=a lands while the input already says "abc"
    expect(page.search()).toBe('?q=a')
    expect(box().value).toBe('abc')

    await page.commitNext() // ?q=ab
    expect(box().value).toBe('abc')
    await page.commitNext() // ?q=abc
    expect(page.search()).toBe('?q=abc')
    expect(box().value).toBe('abc')
  })

  it('keeps newer typing when the router skips straight to a later address', async () => {
    const page = setup(['/'])
    page.holdWrites()
    fireEvent.change(box(), { target: { value: 'a' } })
    fireEvent.change(box(), { target: { value: 'ab' } })
    page.held.shift() // the transition for ?q=a is superseded and never commits
    await page.commitNext()
    expect(box().value).toBe('ab')
  })

  it('does not lose characters when typing and committing interleave', async () => {
    const page = setup(['/'])
    page.holdWrites()
    fireEvent.change(box(), { target: { value: 'g' } })
    fireEvent.change(box(), { target: { value: 'gh' } })
    await page.commitNext()
    fireEvent.change(box(), { target: { value: 'gho' } })
    await page.commitNext()
    expect(box().value).toBe('gho')
    await page.commitNext()
    expect(page.search()).toBe('?q=gho')
    expect(box().value).toBe('gho')
  })

  it('keeps the input when a filter write commits late after more typing', async () => {
    const page = setup(['/'])
    page.holdWrites()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mild' }))
    fireEvent.change(box(), { target: { value: 'ash' } })
    await page.commitNext() // ?hazard=mild
    expect(box().value).toBe('ash')
    expect((screen.getByRole('checkbox', { name: 'Mild' }) as HTMLInputElement).checked).toBe(true)
    await page.commitNext()
    expect(page.search()).toBe('?q=ash&hazard=mild')
  })

  it('Back and Forward follow the address, including an address this page wrote earlier', async () => {
    const page = setup(['/'])
    await userEvent.type(box(), 'ash')
    expect(page.search()).toBe('?q=ash')
    await page.go('/?q=lantern') // a link to another query
    expect(box().value).toBe('lantern')

    await page.go(-1) // back to the address this page itself wrote
    expect(page.search()).toBe('?q=ash')
    expect(box().value).toBe('ash')

    await page.go(1)
    expect(box().value).toBe('lantern')
    await page.go(-1)
    expect(box().value).toBe('ash')
  })

  it('Back restores filters set before the link was followed', async () => {
    const page = setup(['/'])
    await userEvent.click(screen.getByRole('checkbox', { name: 'Warding' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Mild' }))
    expect(page.search()).toBe('?school=warding&hazard=mild')
    await page.go('/?q=ember')
    expect((screen.getByRole('checkbox', { name: 'Warding' }) as HTMLInputElement).checked).toBe(false)
    await page.go(-1)
    expect((screen.getByRole('checkbox', { name: 'Warding' }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('checkbox', { name: 'Mild' }) as HTMLInputElement).checked).toBe(true)
    expect(box().value).toBe('')
  })

  it('a link to /?q=... replaces the state, also from a page with an active search', async () => {
    const page = setup(['/'])
    await userEvent.type(box(), 'ash')
    await page.go('/?q=lantern&school=warding')
    expect(box().value).toBe('lantern')
    expect((screen.getByRole('checkbox', { name: 'Warding' }) as HTMLInputElement).checked).toBe(true)
  })

  it('a link to the same address this page wrote earlier still replaces newer state', async () => {
    const page = setup(['/'])
    await userEvent.type(box(), 'ash')
    await page.go('/?q=ember')
    await userEvent.type(box(), 'x')
    expect(box().value).toBe('emberx')
    await page.go('/?q=ash') // a push to a URL written earlier is still an outside change
    expect(box().value).toBe('ash')
  })

  it('Clear empties the state and the address, and a later Back still works', async () => {
    const page = setup(['/?q=ember'])
    await page.go('/?q=lantern')
    await userEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }))
    expect(box().value).toBe('')
    expect(page.search()).toBe('')
    await page.go(-1)
    expect(box().value).toBe('ember')
  })

  it('applies the query when the page opens on one (reload or shared link)', () => {
    setup(['/?q=ember&school=herbalism'])
    expect(box().value).toBe('ember')
    expect((screen.getByRole('checkbox', { name: 'Herbalism' }) as HTMLInputElement).checked).toBe(true)
  })

  it('typing quickly and then pressing Back shows the previous address, not the half-written one', async () => {
    const page = setup(['/?q=first', '/?q=second'])
    page.holdWrites()
    fireEvent.change(box(), { target: { value: 'secondx' } })
    fireEvent.change(box(), { target: { value: 'secondxy' } })
    await page.go(-1)
    expect(page.search()).toBe('?q=first')
    expect(box().value).toBe('first')
  })

  it('typing then Back works when the writes had already committed', async () => {
    const page = setup(['/?q=first', '/?q=second'])
    await userEvent.type(box(), 'xy')
    expect(page.search()).toBe('?q=secondxy')
    await page.go(-1)
    expect(box().value).toBe('first')
    await page.go(1)
    expect(box().value).toBe('secondxy')
  })

  it('keeps the page working after leaving and coming back to it', async () => {
    const page = setup(['/'])
    await userEvent.type(box(), 'ash')
    await page.go('/about')
    expect(screen.getByText('About page')).toBeDefined()
    await page.go(-1)
    expect(box().value).toBe('ash')
  })
})
