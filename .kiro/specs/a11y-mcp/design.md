# Accessibility MCP Server (a11y-mcp): Design

## Overview

`mcp/a11y-mcp` is a small stdio MCP server. Kiro starts it as a child process and calls four tools. Each tool is a plain async function that takes validated input and returns a typed result. A thin layer registers those functions with the SDK. This keeps the logic testable without a protocol client, and the protocol testable without a browser.

```
mcp/a11y-mcp/
  package.json            scripts: build, start, lint, test
  tsconfig.json           strict, NodeNext, includes src and tests (for tsc --noEmit)
  tsconfig.build.json     emits src to dist
  eslint.config.js        typescript-eslint strict
  vitest.config.ts
  .gitignore              node_modules, dist
  README.md               REQ-8
  src/
    index.ts              bootstrap: create server, connect stdio, shutdown hooks (REQ-1)
    server.ts             createServer(): registers the four tools (REQ-1)
    tools/
      auditPage.ts        REQ-3
      keyboardWalk.ts     REQ-4
      checkContrast.ts    REQ-5
      pageOutline.ts      REQ-6
    lib/
      browser.ts          lazy shared Chromium, withPage(url, fn) (REQ-2)
      url.ts              scheme and host rules, navigation guard (REQ-2)
      axeTags.ts          level to tags, tag to criterion number, criterion names (REQ-3)
      axTree.ts           CDP accessibility tree: roles, names, selectors (REQ-4, REQ-6)
      selector.ts         in-page CSS selector builder (string injected into the page)
      color.ts            colour parsing and blending (REQ-5)
      contrast.ts         luminance, ratio, thresholds (REQ-5)
      errors.ts           ToolError and conversion to an MCP error result (REQ-2.13)
      log.ts              stderr-only logger (REQ-1.6)
      text.ts             truncate(text, 200) for page-sourced strings (REQ-2.14)
  tests/
    fixtures/             clean.html, violations.html, trap.html, no-focus.html, outline-issues.html
    helpers/fixture-server.ts
    audit-page.test.ts
    keyboard-walk.test.ts
    check-contrast.test.ts
    page-outline.test.ts
    url-rules.test.ts
    protocol.test.ts      in-memory client (REQ-9.11)
    stdio.test.ts         spawns dist/index.js (REQ-9.12)
```

The server is not a UI, so `eslint-plugin-jsx-a11y` does not apply to it. The fixtures are the only HTML in the package. The repository's accessibility steering still applies to them (see Fixtures).

`structure.md` shows the repository tree without `mcp/`, while `product.md` names `mcp/a11y-mcp`. This design follows `product.md`. Adding `mcp/` to the tree in `structure.md` is a steering change, so it is listed as a follow-up and is not done by this spec.

## Dependencies and reasons

`tech.md` requires a written reason for each dependency. This package is separate from `skeleton/`, so it declares its own.

| Package | Where | Reason |
|---|---|---|
| `@modelcontextprotocol/sdk` | dependency | The official MCP SDK. Gives `McpServer`, `StdioServerTransport` and the in-memory transport and client used in tests. Writing the protocol ourselves would be more code and less compatible. |
| `zod` | dependency | The SDK takes input and output schemas as zod shapes, and validates arguments against them (REQ-1.9). The version range is the one the installed SDK declares. |
| `playwright` | dependency | Drives headless Chromium and gives access to CDP sessions. `tech.md` already names Playwright for page-level tests. The library package is enough; the test runner is not needed. |
| `@axe-core/playwright` | dependency | Runs axe-core in the page with tag filtering and frame support. `tech.md` already names it. It brings in `axe-core`. |
| `typescript` | devDependency | Compiler (`tsc`) for strict mode, the build and `tsc --noEmit`. |
| `@types/node` | devDependency | Types for `node:http`, `node:child_process` and `process`. |
| `vitest` | devDependency | Test runner named in `tech.md`. Runs TypeScript with no extra plugin. |
| `eslint`, `typescript-eslint` | devDependency | Lint with a strict type-aware preset. `eslint-plugin-jsx-a11y` is not used because there is no JSX. |

