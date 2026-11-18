import { chromium, errors, type Browser, type Page } from 'playwright'
import { ToolError } from './errors.js'
import { log } from './log.js'
import { assertAllowedUrl, isHostAllowed } from './url.js'

export const LOAD_TIMEOUT_MS = 15_000
export const CALL_TIMEOUT_MS = 60_000
export const IDLE_WAIT_MS = 2_000
const VIEWPORT = { width: 1280, height: 800 }

export interface LoadInfo {
  /** The URL as requested. */
  url: string
  /** The URL after redirects. */
  finalUrl: string
}

let browserPromise: Promise<Browser> | undefined

const firstLine = (message: string): string => message.split('\n', 1)[0]?.trim() ?? message

/** Start Chromium on first use and reuse it afterwards (REQ-2.7). */
async function getBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch({ headless: true }).catch((error: unknown) => {
    browserPromise = undefined
    const message = error instanceof Error ? error.message : String(error)
    if (/executable doesn't exist/i.test(message)) {
      throw new ToolError(
        "Chromium is not installed for Playwright. Run 'npx playwright install chromium' and try again.",
      )
    }
    throw new ToolError(`Cannot start Chromium: ${firstLine(message)}`)
  })
  return browserPromise
}

/** Close the shared browser, if one was started (REQ-1.7). */
export async function closeBrowser(): Promise<void> {
  const pending = browserPromise
  browserPromise = undefined
  if (!pending) return
  try {
    await (await pending).close()
  } catch (error) {
    log('error while closing the browser:', error)
  }
}

function describeNetworkError(url: string, message: string): ToolError {
  const cause = /net::(ERR_[A-Z_]+)/.exec(message)?.[1]
  return new ToolError(`Cannot reach ${url}: ${cause ?? firstLine(message)}`)
}

/**
 * Load a page in a fresh, isolated context and run `fn` against it (REQ-2).
 * The URL scheme and host rules apply to the URL and to every redirect of the main frame.
 */
export async function withPage<T>(
  rawUrl: string,
  fn: (page: Page, info: LoadInfo) => Promise<T>,
): Promise<T> {
  const url = assertAllowedUrl(rawUrl)
  const browser = await getBrowser()
  const context = await browser.newContext({ viewport: VIEWPORT, javaScriptEnabled: true })
  let timer: NodeJS.Timeout | undefined
  try {
    const page = await context.newPage()
    let blockedHost: string | undefined
    // Playwright's page.route() does not see redirect hops, so the guard uses the CDP Fetch domain,
    // which pauses every document request (including each redirect) before it is sent (REQ-2.5).
    const cdp = await context.newCDPSession(page)
    const mainFrameId = (await cdp.send('Page.getFrameTree')).frameTree.frame.id
    cdp.on('Fetch.requestPaused', (event) => {
      const { requestId } = event
      let hostname = ''
      try {
        hostname = new URL(event.request.url).hostname
      } catch {
        hostname = ''
      }
      if (event.frameId === mainFrameId && !isHostAllowed(hostname)) {
        blockedHost = hostname
        void cdp.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => undefined)
      } else {
        void cdp.send('Fetch.continueRequest', { requestId }).catch(() => undefined)
      }
    })
    await cdp.send('Fetch.enable', {
      patterns: [{ urlPattern: '*', resourceType: 'Document', requestStage: 'Request' }],
    })

    const work = (async (): Promise<T> => {
      let status: number | undefined
      try {
        const response = await page.goto(url.href, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS })
        status = response?.status()
      } catch (error) {
        if (blockedHost !== undefined) {
          throw new ToolError(
            `The page redirected to "${blockedHost}", which is not allowed. Set A11Y_MCP_ALLOWED_HOSTS to allow it.`,
          )
        }
        if (error instanceof errors.TimeoutError) {
          throw new ToolError(
            `${url.href} did not reach the load event within ${LOAD_TIMEOUT_MS / 1000} seconds (page load limit).`,
          )
        }
        throw describeNetworkError(url.href, error instanceof Error ? error.message : String(error))
      }
      if (status !== undefined && status >= 400) {
        throw new ToolError(`Cannot reach ${url.href}: the server answered with HTTP status ${status}.`)
      }
      await page.waitForLoadState('networkidle', { timeout: IDLE_WAIT_MS }).catch(() => undefined)
      return fn(page, { url: url.href, finalUrl: page.url() })
    })()

    const limit = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(
          new ToolError(
            `The tool call took longer than ${CALL_TIMEOUT_MS / 1000} seconds (tool call limit) for ${url.href}.`,
          ),
        )
      }, CALL_TIMEOUT_MS)
    })
    work.catch(() => undefined) // the race below reports the outcome; avoid an unhandled rejection after a timeout
    return await Promise.race([work, limit])
  } finally {
    if (timer) clearTimeout(timer)
    await context.close().catch(() => undefined)
  }
}
