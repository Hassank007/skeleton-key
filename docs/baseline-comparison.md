# Seance vs. a plain Kiro build, and the exorcism: what a scanner sees and what a keyboard user gets

**Date:** 2026-11-18

## What was compared

- **Baseline:** Kiro was given a plain prompt asking for the same séance booking form: three steps, a confirm dialog and a spooky look. It ran in an empty folder with **no** `.kiro` steering, specs, hooks or agents. The generated code was not edited. It is kept outside this repo, because it is a demo prop and not part of the entry.
- **Seance:** the app in `apps/seance`, built from the skeleton with the steering, specs and hooks in this repo. It was tested at its live URL.

Both were measured with the same scripts, in `scripts/compare/`:

- axe-core, with the same WCAG tags Seance's own tests use (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`), on every step, the error state and the open dialog;
- scripted keyboard and focus checks in Chromium through Playwright.

## Result 1: the scanner says both are clean

| | Baseline | Seance |
|---|---|---|
| axe violations, 5 states scanned | **0** | **0** |

The baseline is not careless code. It has real `<label>`s, `<fieldset>` and `<legend>` for the radio groups, `aria-invalid`, `role="dialog"` and `aria-modal`. An automated audit would pass it.

## Result 2: a keyboard or screen reader user gets very different apps

| Check | WCAG | Baseline | Baseline after exorcism | Seance |
|---|---|---|---|---|
| First Tab stop is a skip link | 2.4.1 | ❌ lands on the first radio | ✅ | ✅ |
| Empty submit moves focus to the errors | 3.3.1, 2.4.3 | ❌ focus stays on Continue | ✅ | ✅ the error summary is focused |
| Errors announced once, not as competing alerts | 4.1.3 | ✅ | ✅ | ✅ |
| Step change moves focus to the new step's heading | 2.4.3 | ❌ focus stays on Continue | ✅ | ✅ |
| Page title names the current step | 2.4.2 | ❌ always "Seance Booking" | ✅ | ✅ "Step 2 of 3: Pick a date and time — Seance" |
| Dialog: focus starts inside | 2.4.3 | ✅ | ✅ | ✅ |
| Dialog: Tab never reaches the page behind it | 2.4.3 | ❌ reaches the "Full name" field behind it | ✅ | ✅ |
| Dialog: Escape closes it | 2.1.1 | ❌ | ✅ | ✅ |
| Dialog: focus returns to the button that opened it | 2.4.3 | ⚪ not testable, because Escape does not close it | ✅ | ✅ |
| Reduced-motion preference respected | 2.3.3 | ❌ 8 animations still running | ✅ | ✅ none |
| On-page control to stop motion | 2.2.2 | ❌ none | ✅ "Pause animations" | ✅ |
| **Passed** | | **2 of 10** | **11 of 11** | **11 of 11** |

## Result 3: the exorcism

The baseline was copied unedited into `examples/haunted-seance` (first commit). Kiro was then run in this repo with the reusable prompt `scripts/exorcise.txt`. It used the `a11y` MCP server (`audit_page`, `keyboard_walk`, `page_outline`, `check_contrast`) together with the steering rules. It added a skip link, per-step titles, focus management, an error summary, a native `<dialog>`, a "Pause animations" toggle and contrast fixes, and kept the design. Its own report, including what it could not verify, is in `examples/haunted-seance/EXORCISM.md`.

Measured afterwards with the same script: **2 of 10 → 11 of 11**, and still 0 axe violations.

## Why this matters for the entry

Automated tools find roughly a third of WCAG issues. The rest are about behaviour: where focus goes, what is announced and whether motion can be stopped. Those are exactly what Skeleton Key adds: the steering rules, the focus-on-route-change hook, the `keyboard_walk` tool in the a11y MCP server, and the Trusted Tester agent. Both apps "pass axe". Only one of them can be used without a mouse.

## Found along the way: a bug in Seance

The same scripts found one real bug in Seance. If a spirit radio has focus, nothing is chosen, and the user **clicks** Next with a pointer, nothing happens. Leaving the radio shows its inline error, which pushes the button down between the press and the click. The keyboard path works. Kiro was given the bug report (`scripts/kiro-batches/17-fix-seance-blur-click.txt`) and fixed it with regression tests. See the git history.

## How to rerun

```bash
# baseline: serve the generated app (outside this repo) with `npx vite preview --port 4180`, then
node scripts/compare/measure-baseline.mjs http://localhost:4180/
# after the exorcism: `npm run dev -- --port 4181` in examples/haunted-seance, then
node scripts/compare/measure-baseline.mjs http://localhost:4181/
node scripts/compare/measure-seance.mjs https://hassank007.github.io/skeleton-key/seance/
```
