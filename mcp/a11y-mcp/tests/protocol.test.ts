import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer } from '../src/server.js'

let client: Client

beforeAll(async () => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  client = new Client({ name: 'test-client', version: '0.0.0' })
  await createServer().connect(serverSide)
  await client.connect(clientSide)
})

afterAll(async () => {
  await client.close()
})

interface JsonSchema {
  properties?: Record<string, { type?: string; default?: unknown; description?: string }>
  required?: string[]
}

describe('tool list', () => {
  it('registers exactly the four tools', async () => {
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(['audit_page', 'check_contrast', 'keyboard_walk', 'page_outline'])
  })

  it('gives every tool a description, an output schema, and typed, described parameters', async () => {
    const { tools } = await client.listTools()
    for (const tool of tools) {
      expect(tool.description, tool.name).toMatch(/\w{10}/)
      expect(tool.outputSchema, tool.name).toBeDefined()
      const input = tool.inputSchema as JsonSchema
      for (const [name, prop] of Object.entries(input.properties ?? {})) {
        expect(prop.type, `${tool.name}.${name} type`).toBeDefined()
        expect(prop.description, `${tool.name}.${name} description`).toBeTruthy()
      }
    }
  })

  it('declares the defaults', async () => {
    const { tools } = await client.listTools()
    const props = (name: string): NonNullable<JsonSchema['properties']> =>
      (tools.find((t) => t.name === name)?.inputSchema as JsonSchema).properties ?? {}
    expect(props('audit_page')['wcagLevel']?.default).toBe('AA')
    expect(props('keyboard_walk')['maxSteps']?.default).toBe(50)
    expect(props('check_contrast')['bold']?.default).toBe(false)
  })
})

describe('calls', () => {
  it('returns a structured result and one JSON text block for check_contrast', async () => {
    const result = await client.callTool({
      name: 'check_contrast',
      arguments: { foreground: '#000000', background: '#ffffff', fontSizePx: 16 },
    })
    expect(result.isError).toBeFalsy()
    expect(result.structuredContent).toMatchObject({ ratio: 21, textSize: 'normal' })
    const content = result.content as { type: string; text: string }[]
    expect(content).toHaveLength(1)
    expect(JSON.parse(content[0]?.text ?? '')).toEqual(result.structuredContent)
  })

  it('returns an error result that names a bad parameter, without starting a browser', async () => {
    const outcome = await client
      .callTool({ name: 'keyboard_walk', arguments: { url: 'http://127.0.0.1:1/', maxSteps: 500 } })
      .then(
        (r) => ({ isError: r.isError, text: JSON.stringify(r.content) }),
        (e: unknown) => ({ isError: true, text: String(e) }),
      )
    expect(outcome.isError).toBe(true)
    expect(outcome.text).toMatch(/maxSteps/)
  })

  it('returns an error result for a failing tool call, with no stack trace', async () => {
    const result = await client.callTool({
      name: 'check_contrast',
      arguments: { foreground: 'banana', background: '#fff', fontSizePx: 16 },
    })
    expect(result.isError).toBe(true)
    const text = (result.content as { text: string }[])[0]?.text ?? ''
    expect(text).toMatch(/"foreground": "banana"/)
    expect(text).not.toMatch(/\n\s+at /)
  })

  it('rejects a URL with a scheme that is not http or https', async () => {
    const result = await client.callTool({ name: 'page_outline', arguments: { url: 'file:///etc/passwd' } })
    expect(result.isError).toBe(true)
    expect(JSON.stringify(result.content)).toMatch(/Only http and https URLs are accepted/)
  })
})