No colour library is used. Contrast maths is about 40 lines of our own code (REQ-5.6). No test helper library is added: the fixture server uses `node:http`.

Playwright's Chromium download is not run on install, because a post-install download makes `npm ci` slow and fragile. The README gives the one command (`npx playwright install chromium`) and the tools return it in the error message when the browser is missing (REQ-2.12).

## Server and protocol

`server.ts` exports `createServer(): McpServer`. It calls `server.registerTool(name, { title, description, inputSchema, outputSchema }, handler)` for each tool. Every handler:

1. Receives arguments already validated by the SDK against the zod shape (REQ-1.9).
2. Calls the tool function.
3. Returns `{ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result }`.
4. Catches `ToolError` (and any other error) and returns `{ isError: true, content: [{ type: 'text', text: message }] }` (REQ-2.13). Unknown errors return a generic message and the details go to stderr.

`index.ts` creates the server, connects a `StdioServerTransport`, and registers `process.stdin.on('end')`, `SIGINT` and `SIGTERM` handlers that call `closeBrowser()` and then `process.exit(0)` (REQ-1.7). `log.ts` wraps `console.error` and is the only logging path. An ESLint `no-console` rule that allows only `console.error` keeps `console.log` out of `src/`, so nothing writes to stdout by accident (REQ-1.6). Playwright and Chromium do not write to the parent's stdout.

Input shapes:

| Tool | Shape |
|---|---|
| `audit_page` | `{ url: z.string(), wcagLevel: z.enum(['A','AA','AAA']).default('AA') }` |
| `keyboard_walk` | `{ url: z.string(), maxSteps: z.number().int().min(1).max(200).default(50) }` |
| `check_contrast` | `{ foreground: z.string(), background: z.string(), fontSizePx: z.number().positive().finite(), bold: z.boolean().default(false) }` |
| `page_outline` | `{ url: z.string() }` |

`url` is validated by `url.ts` rather than `z.string().url()`, so the error message is ours (REQ-2.1, 2.4).

## Browser and page loading (`lib/browser.ts`, `lib/url.ts`)

```ts
withPage<T>(rawUrl: string, fn: (page: Page, ctx: LoadInfo) => Promise<T>): Promise<T>
```

Steps:

1. `assertAllowedUrl(rawUrl)` parses with `new URL`, rejects other schemes (REQ-2.1), and checks the host against the allow list (REQ-2.2 to 2.4). The allow list is read from `A11Y_MCP_ALLOWED_HOSTS` on each call, so tests can change it. Default hosts: `localhost`, `::1` (written `[::1]` in URLs), and any `127.x.x.x`.
2. Get the shared browser (`chromium.launch({ headless: true })`, started once, kept in a module variable, REQ-2.7). If launch fails with Playwright's "Executable doesn't exist" message, throw `ToolError` with the install command (REQ-2.12).
3. `browser.newContext({ viewport: { width: 1280, height: 800 } })` gives a clean context each call (REQ-2.6).
4. `context.route('**/*', ...)`: for requests where `request.isNavigationRequest()` and the frame is the main frame, abort when the target host is not allowed (REQ-2.5). Sub-resources are not blocked, because a local app may legitimately load a font or script from a CDN, and blocking would change the audit result.
5. `page.goto(url, { waitUntil: 'load', timeout: 15_000 })`. Check `response.status() < 400` (REQ-2.11). Then `page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => {})` (REQ-2.9).
6. Run `fn`. The whole call is wrapped in `Promise.race` with a 60-second timer that is always cleared (REQ-2.10). In `finally`, `context.close()` (REQ-2.8).

Error mapping: Playwright `TimeoutError` on `goto` becomes the load-limit message. `net::ERR_CONNECTION_REFUSED`, `ERR_NAME_NOT_RESOLVED` and similar become "cannot reach `<url>`: `<cause>`". The raw Playwright message is trimmed to its first line.

