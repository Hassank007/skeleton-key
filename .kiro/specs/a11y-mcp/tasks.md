# Accessibility MCP Server (a11y-mcp): Implementation Tasks

All paths are relative to `mcp/a11y-mcp/` unless stated. Run commands from `mcp/a11y-mcp/`. Mark a task `[x]` only after its checks pass. This spec was written without implementing anything, so every task starts unchecked.

## 1. Package scaffold

- [x] 1. Create the package and tooling
  - [x] 1.1 Create `package.json` (`"type": "module"`, `engines.node >=20`, scripts `build`, `start`, `lint`, `test`, `pretest`), `tsconfig.json` (strict, NodeNext), `tsconfig.build.json`, `eslint.config.js` (typescript-eslint strict, `no-console` allowing only `console.error`), `vitest.config.ts` (30 s test timeout, 60 s hook timeout) and `.gitignore`. *(REQ-1.1, 1.8, 10.1, 10.6)*
  - [x] 1.2 Install the dependencies listed in `design.md` and no others. Confirm `npx playwright install chromium` works. *(REQ-10.3)*
  - [x] 1.3 Create `src/lib/log.ts`, `src/lib/errors.ts` (`ToolError`, conversion to an MCP error result) and `src/lib/text.ts` (`truncate` to 200 characters), each with a small unit test. *(REQ-1.6, 2.13, 2.14)*

## 2. Contrast tool (no browser)

- [x] 2. Build `check_contrast`
  - [x] 2.1 Create `src/lib/color.ts`: parse `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`; blend alpha; throw `ToolError` naming parameter and value. *(REQ-5.2, 5.3, 5.5)*
  - [x] 2.2 Create `src/lib/contrast.ts`: luminance with `0.04045` and `2.4`, ratio, `isLargeText` (24 px, or bold at 14 pt). *(REQ-5.6, 5.9)*
  - [x] 2.3 Create `src/tools/checkContrast.ts` with the Result shape from the design: ratio rounded down to two places, decisions on the unrounded ratio. *(REQ-5.1, 5.4, 5.7, 5.8, 5.10, 5.11)*
  - [x] 2.4 Write `tests/check-contrast.test.ts` for everything in REQ-9.8, including a pair that lands exactly on 4.5. *(REQ-9.8)*

## 3. Browser and URL layer

- [x] 3. Load pages safely
  - [x] 3.1 Create `src/lib/url.ts`: scheme check, default allowed hosts, `A11Y_MCP_ALLOWED_HOSTS` (read on each call, `*` allowed), and the error messages. *(REQ-2.1 to 2.4)*
  - [x] 3.2 Create `src/lib/browser.ts`: lazy shared Chromium, `withPage` with a fresh context, the main-frame navigation guard, `load` plus 2 s network-idle wait, 15 s and 60 s limits, status check, missing-browser message, `closeBrowser()`. *(REQ-2.5 to 2.12)*
  - [x] 3.3 Create `tests/helpers/fixture-server.ts` (`node:http`, `127.0.0.1`, port 0) and the five fixtures with their header comments. Make `clean.html` follow `.kiro/steering/accessibility.md`. *(REQ-9.2, 9.3, 9.4, 9.5)*
  - [x] 3.4 Write `tests/url-rules.test.ts`: rejected schemes, rejected host, extra allowed host, `*`, refused connection, 404, redirect to a disallowed host. *(REQ-9.10)*

## 4. audit_page

- [x] 4. Build `audit_page`
  - [x] 4.1 Create `src/lib/axeTags.ts`: level to tags, `criterionFromTag`, and the criteria name and level table. *(REQ-3.2, 3.3, 3.7)*
  - [x] 4.2 Create `src/tools/auditPage.ts`: run `AxeBuilder` with the tags, group by criterion, list under every mapped criterion, build selectors with ` >> ` for nested targets, sort deterministically, map incomplete items. *(REQ-3.1, 3.4 to 3.6, 3.8 to 3.13)*
  - [x] 4.3 Write `tests/audit-page.test.ts` for REQ-9.6: the violations fixture by criterion, rule id and selector; zero violations for `clean.html`; tags for `A`, `AA`, `AAA`; the tag-to-criterion mapping, including a test that checks every `wcag` tag in axe's rule list against the table. *(REQ-9.4, 9.5, 9.6)*

