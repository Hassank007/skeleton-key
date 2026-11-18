# Skeleton audit with a11y-mcp

Date: 2026-11-18. Target: the built skeleton (`skeleton/dist`) served by `vite preview` at `http://127.0.0.1:4173`, pages `/` and `/about`.

## How this was run

The `a11y` server was not available as a tool in the Kiro session, because writing `.kiro/settings/mcp.json` was blocked by a permission rule (see the task report). Instead, I started the built server (`node mcp/a11y-mcp/dist/index.js`) as a child process and called its tools through the MCP SDK's stdio client. These are the same server code and protocol that Kiro would use. Nothing in `skeleton/` was changed. `skeleton/dist` was rebuilt, and it is ignored by git.

Each page was checked with `audit_page` (level AA), `keyboard_walk` (`maxSteps` 50) and `page_outline`.

## Results

| Page | `audit_page` (AA) | `keyboard_walk` | `page_outline` |
|---|---|---|---|
| `/` | 0 violations, 0 incomplete | 4 steps, stopped `left-document`, no trap, every step has a visible focus indicator and an accessible name | title "Home — Skeleton Key", `lang` "en", no issues |
| `/about` | 0 violations, 0 incomplete | 5 steps, stopped `left-document`, no trap, every step has a visible focus indicator and an accessible name | title "About — Skeleton Key", `lang` "en", no issues |

axe-core version reported by the server: 4.14.1. Tags used: `wcag2a`, `wcag21a`, `wcag2aa`, `wcag21aa`, `wcag22aa`.

### Focus order

`/`:

1. link "Skip to main content" (`#root > a`)
2. link "Home"
3. link "About"
4. button "Reduce motion"

`/about` has the same four, then:

5. button "Open demo dialog" (`#main-content > article > button`)

### Landmarks and headings

Both pages: `banner` (`#root > header`), `navigation` named "Main", `main` (`#main-content`), `contentinfo` (`#root > footer`).

- `/`: h1 "Welcome to Skeleton Key".
- `/about`: h1 "About", h2 "What you get", h2 "Dialog demo".

## Skeleton defects found

None. No violation, keyboard trap, missing focus indicator, missing name or outline issue was reported on either page.

## What this does not show

- Automated axe checks cannot prove WCAG 2.2 AA conformance. Zero violations means axe found nothing it can detect.
- `keyboard_walk` presses only Tab (plus Shift+Tab and Escape when it finds a trap). It does not open the demo dialog on `/about`, so the dialog's focus trap, Escape handling and focus return are not covered here. The skeleton's own Playwright and unit tests cover them.
- Focus visibility is judged by a change in computed style. The tool does not measure the indicator's contrast (WCAG 1.4.11, 2.4.13).
- Only Chromium was used, only the light theme and the default motion setting.

## A defect in the tool, found and fixed by this audit

The first run reported `hasVisibleFocus: false` for the skeleton's skip link. The cause was in `keyboard_walk`, not in the skeleton. The skip link slides in with a 150 millisecond CSS transition, and the tool measured its position while it was still above the viewport. The tool now waits (up to one second) for running finite transitions and animations to finish before it measures. A regression test (`tests/fixtures/transition.html`) covers this. After the fix, the skip link reports a visible focus indicator.