`check_contrast` never calls `withPage`, so it starts no browser (REQ-5.10).

### Why a fresh context per call

Cookies, local storage and service workers from one audit could change the next. A context costs a few milliseconds, while a new browser process costs much more, so the browser is shared and the context is not.

## Tool: `audit_page` (REQ-3)

`axeTags.ts`:

```ts
const A   = ['wcag2a', 'wcag21a'];
const AA  = [...A, 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const AAA = [...AA, 'wcag2aaa'];
export const tagsFor = (level) => ({ A, AA, AAA })[level];
export function criterionFromTag(tag: string): string | null  // /^wcag(\d)(\d)(\d{1,2})$/ -> `${1}.${2}.${3}`
```

`criterionFromTag('wcag2a')` and similar level tags do not match the regex (they have letters after the digit), so they return `null`. `wcag143` gives `1.4.3`, `wcag1410` gives `1.4.10`, and `wcag2411` gives `2.4.11`. The regex takes exactly one digit for the principle and one for the guideline, and the rest is the criterion. A unit test checks every tag from `new AxeBuilder`'s rule list that matches `^wcag\d{3,4}$` against the official WCAG 2.2 list in `axeTags.ts`, so a new axe tag that our parser mishandles fails a test. The level of a criterion comes from a small table (`CRITERIA`: number, name, level) for the A and AA criteria and the AAA ones axe checks, so the Result can show "1.4.3 Contrast (Minimum), AA".

Flow:

```ts
const results = await new AxeBuilder({ page }).withTags(tagsFor(level)).analyze();
```

Then:

- For each `violation`, read its `tags`, map them with `criterionFromTag`, and push the violation into each criterion's group (REQ-3.8). A violation with no criterion tag cannot occur with the WCAG-only tag set, but if it does, it goes into a group named `"unmapped"` so nothing is lost.
- Each node becomes `{ selector: node.target.join(' >> '), html: truncate(node.html, 200), failureSummary: node.failureSummary }`. axe reports an iframe or shadow-root path as nested arrays or as several array entries. Joining them with ` >> ` keeps the full path (REQ-3.10).
- Sort criteria by `(principle, guideline, criterion)` as numbers, and violations by an impact rank (`critical`, `serious`, `moderate`, `minor`), then by rule id (REQ-3.13).
- `incomplete` is mapped to `{ ruleId, nodeCount }` only (REQ-3.11).

Result shape (abbreviated):

```json
{
  "url": "http://127.0.0.1:5173/",
  "finalUrl": "http://127.0.0.1:5173/",
  "wcagLevel": "AA",
  "tags": ["wcag2a", "wcag21a", "wcag2aa", "wcag21aa", "wcag22aa"],
  "axeVersion": "4.10.x",
  "counts": { "violations": 3, "nodes": 4, "incomplete": 1 },
  "criteria": [
    { "criterion": "1.1.1", "name": "Non-text Content", "level": "A",
      "violations": [ { "ruleId": "image-alt", "impact": "critical", "help": "...", "helpUrl": "...",
        "nodes": [ { "selector": "img", "html": "<img src=...>", "failureSummary": "..." } ] } ] }
  ],
  "incomplete": [ { "ruleId": "color-contrast", "nodeCount": 2 } ],
  "note": "Automated checks cannot prove conformance. Items under incomplete need manual review."
}
```

`counts.nodes` counts nodes once even when a rule is listed under two criteria.

## Tool: `keyboard_walk` (REQ-4)

### Reading roles, names and selectors

`axTree.ts` opens a CDP session (`context.newCDPSession(page)`) and enables `Accessibility` and `DOM`. It offers:

