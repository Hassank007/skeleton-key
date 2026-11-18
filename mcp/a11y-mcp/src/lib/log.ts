/** Stderr-only logger. Standard output is reserved for MCP protocol messages (REQ-1.6). */
export function log(...parts: unknown[]): void {
  console.error('[a11y-mcp]', ...parts)
}
