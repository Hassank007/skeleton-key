import { test, expect, type Page } from '@playwright/test'
import { scanPage } from './support/axe'
import { fixClock, h1 } from './support/keys'

/** Drives the flow to a state. Mouse and keyboard are both fine here; the keyboard-only specs cover the keyboard. */
async function toStep1(page: Page) {
  await fixClock(page)
  await page.goto('/book/spirit')
  await expect(h1(page)).toHaveText('Choose a spirit')
}
async function toStep2(page: Page) {
  await toStep1(page)
  await page.getByRole('radio', { name: 'Captain Ashgrove' }).check()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(h1(page)).toHaveText('Pick a date and time')
}
async function toStep3(page: Page) {
  await toStep2(page)
  await page.getByLabel(/^Date/).fill('2030-11-13')
  await page.getByLabel(/^Time/).fill('20:30')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(h1(page)).toHaveText('Your details')
}
async function fillDetails(page: Page) {
  await page.getByLabel(/^Full name/).fill('Ada Example')
  await page.getByLabel(/^Email address/).fill('ada@example.com')
  await page.getByLabel(/^Phone number/).fill('+44 20 7946 0000')
}

function scans(scheme: 'light' | 'dark') {
  const label = scheme === 'dark' ? 'dark' : undefined
  const tag = '[SC 1.4.3, 1.4.11, 4.1.2]'

  test(`introduction has zero axe violations (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await fixClock(page)
    await page.goto('/')
    await expect(h1(page)).toBeVisible()
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`step 1 has zero axe violations, clean (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep1(page)
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`step 1 has zero axe violations with the error summary (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep1(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'There is a problem' })).toBeVisible()
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`step 1 has zero axe violations with a spirit selected (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep1(page)
    await page.getByRole('radio', { name: 'The Hollow Choir' }).check()
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`step 2 has zero axe violations, clean (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep2(page)
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`step 2 has zero axe violations with the error summary (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep2(page)
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('heading', { name: 'There is a problem' })).toBeVisible()
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`step 3 has zero axe violations, clean (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep3(page)
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`step 3 has zero axe violations with the error summary (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep3(page)
    // Enter submits the form; a click would miss, because the blur error moves the button.
    await page.getByLabel(/^Email address/).fill('nope')
    await page.getByLabel(/^Email address/).press('Enter')
    await expect(page.getByRole('heading', { name: 'There is a problem' })).toBeVisible()
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`the open confirmation dialog has zero axe violations (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep3(page)
    await fillDetails(page)
    await page.getByRole('button', { name: 'Review and book' }).click()
    await expect(page.getByRole('dialog', { name: 'Confirm your séance' })).toBeVisible()
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })

  test(`the success view has zero axe violations (${scheme}) ${tag}`, async ({ page }, testInfo) => {
    await toStep3(page)
    await fillDetails(page)
    await page.getByRole('button', { name: 'Review and book' }).click()
    await page.getByRole('button', { name: 'Book my séance' }).click()
    await expect(h1(page)).toHaveText('Your séance is booked')
    expect((await scanPage(page, testInfo, label)).violations).toEqual([])
  })
}

test.describe('Axe scans of every step and state', () => {
  scans('light')

  test.describe('dark scheme', () => {
    test.use({ colorScheme: 'dark' })
    scans('dark')
  })
})