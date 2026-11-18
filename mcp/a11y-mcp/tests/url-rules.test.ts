import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { closeBrowser, withPage } from '../src/lib/browser.js'
import { assertAllowedUrl, isHostAllowed } from '../src/lib/url.js'
import { startFixtureServer, type FixtureServer } from './helpers/fixture-server.js'

let fixtures: FixtureServer
let closedPortUrl: string

beforeAll(async () => {
  fixtures = await startFixtureServer()
  const other = await startFixtureServer()
  closedPortUrl = `${other.baseUrl}/clean.html`
  await other.close()
})

afterAll(async () => {
  await fixtures.close()
  await closeBrowser()
})

afterEach(() => {
  delete process.env['A11Y_MCP_ALLOWED_HOSTS']
})

const title = (): Promise<string> => withPage(`${fixtures.baseUrl}/clean.html`, (page) => page.title())

describe('scheme rules', () => {
  it.each(['file:///etc/passwd', 'javascript:alert(1)', 'data:text/html,hi', 'ftp://127.0.0.1/'])(
    'rejects %s',
    (url) => {
      expect(() => assertAllowedUrl(url)).toThrow(/Only http and https URLs are accepted/)
    },
  )
  it('rejects a string that is not a URL', () => {
    expect(() => assertAllowedUrl('not a url')).toThrow(/Only http and https/)
  })
})

describe('host rules', () => {
  it.each(['http://localhost:3000/', 'http://127.0.0.1/', 'http://127.1.2.3/', 'https://[::1]:8080/'])(
    'allows %s by default',
    (url) => {
      expect(assertAllowedUrl(url).href).toBe(new URL(url).href)
    },
  )
  it('rejects another host, names it and mentions the variable', () => {
    expect(() => assertAllowedUrl('https://example.com/')).toThrow(
      /"example\.com".*A11Y_MCP_ALLOWED_HOSTS/,
    )
  })
  it('allows an extra host from A11Y_MCP_ALLOWED_HOSTS and reads it on every call', () => {
    process.env['A11Y_MCP_ALLOWED_HOSTS'] = 'staging.test, Other.test'
    expect(isHostAllowed('staging.test')).toBe(true)
    expect(isHostAllowed('other.test')).toBe(true)
    expect(isHostAllowed('example.com')).toBe(false)
    delete process.env['A11Y_MCP_ALLOWED_HOSTS']
    expect(isHostAllowed('staging.test')).toBe(false)
  })
  it('allows every host when the value is *', () => {
    process.env['A11Y_MCP_ALLOWED_HOSTS'] = '*'
    expect(isHostAllowed('example.com')).toBe(true)
  })
  it('does not open a browser page for a rejected host', async () => {
    await expect(withPage('http://example.com/', () => Promise.resolve('opened'))).rejects.toThrow(
      /not allowed/,
    )
  })
})

describe('loading', () => {
  it('loads an allowed page', async () => {
    expect(await title()).toBe('Clean fixture page')
  })
  it('reports a refused connection with the URL and cause', async () => {
    await expect(withPage(closedPortUrl, () => Promise.resolve(1))).rejects.toThrow(
      new RegExp(`Cannot reach ${closedPortUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*ERR_CONNECTION_REFUSED`),
    )
  })
  it('reports a missing page (404) as an error', async () => {
    await expect(withPage(`${fixtures.baseUrl}/missing`, () => Promise.resolve(1))).rejects.toThrow(
      /HTTP status 404/,
    )
  })
  it('aborts a redirect to a host that is not allowed', async () => {
    await expect(withPage(`${fixtures.baseUrl}/redirect-out`, () => Promise.resolve(1))).rejects.toThrow(
      /redirected to "not-allowed\.invalid".*not allowed/,
    )
  })
})
