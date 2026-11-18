import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AddressInfo } from 'node:net'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')

export interface FixtureServer {
  baseUrl: string
  close: () => Promise<void>
}

/**
 * Serve tests/fixtures on 127.0.0.1 and a free port (REQ-9.2).
 * Extra routes: /redirect-out redirects to a host that is not allowed, /missing is a 404.
 */
export async function startFixtureServer(): Promise<FixtureServer> {
  const server: Server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
    if (path === '/redirect-out') {
      res.writeHead(302, { Location: 'http://not-allowed.invalid/' })
      res.end()
      return
    }
    const file = normalize(join(FIXTURES, path === '/' ? 'clean.html' : path))
    if (!file.startsWith(FIXTURES) || !file.endsWith('.html')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }
    readFile(file).then(
      (body) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(body)
      },
      () => {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Not found')
      },
    )
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => {
          resolve()
        })
      }),
  }
}
