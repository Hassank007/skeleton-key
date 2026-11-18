# Accessibility MCP Server (a11y-mcp): Requirements

This spec describes `mcp/a11y-mcp`, a Model Context Protocol (MCP) server that lets Kiro check a running web app for accessibility problems. It exposes four tools: `audit_page`, `keyboard_walk`, `check_contrast` and `page_outline`. Requirements use EARS notation. WCAG references are to WCAG 2.2.

**Scope.** The server package, its four tools, its registration in Kiro's workspace MCP config, its README, and its unit tests against local fixture pages. Out of scope: changing the Trusted Tester agent or the hooks to call the server, the Accessibility Conformance Report generator, a remote (HTTP) transport, browsers other than Chromium, and any change to `skeleton/` or `apps/`. Using the server to audit the skeleton is a final, separate task (see `tasks.md`).

**Terms.**
- *Tool*: an MCP tool the server registers.
- *Allowed host*: a host name the server may load pages from (REQ-2).
- *Fixture*: a small HTML page in `mcp/a11y-mcp/tests/fixtures/` served by a local test server. Some fixtures contain violations on purpose.
- *Accessibility tree*: the browser's accessibility tree, read through the Chrome DevTools Protocol (CDP).
- *Result*: the object a tool returns, both as `structuredContent` and as one JSON text block.

---

## REQ-1 Server package and protocol

**User story:** As a Kiro user, I want a standard MCP server I can start with one command, so that Kiro can call it like any other MCP server.

### Acceptance criteria

- 1.1 The system SHALL provide a standalone Node package at `mcp/a11y-mcp/` with its own `package.json`, written in TypeScript with `strict` mode on, as ES modules, for Node 20 or later.
- 1.2 The system SHALL implement the server with the official `@modelcontextprotocol/sdk` package and SHALL use its stdio transport.
- 1.3 The system SHALL register exactly four tools named `audit_page`, `keyboard_walk`, `check_contrast` and `page_outline`.
- 1.4 Each tool SHALL have a description that says what it checks, and an input schema that gives every parameter a type, a default (where the parameter has one) and a one-line description.
- 1.5 Each tool SHALL declare an output schema, and SHALL return a Result that matches it.
- 1.6 The system SHALL write only MCP protocol messages to standard output. WHEN the server logs anything, THEN it SHALL write to standard error.
- 1.7 WHEN the standard input stream closes or the process receives `SIGINT` or `SIGTERM`, THEN the system SHALL close any open browser and exit.
- 1.8 The system SHALL provide `npm run build`, which compiles to `dist/`, and a start command that runs `dist/index.js`.
- 1.9 WHEN a tool receives arguments that fail its input schema, THEN the system SHALL return an MCP error result that names the invalid parameter, and SHALL NOT crash or start a browser.

---

## REQ-2 Page loading, safety and errors

**User story:** As a developer, I want the tools to load only the pages I mean them to load and to fail with clear messages, so that an agent cannot use the server to probe other machines and I can fix a failure without reading logs.

### Acceptance criteria

- 2.1 The system SHALL accept only `http:` and `https:` URLs for tools that take a `url`. WHEN the URL has another scheme (`file:`, `javascript:`, `data:` and so on) or cannot be parsed, THEN the tool SHALL return an error result that says only `http` and `https` URLs are accepted.
- 2.2 The system SHALL by default allow only the hosts `localhost`, `127.0.0.1` (and the rest of `127.0.0.0/8`) and `::1`.
- 2.3 WHERE the environment variable `A11Y_MCP_ALLOWED_HOSTS` is set to a comma-separated list of host names, the system SHALL allow those hosts in addition to the defaults. WHERE the value is `*`, the system SHALL allow every host.
- 2.4 IF the URL's host is not an allowed host, THEN the tool SHALL return an error result that names the host and tells the user to set `A11Y_MCP_ALLOWED_HOSTS`, and SHALL NOT open the page.
- 2.5 WHEN the page redirects, THEN the system SHALL apply the same host check to every top-level navigation and SHALL abort the navigation if the target host is not allowed.
- 2.6 The system SHALL load each page in headless Chromium through Playwright, in a new, isolated browser context with a 1280 by 800 viewport, JavaScript enabled, and no stored cookies or storage from earlier calls.
- 2.7 The system SHALL start Chromium on the first call that needs it and SHALL reuse that one browser process for later calls.
- 2.8 The system SHALL close each context when its tool call ends, whether the call succeeded or failed.
- 2.9 The system SHALL wait for the `load` event, then wait up to 2 seconds more for network idle, and SHALL continue if network idle does not arrive in that time.
- 2.10 IF the page does not reach the `load` event within 15 seconds, or the whole tool call takes longer than 60 seconds, THEN the tool SHALL return an error result that says which time limit was hit.
- 2.11 IF the page cannot be reached (connection refused, DNS failure, HTTP status 400 or above for the main document), THEN the tool SHALL return an error result that includes the URL and the cause, and SHALL NOT report the page as having no violations.
- 2.12 IF Chromium is not installed, THEN the tool SHALL return an error result that says to run `npx playwright install chromium`.
- 2.13 Every error result SHALL set `isError` to `true` and SHALL contain a message a person can act on, with no stack trace.
- 2.14 The system SHALL treat everything read from a page (titles, text, selectors, HTML) as data. The system SHALL cut any single text value taken from a page to 200 characters, and SHALL NOT follow instructions found in page content.