- `describeFocused(session)`: evaluates the deep active element (following `shadowRoot.activeElement` and same-origin iframes) with `Runtime.evaluate`, gets its `objectId`, calls `Accessibility.getPartialAXTree({ objectId, fetchRelatives: false })`, and reads `role` and `name` from the first node. A selector comes from `Runtime.callFunctionOn` with the function in `selector.ts`.
- `getLandmarksAndHeadings(session)` for `page_outline`: described below.

The browser computes the accessible name with the accname algorithm, so the server does not have to re-implement it. This works only in Chromium, which is the only browser the server uses.

`selector.ts` exports a function body as a string. It builds a selector from the element up: use `#id` if the id is unique in the document, otherwise `tag:nth-of-type(n)` joined with ` > ` up to the nearest unique id or `html`. It escapes ids with `CSS.escape`. The selector identifies the element for a developer. It does not have to be the shortest.

### Walk loop

```
load page
focus start of document: evaluate document.activeElement?.blur(); window.scrollTo(0, 0); (focus is now on body)
steps = []
for i in 1..maxSteps:
  page.keyboard.press('Tab')
  cur = describeFocused()           // element id, role, name, selector, tag, inViewport, size, focusedStyle
  if cur is body/html (and i > 1) or focus left the document: stop 'left-document'
  if cur.key === steps[0]?.key:  stop 'wrapped'
  if cur.key === previous.key: trap (self loop)
  if cur.key in seen (and not first): trap (loop = steps from first sighting of cur to now)
  after the move, take the unfocused style of the previous element -> decide previous.hasVisibleFocus
  push step
after the loop: if stopped by max-steps, press Tab once more and decide the last step's focus style
```

Element identity ("key") is a per-walk integer. The walk stores each focused element in an in-page array `window.__a11yWalk` and compares by `===` in the page, so two elements with the same selector are never confused. The array is added to the page only in the isolated context and the context is closed afterwards, so nothing persists.

`hasVisibleFocus` (REQ-4.6, 4.7) is computed with this approach:

1. When an element gets focus, snapshot `getComputedStyle` for: `outlineStyle`, `outlineWidth`, `outlineColor`, `outlineOffset`, `boxShadow`, the four `border*Color` and `border*Width` values, `backgroundColor`, `color`, `textDecorationLine`, `textDecorationColor`. This is the focused snapshot.
2. After the next `Tab` moves focus away, snapshot the same properties on the previous element. This is the unfocused snapshot. Because the walk never calls `blur()` or `focus()` itself, page focus handlers run only as a real keyboard user would trigger them, and a trap is not created or hidden by the tool.
3. `hasVisibleFocus` is `true` when any property differs and the difference is visible: an outline that goes from `none` or width `0` to a style other than `none` with width above `0` and non-transparent colour; a change in `boxShadow` that adds a non-`none` shadow; or a change in border, background, text colour or decoration that is not transparent on both sides. Otherwise `false`. It is also `false` when the element is outside the viewport or has a zero-size box (REQ-4.7).

This is a heuristic. It cannot see an indicator drawn on a pseudo-element or a sibling, and it does not measure the indicator's contrast (WCAG 2.4.13 and 1.4.11). The README says so (REQ-8.6). The alternative is a screenshot diff of the element's box with and without focus. It would catch more cases but needs `blur()`/`focus()` calls (which fire page handlers and could disturb the walk) or two screenshots per step, and the result depends on anti-aliasing. The style snapshot is deterministic, so REQ-4.13 holds.

### Stopping and traps

- `wrapped`: the current element is the first recorded one. In Chromium, tabbing past the last focusable element moves focus to the browser UI or back to the document start. The first implementation task checks what headless Chromium does, and the loop handles both cases (`left-document` when the active element becomes `body`, `wrapped` when it is the first element again). The tests pin the observed behaviour.
- Trap, same element twice in a row: `Tab` did not move focus. This is a trap unless the element is the only focusable element, which is `wrapped` because it is also the first element.
- Trap, loop that does not include the first element: a revisit of element X where X is not the first. The loop is the steps from X's first sighting to now.
- On a trap, the tool presses `Shift+Tab`, checks whether focus left the loop, and if not presses `Escape` and checks again. The trap record is `{ kind: 'self-loop' | 'cycle', elements: Step[], escapedWith: 'Shift+Tab' | 'Escape' | null }`. WCAG 2.1.2 allows a documented non-standard exit, so `escapedWith` is information for the developer and not an automatic failure of the keyboard handling.
- A trap on the first element that cycles back to itself looks like a wrap. The tool cannot tell the two apart without knowing the page's intent, so this case is listed in the README under limits.

