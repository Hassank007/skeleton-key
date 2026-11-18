#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { closeBrowser } from './lib/browser.js'
import { log } from './lib/log.js'
import { createServer } from './server.js'

let closing = false

/** Close the browser and exit (REQ-1.7). */
async function shutdown(reason: string): Promise<void> {
  if (closing) return
  closing = true
  log(`shutting down: ${reason}`)
  await closeBrowser()
  process.exit(0)
}

async function main(): Promise<void> {
  const server = createServer()
  await server.connect(new StdioServerTransport())
  process.stdin.on('end', () => void shutdown('standard input closed'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  log('ready')
}

main().catch((error: unknown) => {
  log('failed to start:', error)
  process.exit(1)
})
