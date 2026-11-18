import { log } from './log.js'

/** An error whose message is safe and useful to show to the user (no stack trace). */
export class ToolError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ToolError'
  }
}

export interface ErrorResult {
  [key: string]: unknown
  isError: true
  content: { type: 'text'; text: string }[]
}

/** Convert any thrown value to an MCP error result (REQ-2.13). Details of unknown errors go to stderr only. */
export function toErrorResult(error: unknown): ErrorResult {
  let message: string
  if (error instanceof ToolError) {
    message = error.message
  } else {
    log('unexpected error:', error)
    message = 'The tool failed unexpectedly. See the server log (standard error) for details.'
  }
  return { isError: true, content: [{ type: 'text', text: message }] }
}
