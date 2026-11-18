import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { describe, expect, it } from 'vitest'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = join(ROOT, 'dist', 'index.js')

describe('stdio server process', () => {
  it('lists the tools and calls check_contrast over stdio', async () => {
    const transport = new StdioClientTransport({ command: process.execPath, args: [ENTRY], cwd: ROOT, stderr: 'ignore' })
    const client = new Client({ name: 'stdio-test', version: '0.0.0' })
    await client.connect(transport)
    try {
      const { tools } = await client.listTools()
      expect(tools.map((t) => t.name).sort()).toEqual(['audit_page', 'check_contrast', 'keyboard_walk', 'page_outline'])
      const result = await client.callTool({
        name: 'check_contrast',
        arguments: { foreground: '#767676', background: '#ffffff', fontSizePx: 16 },
      })
      expect(result.structuredContent).toMatchObject({ ratio: 4.54 })
    } finally {
      await client.close()
    }
  })

  it('writes only protocol messages to stdout and exits when stdin closes', async () => {
    const child = spawn(process.execPath, [ENTRY], { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      out += chunk
    })
    const exited = new Promise<number | null>((resolve) => {
      child.on('exit', (code) => {
        resolve(code)
      })
    })

    const send = (message: object): void => {
      child.stdin.write(`${JSON.stringify(message)}\n`)
    }
    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'raw', version: '0' } },
    })
    send({ jsonrpc: '2.0', method: 'notifications/initialized' })
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })

    const deadline = Date.now() + 20_000
    while (!out.includes('"id":2') && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    child.stdin.end()
    const code = await exited

    expect(code).toBe(0)
    const lines = out.split('\n').filter((l) => l.trim() !== '')
    expect(lines.length).toBeGreaterThanOrEqual(2)
    for (const line of lines) {
      const message = JSON.parse(line) as { jsonrpc?: string }
      expect(message.jsonrpc).toBe('2.0')
    }
  })
})