The tool presses only `Tab`, `Shift+Tab` and `Escape` (REQ-4.12). It never presses `Enter` or `Space`, so it cannot submit a form.

Result shape (abbreviated):

```json
{
  "url": "...",
  "steps": [
    { "index": 1, "selector": "a.skip-link", "tag": "a", "role": "link",
      "name": "Skip to main content", "hasVisibleFocus": true }
  ],
  "summary": {
    "stepCount": 9, "distinctElements": 9, "stoppedBecause": "wrapped",
    "noVisibleFocus": [],
    "noAccessibleName": [],
    "trap": null
  }
}
```

`noVisibleFocus` and `noAccessibleName` hold step indexes plus selectors, so the report can be read without looking back at the steps.

## Tool: `check_contrast` (REQ-5)

`color.ts` parses with small anchored regular expressions and returns `{ r, g, b, a }` with channels 0 to 255 and `a` from 0 to 1. Hex forms expand `#rgb` to `#rrggbb` and read the optional alpha pair. `rgb()` and `rgba()` accept integers and percentages for channels and a number or percentage for alpha. Anything else throws `ToolError` naming the parameter and listing the accepted formats (REQ-5.3).

`contrast.ts`:

```ts
const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export const luminance = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
export const LARGE_PX = 24, LARGE_BOLD_PX = 14 * 96 / 72;   // 18.666...
export const isLargeText = (px: number, bold: boolean) => px >= LARGE_PX || (bold && px >= LARGE_BOLD_PX);
```

Alpha blending (REQ-5.5): `out = fg.a * fg + (1 - fg.a) * bg` per channel, with the blended colour reported. A translucent background throws, because its colour depends on what is behind it.

The displayed ratio is `Math.floor(ratio * 100) / 100`. The pass decisions use the unrounded `ratio >= 4.5` or `>= 3`. Rounding down avoids reporting "4.5" for a failing 4.499. Floating-point rounding could still make a mathematically exact 4.5 come out as 4.4999999; the unit tests include a pair known to hit the boundary and the design accepts a small epsilon (`ratio + 1e-9 >= threshold`) only for this. The epsilon is documented in the code.

Result:

```json
{
  "foreground": { "input": "#767676", "hex": "#767676" },
  "background": { "input": "#ffffff", "hex": "#ffffff" },
  "ratio": 4.54,
  "textSize": "normal",
  "applicable": "aaNormalText",
  "results": {
    "aaNormalText": { "criterion": "1.4.3",  "required": 4.5, "pass": true },
    "aaLargeText":  { "criterion": "1.4.3",  "required": 3,   "pass": true },
    "nonText":      { "criterion": "1.4.11", "required": 3,   "pass": true }
  }
}
```

## Tool: `page_outline` (REQ-6)

Landmarks and headings come from the accessibility tree, so the tool needs no table of implicit roles and it ignores hidden content (REQ-6.4). The steps:

1. `Accessibility.getFullAXTree`.
2. Keep nodes that are not `ignored` and whose role is one of the landmark roles or `heading`. `region` and `form` are kept only when `name` is non-empty (REQ-6.3). Headings take `level` from the node's `level` property.
3. For each kept node with a `backendDOMNodeId`, call `DOM.resolveNode`, then `Runtime.callFunctionOn` with the selector function (the same one `keyboard_walk` uses).
4. Document order: `getFullAXTree` returns nodes in tree order, which is document order for these roles.
5. Title from `document.title`, language from `document.documentElement.getAttribute('lang') ?? ''`. Both are cut to 200 characters (REQ-2.14).