## 5. page_outline

- [x] 5. Build `page_outline`
  - [x] 5.1 Create `src/lib/selector.ts` (in-page selector function) and `src/lib/axTree.ts` (CDP session, `getFullAXTree`, resolve nodes to selectors). *(REQ-6.4)*
  - [x] 5.2 Create `src/tools/pageOutline.ts` with the pure `findOutlineIssues` function and the page reading code. *(REQ-6.1 to 6.3, 6.5 to 6.8)*
  - [x] 5.3 Write `tests/page-outline.test.ts`: unit tests for `findOutlineIssues` (one case per issue), and browser tests on `clean.html` and `outline-issues.html`. *(REQ-9.9)*

## 6. keyboard_walk

- [x] 6. Build `keyboard_walk`
  - [x] 6.1 Observe what headless Chromium does when `Tab` passes the last focusable element on `clean.html` and record it in a code comment and in the design's Risks section. *(REQ-4.8)*
  - [x] 6.2 Add `describeFocused` to `src/lib/axTree.ts`: deep active element, role, name, selector, viewport and size checks, style snapshot. *(REQ-4.4, 4.5, 4.7)*
  - [x] 6.3 Create `src/tools/keyboardWalk.ts`: the walk loop, stop reasons, focus-style decision, trap detection with `Shift+Tab` and `Escape`, summary. Press no other keys. *(REQ-4.1 to 4.4, 4.6 to 4.13)*
  - [x] 6.4 Write `tests/keyboard-walk.test.ts` for REQ-9.7, plus a test that two walks of the same page return equal results. *(REQ-4.13, 9.7)*

## 7. Server, protocol and process

- [x] 7. Register the tools and start the server
  - [x] 7.1 Read the installed SDK's type definitions for `McpServer.registerTool` and the stdio and in-memory transports before writing code. *(REQ-1.2)*
  - [x] 7.2 Create `src/server.ts` (`createServer`, four tools with descriptions, input and output schemas, error conversion) and `src/index.ts` (stdio, shutdown hooks that close the browser). *(REQ-1.2 to 1.9)*
  - [x] 7.3 Write `tests/protocol.test.ts` using the SDK's in-memory transport and client: four tool names, schemas with defaults, one successful call, one invalid-argument call that starts no browser. *(REQ-9.11)*
  - [x] 7.4 Write `tests/stdio.test.ts`: start `dist/index.js` over stdio with the SDK's stdio client, list the tools, call `check_contrast`, check the shutdown on stdin close and that stdout carried only protocol messages. *(REQ-9.12)*

## 8. Registration and documentation

- [x] 8. Register the server in Kiro and document it
  - [x] 8.1 Create or merge `.kiro/settings/mcp.json` (repository root) with the `a11y` entry from the design. Keep any existing entries. Validate the JSON. *(REQ-7.1 to 7.6)*
  - [x] 8.2 Confirm the relative `args` path works from Kiro's MCP panel. IF it does not, THEN apply the fallback in the design and note it in the README. *(REQ-7.2)*
  - [x] 8.3 Write `README.md` with every section in REQ-8, using the real output of each tool for its example. *(REQ-8.1 to 8.9)*

## 9. Final checks

- [x] 9. Run every check and fix every failure
  - [x] 9.1 Run `npm run lint`, `npx tsc --noEmit`, `npm run build` and `npm test` in `mcp/a11y-mcp/`; all must pass with no warnings. Fix failures in the code, not in the tests. *(REQ-9.14, 10.1, 10.2)*
  - [x] 9.2 Run `git status` and confirm nothing under `skeleton/` or `apps/` changed because of this spec and no temporary files remain. *(REQ-10.5)*
  - [x] 9.3 Use the server against the skeleton: start its dev or preview server, run `audit_page`, `keyboard_walk` and `page_outline` on `/` and `/about`, and save the findings to `docs/a11y-mcp-skeleton-audit.md`. Report skeleton defects found; do not fix them in this spec. *(REQ-10.5)*
  - [x] 9.4 Follow-up for the owner, outside this spec: add `mcp/` to the tree in `.kiro/steering/structure.md`.
