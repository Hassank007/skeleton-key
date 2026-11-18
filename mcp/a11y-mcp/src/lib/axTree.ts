import type { CDPSession, Page } from 'playwright'
import { HELPERS_SRC, SELECTOR_FN } from './selector.js'
import { truncate } from './text.js'

/** Computed-style snapshot of the properties that can show focus (REQ-4.6). */
export type StyleSnapshot = Record<string, string>

export interface FocusedElement {
  /** Per-walk identity of the element. */
  key: number
  selector: string
  tag: string
  role: string
  name: string
  isBody: boolean
  inViewport: boolean
  hasSize: boolean
  style: StyleSnapshot
}

interface AxValue {
  value?: unknown
}
interface AxNode {
  nodeId: string
  ignored?: boolean
  role?: AxValue
  name?: AxValue
  properties?: { name: string; value: AxValue }[]
  childIds?: string[]
  backendDOMNodeId?: number
}

const str = (v: AxValue | undefined): string => (typeof v?.value === 'string' ? v.value : '')

export async function openSession(page: Page): Promise<CDPSession> {
  const session = await page.context().newCDPSession(page)
  await session.send('Accessibility.enable')
  await session.send('DOM.enable')
  return session
}

/** Install the in-page helpers and put focus at the start of the document. */
export async function startWalk(page: Page): Promise<void> {
  await page.evaluate(HELPERS_SRC)
  await page.evaluate('window.__a11y.start()')
}

/** Selector for a node of the accessibility tree, or an empty string if it has no DOM node. */
export async function selectorForBackendNode(session: CDPSession, backendNodeId: number): Promise<string> {
  try {
    const { object } = await session.send('DOM.resolveNode', { backendNodeId })
    if (!object.objectId) return ''
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: SELECTOR_FN,
      returnByValue: true,
    })
    await session.send('Runtime.releaseObject', { objectId: object.objectId }).catch(() => undefined)
    return typeof result.value === 'string' ? truncate(result.value) : ''
  } catch {
    return ''
  }
}

/**
 * Describe the element that holds keyboard focus now (following shadow roots and same-origin frames).
 * Role and accessible name come from the browser's accessibility tree (REQ-4.5).
 */
export async function describeFocused(session: CDPSession): Promise<FocusedElement | null> {
  await session.send('Runtime.evaluate', { expression: 'window.__a11y.settle()', awaitPromise: true })
  const evaluated = await session.send('Runtime.evaluate', { expression: 'window.__a11y.deepActive()' })
  const objectId = evaluated.result.objectId
  if (!objectId) return null
  try {
    const info = await session.send('Runtime.callFunctionOn', {
      objectId,
      functionDeclaration: 'function () { return window.__a11y.describe(this); }',
      returnByValue: true,
    })
    const base = info.result.value as Omit<FocusedElement, 'role' | 'name'> | undefined
    if (!base) return null
    const tree = (await session.send('Accessibility.getPartialAXTree', {
      objectId,
      fetchRelatives: false,
    })) as { nodes: AxNode[] }
    const node = tree.nodes[0]
    return {
      ...base,
      selector: truncate(base.selector),
      role: str(node?.role),
      name: truncate(str(node?.name)),
    }
  } finally {
    await session.send('Runtime.releaseObject', { objectId }).catch(() => undefined)
  }
}

export async function styleOf(page: Page, key: number): Promise<StyleSnapshot | null> {
  return page.evaluate<StyleSnapshot | null>(
    `window.__a11y.settle().then(function () { return window.__a11y.styleOf(${String(key)}); })`,
  )
}

export interface OutlineNode {
  role: string
  name: string
  level: number
  selector: string
}

const LANDMARK_ROLES = new Set(['banner', 'navigation', 'main', 'complementary', 'contentinfo', 'search', 'region', 'form'])

/**
 * Landmarks and headings in document order, from the accessibility tree. Implicit and explicit roles are
 * both found, and nodes hidden from assistive technology are left out (REQ-6.4).
 */
export async function readLandmarksAndHeadings(
  session: CDPSession,
): Promise<{ landmarks: OutlineNode[]; headings: OutlineNode[] }> {
  const { nodes } = (await session.send('Accessibility.getFullAXTree')) as { nodes: AxNode[] }
  const byId = new Map(nodes.map((n) => [n.nodeId, n]))
  const ordered: AxNode[] = []
  const visit = (node: AxNode | undefined): void => {
    if (!node) return
    ordered.push(node)
    for (const id of node.childIds ?? []) visit(byId.get(id))
  }
  const root = nodes[0]
  visit(root)
  // Nodes not reachable from the first node (should not happen) keep their original order at the end.
  const reached = new Set(ordered.map((n) => n.nodeId))
  for (const n of nodes) if (!reached.has(n.nodeId)) ordered.push(n)

  const landmarks: OutlineNode[] = []
  const headings: OutlineNode[] = []
  for (const node of ordered) {
    if (node.ignored === true) continue
    const role = str(node.role)
    const name = str(node.name)
    const isHeading = role === 'heading'
    const isLandmark = LANDMARK_ROLES.has(role) && !((role === 'region' || role === 'form') && name.trim() === '')
    if (!isHeading && !isLandmark) continue
    const selector = node.backendDOMNodeId === undefined ? '' : await selectorForBackendNode(session, node.backendDOMNodeId)
    if (isHeading) {
      const level = node.properties?.find((p) => p.name === 'level')?.value.value
      headings.push({ role, name: truncate(name), level: typeof level === 'number' ? level : 0, selector })
    } else {
      landmarks.push({ role, name: truncate(name), level: 0, selector })
    }
  }
  return { landmarks, headings }
}