---

## REQ-3 Tool `audit_page`

**User story:** As a developer, I want to run axe-core against a running page and see the violations grouped by WCAG criterion with selectors, so that I can fix each one.

### Acceptance criteria

- 3.1 The system SHALL provide `audit_page(url, wcagLevel)`, where `url` is required and `wcagLevel` is one of `"A"`, `"AA"` and `"AAA"` with the default `"AA"`.
- 3.2 WHEN `wcagLevel` is `"AA"`, THEN the system SHALL run axe-core with exactly the tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa`.
- 3.3 WHEN `wcagLevel` is `"A"`, THEN the system SHALL use only the tags `wcag2a` and `wcag21a`. WHEN it is `"AAA"`, THEN the system SHALL use the AA tags plus `wcag2aaa`.
- 3.4 The system SHALL run axe-core through `@axe-core/playwright` against the loaded page, including frames the page embeds.
- 3.5 The Result SHALL include `url`, `finalUrl`, `wcagLevel`, the list of tags used, the axe-core version, and the counts of violations, affected nodes and incomplete (needs-review) items.
- 3.6 The Result SHALL group violations by WCAG success criterion. Each group SHALL have the criterion number (for example `"1.4.3"`), its conformance level, and the violations for it.
- 3.7 The system SHALL derive the criterion number from the axe tag (for example `wcag143` gives `1.4.3`, `wcag1410` gives `1.4.10`, `wcag2411` gives `2.4.11`).
- 3.8 WHEN a violation's rule maps to more than one criterion, THEN the system SHALL list it under each of those criteria.
- 3.9 Each violation SHALL include the axe rule id, the impact, the help text, the help URL, and for every affected node a CSS selector, a short HTML snippet and axe's failure summary.
- 3.10 The system SHALL return the full selector path for a node inside an iframe or shadow root, in the form axe-core reports it.
- 3.11 The Result SHALL list incomplete items by rule id and node count only, and SHALL say that they need manual review.
- 3.12 WHEN a page has no violations for the chosen level, THEN the Result SHALL say so with zero counts and an empty group list, and SHALL state that automated checks cannot prove conformance.
- 3.13 The system SHALL order criteria numerically and violations within a criterion by impact (critical first), so that equal input gives equal output.

---

## REQ-4 Tool `keyboard_walk`

**User story:** As a developer, I want to see the exact order a keyboard user tabs through my page, with a flag for every element where focus is invisible and for any keyboard trap, so that I can check WCAG 2.1.1, 2.1.2, 2.4.3 and 2.4.7 without tabbing by hand.

### Acceptance criteria

- 4.1 The system SHALL provide `keyboard_walk(url, maxSteps)`, where `url` is required and `maxSteps` is an integer from 1 to 200 with the default 50.
- 4.2 WHEN `maxSteps` is outside 1 to 200 or is not an integer, THEN the tool SHALL return an error result that names the allowed range (see REQ-1.9).
- 4.3 The system SHALL load the page, move keyboard focus to the start of the document, and then press `Tab` through the page, up to `maxSteps` times.
- 4.4 After each `Tab`, the system SHALL record a step with its index, a CSS selector, the tag name, the role, the accessible name, and whether the element has a visible focus indicator (`true` or `false`).
- 4.5 The system SHALL take the role and the accessible name from the browser's accessibility tree, and SHALL report an empty accessible name as an empty string.
- 4.6 The system SHALL decide that an element has a visible focus indicator WHEN, between the moment it holds focus and the moment focus has left it, at least one of these computed styles changes in a way that can be seen: outline (style, width, colour or offset), box-shadow, border colour or width, background colour, text colour, or text decoration.
- 4.7 The system SHALL report `hasVisibleFocus` as `false` for a focused element that is outside the viewport or has no visible size.
- 4.8 The system SHALL stop the walk, and report the reason, in the first of these cases: focus returns to the first recorded element (`wrapped`), focus leaves the document (`left-document`), a trap is detected (`trap`), or `maxSteps` is reached (`max-steps`). WHEN the page has no focusable element, THEN the reason SHALL be `no-focusable`.
- 4.9 The system SHALL detect a keyboard trap WHEN focus stays on the same element after a `Tab`, or WHEN focus returns to an element other than the first one before the walk has wrapped. The trap record SHALL list the elements in the loop.
- 4.10 WHEN a trap is detected, THEN the system SHALL try `Shift+Tab` and then `Escape`, and SHALL report in the trap record which key, if any, moved focus out of the loop.
- 4.11 The Result SHALL include a summary with the number of steps, the number of distinct elements, the stop reason, the list of steps where `hasVisibleFocus` is `false`, the list of steps with an empty accessible name, and the trap record or `null`.
- 4.12 The system SHALL NOT press any key other than `Tab`, `Shift+Tab` and `Escape`, and SHALL NOT click or type, so that the walk does not submit forms or change the page's data.
- 4.13 WHEN the same URL and page state are walked twice, THEN the system SHALL return the same steps in the same order.

---

## REQ-5 Tool `check_contrast`

**User story:** As a developer, I want to check a colour pair against the WCAG thresholds without opening a page, so that I can pick colours that pass before I write the CSS.

### Acceptance criteria

- 5.1 The system SHALL provide `check_contrast(foreground, background, fontSizePx, bold)`, where `foreground`, `background` and `fontSizePx` are required and `bold` is a boolean with the default `false`.
- 5.2 The system SHALL accept colours as `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(r, g, b)` and `rgba(r, g, b, a)`, ignoring letter case and surrounding spaces.
- 5.3 IF a colour cannot be parsed, THEN the tool SHALL return an error result that names the parameter and the value, and lists the accepted formats.
- 5.4 IF `fontSizePx` is not a finite number greater than 0, THEN the tool SHALL return an error result that names the parameter.
- 5.5 IF `background` has an alpha below 1, THEN the tool SHALL return an error result that says the background must be opaque. WHEN `foreground` has an alpha below 1, THEN the system SHALL blend it over `background` before it computes the ratio, and SHALL report the blended colour.
- 5.6 The system SHALL compute the relative luminance and contrast ratio as WCAG 2.2 defines them: linearise sRGB channels with the threshold `0.04045` and the exponent `2.4`, weight them by `0.2126`, `0.7152` and `0.0722`, and divide `(L1 + 0.05)` by `(L2 + 0.05)` with `L1` the lighter colour.
- 5.7 The Result SHALL include the ratio rounded down to two decimal places, so that a ratio of 4.499 is never shown as 4.5, and SHALL decide pass or fail on the unrounded ratio.
- 5.8 The Result SHALL include a pass or fail with the required ratio for each of: AA normal text (4.5:1, criterion 1.4.3), AA large text (3:1, criterion 1.4.3), and non-text content (3:1, criterion 1.4.11).
- 5.9 The system SHALL classify the text as large WHEN `fontSizePx` is at least 24, or WHEN `bold` is `true` and `fontSizePx` is at least 14 points (18.666 pixels). The Result SHALL include this classification and an `applicable` field that names which of the text results applies.
- 5.10 The tool SHALL NOT open a browser and SHALL return within 100 milliseconds.
- 5.11 WHEN the colours are the same, THEN the ratio SHALL be 1. WHEN they are black and white, THEN the ratio SHALL be 21.

---

## REQ-6 Tool `page_outline`

**User story:** As a developer, I want the title, language, landmarks and heading outline of a running page, so that I can check WCAG 1.3.1, 2.4.1, 2.4.2, 2.4.6 and 3.1.1 at a glance.

### Acceptance criteria

- 6.1 The system SHALL provide `page_outline(url)`, where `url` is required.
- 6.2 The Result SHALL include the document title (an empty string when there is none) and the value of the `lang` attribute on the root element (an empty string when there is none).
- 6.3 The Result SHALL list landmarks in document order. Each landmark SHALL have its role, its accessible name (empty when none) and a CSS selector. The roles SHALL be `banner`, `navigation`, `main`, `complementary`, `contentinfo`, `search`, and `region` or `form` when they have an accessible name.
- 6.4 The system SHALL take landmarks, headings and their names from the browser's accessibility tree, so that implicit roles (`<nav>`, `<main>`, `<h2>`) and explicit roles (`role="navigation"`, `role="heading" aria-level="2"`) are both found, and elements hidden from assistive technology are left out.
- 6.5 The Result SHALL list headings in document order. Each heading SHALL have its level (1 to 6), its text and a CSS selector.
- 6.6 The Result SHALL include an `issues` list. The system SHALL add an issue, with the WCAG criterion it concerns, for each of these cases: no title or an empty title (2.4.2), no `lang` or an empty `lang` (3.1.1), no `main` landmark or more than one (1.3.1), more than one `navigation` landmark where at least two have no distinct name (1.3.1), no heading of level 1 or more than one (1.3.1), the first heading is not level 1 (1.3.1), a heading level that skips more than one level downward (1.3.1), and an empty heading (2.4.6).
- 6.7 The Result SHALL list issues in a fixed order so that equal input gives equal output.
- 6.8 WHEN the page has no landmarks or no headings, THEN the Result SHALL return an empty list for it and the matching issue, and SHALL NOT return an error.

---

## REQ-7 Registration in Kiro

**User story:** As a Kiro user, I want the server registered for this project, so that I can use its tools in this workspace without setting anything up by hand.

### Acceptance criteria

- 7.1 The system SHALL add the server to the workspace MCP config at `.kiro/settings/mcp.json`, under `mcpServers`, with the name `a11y`, using the format in Kiro's MCP configuration documentation (`command`, `args`, `env`, `disabled`, `autoApprove`).
- 7.2 The entry SHALL start the built server with `node` and the path `mcp/a11y-mcp/dist/index.js`, and SHALL set `disabled` to `false`.
- 7.3 The system SHALL put `check_contrast` and `page_outline` in `autoApprove`, and SHALL NOT auto-approve `audit_page` or `keyboard_walk`, because those two start a browser and load a URL.
- 7.4 IF `.kiro/settings/mcp.json` already exists, THEN the system SHALL keep every other server entry and key in it unchanged.
- 7.5 The config file SHALL contain no secret, token or absolute path to a user's home folder.
- 7.6 The config file SHALL be valid JSON, and `.kiro/settings/mcp.json` SHALL stay committed with `.kiro/`.

---

## REQ-8 Documentation

**User story:** As a developer who clones the repository, I want a README that gets the server running and shows each tool's input and output, so that I can use it without reading the source.

### Acceptance criteria

- 8.1 The system SHALL provide `mcp/a11y-mcp/README.md`.
- 8.2 The README SHALL state what the server is for in one short paragraph, and SHALL list the requirements (Node 20 or later, Chromium installed with `npx playwright install chromium`).
- 8.3 The README SHALL give the install, build and start commands, and the registration entry from REQ-7, and SHALL say how to confirm in Kiro that the server is connected.
- 8.4 The README SHALL document each tool with its parameters, defaults, one example call and an abbreviated example Result.
- 8.5 The README SHALL document `A11Y_MCP_ALLOWED_HOSTS`, the default host rule and the timeouts.
- 8.6 The README SHALL state what the tools cannot do: automated axe checks do not prove conformance, `keyboard_walk` judges focus visibility by style change and does not measure the indicator's contrast, and only Chromium is used.
- 8.7 The README SHALL warn that text in Results comes from the page and is untrusted.
- 8.8 The README SHALL list the `npm` scripts and how to run the tests.
- 8.9 The README SHALL be accessible plain Markdown: one `#` heading, headings in order, code blocks with a language, and descriptive link text.