`issues` come from one pure function `findOutlineIssues({ title, lang, landmarks, headings })`, tested on its own without a browser. Rules, in output order: title (2.4.2), `lang` (3.1.1), `main` count (1.3.1), duplicate unnamed `navigation` (1.3.1), `h1` count (1.3.1), first heading not `h1` (1.3.1), skipped level (1.3.1), empty heading (2.4.6). A skipped level means a heading whose level is more than one greater than the one before it (an `h4` after an `h2` is a skip). Moving back up (an `h2` after an `h4`) is allowed. Each issue is `{ id, criterion, message, selector? }`.

## Registration in Kiro (REQ-7)

Kiro reads MCP servers from `.kiro/settings/mcp.json` (workspace level) and `~/.kiro/settings/mcp.json` (user level), and the workspace file takes precedence. The workspace file is the right place because the server belongs to this project. The entry:

```json
{
  "mcpServers": {
    "a11y": {
      "command": "node",
      "args": ["mcp/a11y-mcp/dist/index.js"],
      "env": {},
      "disabled": false,
      "autoApprove": ["check_contrast", "page_outline"]
    }
  }
}
```

- `check_contrast` is pure maths and `page_outline` only reads an allowed page, so both run without a prompt. `audit_page` and `keyboard_walk` also only read, but they take longer and `keyboard_walk` sends key presses to the page, so the user approves each call. Kiro's guidance is to review every `autoApprove` entry.
- The relative `args` path assumes Kiro starts workspace servers with the workspace root as the working directory. The registration task checks this by connecting from Kiro. IF it does not hold, THEN the fallback is `["${workspaceFolder}/mcp/a11y-mcp/dist/index.js"]` if Kiro supports it, or an `npm --prefix mcp/a11y-mcp run start --silent` command. Any fallback goes into the README. No absolute path is written (REQ-7.5).
- Kiro reloads `mcp.json` on save, so no restart is needed. Because `dist/` is not committed, the user must run `npm run build` once; the README says so, and the server fails visibly in Kiro's MCP panel until then.
- At the time of writing, `.kiro/settings/` does not exist in this workspace. If a `mcp.json` exists when the task runs, the entry is merged into it, not written over it (REQ-7.4).

## Fixtures (REQ-9)

Fixtures are static HTML served by `tests/helpers/fixture-server.ts` (`node:http`, bound to `127.0.0.1`, port 0, serving the fixtures folder with `Content-Type: text/html; charset=utf-8`). `start()` returns `{ baseUrl, close }`. A route `/missing` is not defined, so it returns 404 for REQ-9.10.

| File | Purpose | Known content |
|---|---|---|
| `clean.html` | zero violations | `lang="en"`, unique title, skip link first, `header`, `nav` with `aria-label`, `main`, `footer`, one `h1` then `h2`, a labelled input, a button, links, a `:focus-visible` outline of 3px with 3:1 contrast, text at 7:1. |
| `violations.html` | known axe violations | `<img src="x.png">` with no `alt` (image-alt, 1.1.1), grey text `#aaa` on white (color-contrast, 1.4.3), `<button></button>` with an icon only (button-name, 4.1.2), an `<input>` with no label (label, 1.3.1 and 4.1.2). It still has `lang` and a title so those do not add noise. |
| `trap.html` | keyboard trap | Three buttons. A `focusout` listener on the container returns focus to the middle button, so tabbing from it loops between the second and third buttons. A fourth link after the container is never reached by `Tab`. |
| `no-focus.html` | no visible focus | Links and buttons with `outline: none` and no replacement style. |
| `outline-issues.html` | outline issues | No `<title>`, no `lang`, headings `h2` then `h4`, two `<main>` elements, an empty `<h3>`, two unnamed `<nav>`s. |

