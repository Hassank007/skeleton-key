import { ToolError } from './errors.js'

const ENV_NAME = 'A11Y_MCP_ALLOWED_HOSTS'

/** Strip the brackets Node keeps around an IPv6 host name and lower-case it. */
const normalizeHost = (host: string): string => host.replace(/^\[|\]$/g, '').toLowerCase()

function isDefaultHost(host: string): boolean {
  return host === 'localhost' || host === '::1' || /^127(?:\.\d{1,3}){3}$/.test(host)
}

/** Extra hosts from `A11Y_MCP_ALLOWED_HOSTS`, read on every call (REQ-2.3). */
function extraHosts(): string[] {
  return (process.env[ENV_NAME] ?? '')
    .split(',')
    .map((h) => normalizeHost(h.trim()))
    .filter((h) => h !== '')
}

export function isHostAllowed(hostname: string): boolean {
  const host = normalizeHost(hostname)
  if (isDefaultHost(host)) return true
  const extra = extraHosts()
  return extra.includes('*') || extra.includes(host)
}

/** Parse a URL and apply the scheme and host rules (REQ-2.1, 2.4). Throws a ToolError. */
export function assertAllowedUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new ToolError(`Cannot use "${raw}" as a URL. Only http and https URLs are accepted.`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ToolError(
      `The URL scheme "${url.protocol}" is not accepted. Only http and https URLs are accepted.`,
    )
  }
  if (!isHostAllowed(url.hostname)) {
    throw new ToolError(
      `The host "${normalizeHost(url.hostname)}" is not allowed. By default only localhost, 127.0.0.0/8 and ::1 are allowed. ` +
        `To allow it, set ${ENV_NAME} to a comma-separated list of host names, or to * for every host.`,
    )
  }
  return url
}