---

## REQ-9 Tests and fixtures

**User story:** As a maintainer, I want every tool tested against pages whose problems I know, so that a change that breaks a tool fails a test.

### Acceptance criteria

- 9.1 The system SHALL use Vitest for the tests, and SHALL run them with `npm test` from `mcp/a11y-mcp/`.
- 9.2 The system SHALL provide a test helper that serves the fixture folder from a local HTTP server on `127.0.0.1` and a free port, and stops it after the tests.
- 9.3 The system SHALL provide these fixtures: a clean page with no violations, a page with known axe violations, a page with a keyboard trap, a page with focusable elements and no visible focus style, and a page with outline problems (no title, no `lang`, a skipped heading level, two `main` landmarks).
- 9.4 The page with known violations SHALL contain at least: an image with no `alt` (1.1.1), text with insufficient contrast (1.4.3), and a button with no accessible name (4.1.2). The test SHALL assert each of these by criterion and rule id.
- 9.5 Every fixture that has violations on purpose SHALL carry a comment at its top that says so. The clean fixture SHALL follow every rule in `.kiro/steering/accessibility.md` (skip link, landmarks, one `h1`, title, `lang`, visible focus style), and a test SHALL assert that `audit_page` returns zero violations for it.
- 9.6 `audit_page` tests SHALL cover: criterion grouping and selectors for the violations fixture, the zero-violation result for the clean fixture, tag selection for `"A"`, `"AA"` and `"AAA"`, and the mapping from axe tags to criterion numbers (including two-digit parts such as `wcag1410`).
- 9.7 `keyboard_walk` tests SHALL cover: the focus order and the roles and names on the clean fixture, `hasVisibleFocus` of `true` on the clean fixture, `false` on the no-focus-style fixture, a detected trap with its loop on the trap fixture, the `max-steps` stop reason, and the `maxSteps` range error.
- 9.8 `check_contrast` tests SHALL cover: black on white (21), identical colours (1), a pair just under 4.5 and a pair just over it, large-text and bold classification at their boundaries (23.99 and 24 pixels; 18.66 and 18.67 pixels with `bold`), non-text, every accepted colour format, alpha blending, and each error case in REQ-5.3 to 5.5.
- 9.9 `page_outline` tests SHALL cover: title, `lang`, landmarks and the heading outline on the clean fixture, and each issue in REQ-6.6 on the outline-problems fixture.
- 9.10 The tests SHALL cover the URL rules in REQ-2: rejected schemes, a rejected host, `A11Y_MCP_ALLOWED_HOSTS` allowing an extra host, a refused connection, and a missing page (404).
- 9.11 The tests SHALL include one protocol test that connects an MCP client to the server through the SDK's in-memory transport and checks the four tool names, their schemas, one successful call, and one invalid-argument call.
- 9.12 The tests SHALL include one process test that starts the built `dist/index.js` over stdio, lists the tools, calls `check_contrast`, and checks that standard output carried only valid protocol messages.
- 9.13 The tests SHALL NOT use the network beyond `127.0.0.1`, and SHALL NOT depend on a test running before another.
- 9.14 WHEN `npm test` runs on a clean checkout with Chromium installed, THEN every test SHALL pass.

---

## REQ-10 Quality gates and dependencies

**User story:** As a maintainer, I want the package to meet the same checks as the rest of the repository, so that it stays correct and every dependency has a reason.

### Acceptance criteria

- 10.1 The package SHALL provide `npm run lint` using ESLint with `typescript-eslint` in its strict configuration, and the command SHALL finish with no errors and no warnings.
- 10.2 `npx tsc --noEmit` SHALL finish with no errors in the package.
- 10.3 The design document SHALL give the reason for each dependency (`tech.md`), and the package SHALL NOT add a dependency that the design does not list.
- 10.4 The package SHALL contain no code copied from another project.
- 10.5 The package SHALL NOT change files under `skeleton/` or `apps/`.
- 10.6 The package SHALL have its own `.gitignore` for `node_modules/` and `dist/`, and `.kiro/` SHALL stay committed.
- 10.7 The package SHALL NOT use `Math.random`, wall-clock time or fixed sleeps to decide a test result.