Steering applies to the fixtures. `accessibility.md` says every page needs an axe test. `clean.html` follows the rules and is tested through `audit_page` (REQ-9.5). The four other fixtures break rules on purpose, and each opens with an HTML comment that says so, so nobody copies them as an example or "fixes" them. Their tests assert the exact violations. The tests use `127.0.0.1`, so the default host rule needs no override.

For a trap page, a test must not hang. The walk stops at the trap or at `maxSteps`, and every call has the 60-second ceiling. A per-test timeout of 30 seconds is set in `vitest.config.ts`, and the first-run Chromium start is covered by a shared `beforeAll` with a 60-second hook timeout.

## Test plan

| File | Level | What it proves |
|---|---|---|
| `check-contrast.test.ts` | pure, no browser | REQ-5 in full, including boundaries and every error. |
| `url-rules.test.ts` | pure for scheme and host rules, browser for 404 and refused | REQ-2. |
| `audit-page.test.ts` | browser + fixtures | REQ-3, plus the zero-violation axe test for `clean.html`. |
| `keyboard-walk.test.ts` | browser + fixtures | REQ-4. |
| `page-outline.test.ts` | pure for `findOutlineIssues`, browser for the rest | REQ-6. |
| `protocol.test.ts` | in-memory SDK client | REQ-1.3 to 1.5, 1.9, 2.13. |
| `stdio.test.ts` | real child process | REQ-1.2, 1.6, 1.7, 9.12. Runs after a build (`pretest` script). |

The browser tests share one browser through the module-level cache in `browser.ts`, and `afterAll` calls `closeBrowser()`. `npm test` runs `npm run build` first through `pretest`, so `stdio.test.ts` always tests current code. Tests that hit a port use port 0, so they do not clash with a running dev server.

## Risks and open points

- **Tab wrap behaviour in headless Chromium.** Observed in task 6.1: after the last focusable element, one more `Tab` puts focus on `<body>` and `document.hasFocus()` becomes `false` (focus has moved to the browser UI). The next `Tab` returns to the first element. A page without a trap therefore ends as `left-document`. `wrapped` happens only when the page itself moves focus back to its first element. Tests pin this.
- **Transitions.** A skip link that slides in with a CSS transition is off-screen for its first frames. The walk waits for running finite animations and transitions (capped at one second) before it measures position and style. `tests/fixtures/transition.html` covers it.
- **Focus style heuristic.** It can miss indicators drawn on other elements, and it can count a change that is not a focus indicator (for example a hover style left from a prior mouse position, which cannot happen here because the mouse never moves). The README states the limit.
- **Relative `args` path in `mcp.json`.** Depends on Kiro's working directory. Checked in the registration task.
- **axe tag drift.** A new axe release may add WCAG tags. The tag test fails when our parser or criteria table does not cover one.
- **SDK API changes.** The SDK's `registerTool` and `McpServer` names are used as in its 1.x documentation. The version is pinned with `^` to the 1.x line and the implementer reads the installed SDK's types before writing the registration code.
- **Untrusted page text.** Titles, headings and HTML snippets flow to the agent. They are truncated and labelled as data, but a hostile page could still try to steer an agent. The default host rule keeps the server pointed at local apps.

## Implementation notes

- The redirect guard (REQ-2.5) uses the CDP `Fetch` domain on document requests, because Playwright's `page.route()` does not see redirect hops. Sub-resources are not paused.
- `trap.html` traps focus with `keydown` handlers on the container (Tab on the last button, Shift+Tab on the middle one), which is deterministic. The `focusout` approach in the table above races with the browser's own focus move.
- `tests/fixtures/transition.html` is a sixth fixture, an accessible page with a sliding skip link.
- `audit-page.test.ts` imports `axe-core` directly to read its rule list. It is installed as a dependency of `@axe-core/playwright`, so no package was added.
- `tests/lib-basics.test.ts` holds the unit tests for `errors.ts` and `text.ts` (task 1.3).

