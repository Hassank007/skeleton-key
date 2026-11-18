# Skeleton Key

> Most websites are haunted for blind users. Skeleton Key exorcises them.

Skeleton Key is a lean Vite + React 19 + TypeScript starter that is built to be accessible from the first commit. It ships a semantic page shell (skip link, landmarks, one `h1` per page), route changes that move focus and announce the page title, a live-region announcer, accessible primitives (Button, Link, Field, Dialog, Toast, Tabs), design tokens with checked contrast in light and dark themes, and axe tests. It also ships an accessibility "brain" for Kiro: a Trusted Tester reviewer agent, hooks, property-based tests, a conformance-report generator and an MCP server that lets Kiro check the running app. Two apps are built from it to show it is flexible: **Grimoire** (a spooky catalogue to browse) and **Seance** (a multi-step booking form). Built for Kiroween 2026, Skeleton Crew category.

## The problem

The [WebAIM Million](https://webaim.org/projects/million/) report for 2026 found that 95.9% of the top one million home pages had detectable WCAG failures, with an average of 56 errors per page. Most teams have no accessibility specialist, so they retrofit accessibility late, at a high cost. Skeleton Key starts from "accessible" instead, and keeps Kiro checking while you build.

## What is in the repo

| Path | What it is |
|---|---|
| `skeleton/` | The template: page shell, accessible primitives, design tokens, unit, property and Playwright tests. |
| `apps/grimoire/` | App 1: a spooky spellbook catalogue with search, filters, a results list and a detail view (read-heavy). Runs on port 5174. |
| `apps/seance/` | App 2: a three-step séance booking form with validation, an error summary, a confirmation dialog and a success status message (form-heavy). Runs on port 5175. |
| `mcp/a11y-mcp/` | An MCP server with four tools: `audit_page` (axe-core, grouped by WCAG criterion), `keyboard_walk`, `check_contrast` and `page_outline`. See its [README](./mcp/a11y-mcp/README.md). |
| `scripts/` | `new-app.mjs` (creates `apps/<name>` from `skeleton/`), `acr.mjs` (writes `ACR.md` for an app), their tests, and `kiro-batches/` (the prompts and runner used to build the repo with the Kiro CLI). |
| `.kiro/` | Specs, steering files, the `trusted-tester` agent, four hooks and the MCP registration. It is committed on purpose. |
| `docs/` | Generated and written reports: Trusted Tester reviews, property-test findings, the a11y-mcp audit of the skeleton, and notes on the ACR generator and the Kiro brain. |

Each app is a standalone Vite project with its own `package.json`, so it can be deployed on its own.

## Quick start

Requires Node 20 or later and npm.

```bash
# 1. Install (each folder has its own package.json)
cd skeleton && npm install

# 2. Run the dev server (the skeleton uses Vite's default port, 5173)
npm run dev
```

Grimoire and Seance work the same way: `cd apps/grimoire` (or `apps/seance`), `npm install`, `npm run dev`.

**Test** (run in `skeleton/`, `apps/grimoire/` or `apps/seance/`):

```bash
npm run lint          # ESLint with jsx-a11y
npx tsc --noEmit      # type check
npm test              # Vitest, Testing Library, vitest-axe, fast-check
npx playwright install chromium   # once
npm run test:e2e      # Playwright with @axe-core/playwright
```

**Test the MCP server and the scripts:**

```bash
cd mcp/a11y-mcp && npm install && npx playwright install chromium && npm test
cd ../..        && npm run test:scripts      # from the repo root
```

**Create a new app** from the skeleton (from the repo root):

```bash
npm run new-app my-app    # creates apps/my-app; lower-case letters, digits and single hyphens
```

**Generate an Accessibility Conformance Report** after running an app's tests (from the repo root):

```bash
npm run acr -- skeleton   # writes skeleton/ACR.md; use grimoire or seance in the same way
```

## Live demos

**Accessibility MCP server on npm:** [`skeleton-key-a11y-mcp`](https://www.npmjs.com/package/skeleton-key-a11y-mcp). Add `{"command": "npx", "args": ["-y", "skeleton-key-a11y-mcp"]}` to `.kiro/settings/mcp.json` in any project.

- Grimoire: https://hassank007.github.io/skeleton-key/grimoire/
- Seance: https://hassank007.github.io/skeleton-key/seance/
- Skeleton: https://hassank007.github.io/skeleton-key/skeleton/

## How Kiro built this

- **Spec-driven workflow.** Every part has a spec in `.kiro/specs/` with `requirements.md` (EARS acceptance criteria), `design.md` and `tasks.md`: `skeleton`, `a11y-brain`, `a11y-pbt`, `a11y-mcp`, `acr-report`, `new-app-script`, `grimoire` and `seance`. Tasks are ticked off in `tasks.md` as they are done, and tests carry the criterion they cover, for example `[SC 2.4.1]`.
- **Steering.** `.kiro/steering/` holds four always-on files: `product.md`, `tech.md`, `structure.md` and `accessibility.md` (the WCAG 2.2 AA rules every generated component must follow).
- **The `trusted-tester` agent.** `.kiro/agents/trusted-tester.json` defines a read-only custom agent that reviews code with the DHS Section 508 Trusted Tester method and reports each finding with the WCAG criterion, severity, location and fix. Start it with `kiro-cli chat --agent trusted-tester`. Its reviews of the skeleton and both apps are in `docs/`.
- **Hooks.** Four hooks in `.kiro/hooks/`:

  | Hook | Trigger | What it does |
  |---|---|---|
  | `a11y-guard` | A `.tsx` file in `skeleton/src/` or `apps/*/src/` is edited | Reviews the file against the accessibility steering and fixes violations. |
  | `test-buddy` | A `.tsx` file is created in a `components/` folder | Writes a Vitest + `vitest-axe` test for it and runs it. |
  | `skeleton-sync` | A file in `skeleton/src/components/` changes | Lists which apps need the same change. Report only. |
  | `readme-keeper` | Manual | Refreshes README sections from the specs and hooks. |

- **MCP.** `mcp/a11y-mcp` is registered in `.kiro/settings/mcp.json` as `a11y`, so Kiro can audit a running page, walk the keyboard order, check contrast and read the page outline. Its audit of the skeleton is in `docs/a11y-mcp-skeleton-audit.md`.
- **Property-based tests.** `fast-check` tests in each `tests/unit/properties/` folder check invariants over generated inputs: token contrast, Field labelling, Dialog focus trapping and Tabs keyboard behaviour in the skeleton, plus app-specific properties in Grimoire (filter, results, search state) and Seance (booking, validation, error summary). They found two real defects in the skeleton (a whitespace-only Field message and a Dialog Shift+Tab leak), both fixed. See `docs/pbt-findings.md`.
- **ACR generator.** `scripts/acr.mjs` builds `ACR.md`, a WCAG 2.2 A and AA report in the style of the VPAT 2.5 WCAG edition, from Vitest and Playwright results, axe scans and the Trusted Tester review. A test counts as evidence for a criterion only when its title carries an SC tag.
- **Kiro CLI, orchestrated by Claude Code.** The build was split into 16 prompt files in `scripts/kiro-batches/` (spec, then implementation, per part). `run-batches.ps1` feeds them in order to `kiro-cli chat --no-interactive`, and re-runs an implementation batch while its `tasks.md` still has unchecked tasks. Claude Code orchestrated these Kiro CLI runs.

## Tests and conformance summary

Results of the runs made when this README was written (lint and `tsc --noEmit` pass in every folder below):

| Folder | Unit and property tests (Vitest) | Playwright + axe |
|---|---|---|
| `skeleton/` | 180 passed (17 files) | 14 passed |
| `apps/grimoire/` | 319 passed (33 files) | 50 passed |
| `apps/seance/` | 422 passed (41 files) | 44 passed |
| `mcp/a11y-mcp/` | 113 passed (8 files) | none |
| root `scripts/` | 187 passed (`npm run test:scripts`) | none |

Conformance reports generated from those results (`ACR.md` in each folder), out of 55 WCAG 2.2 A and AA criteria:

| App | Supports | Partially Supports | Does Not Support | Not Evaluated |
|---|---|---|---|---|
| `skeleton/` | 10 | 12 | 0 | 33 |
| `apps/grimoire/` | 26 | 0 | 0 | 29 |
| `apps/seance/` | 23 | 0 | 0 | 32 |

What this does not show:

- "Not Evaluated" means the automated evidence is not enough and a person must judge it. The reports are not a legal certification, and no app here is claimed to conform to WCAG 2.2 AA.
- No human keyboard pass, screen reader test or native date-picker test has been done on Seance. Task 9.1 in `.kiro/specs/seance/tasks.md` is still open for that reason; keyboard-only Playwright specs cover the three steps, the dialog and the success view instead.
- The Playwright suites run in Chromium only.

## License

[MIT](./LICENSE). Copyright (c) 2026 Hassan Ahmed.
