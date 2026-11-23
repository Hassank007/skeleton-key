# Seance vs. a plain Kiro build, and the exorcism: what a scanner sees and what a keyboard user gets

**Date:** 2026-11-18

## What was compared

- **Baseline:** Kiro was given a plain prompt asking for the same séance booking form: three steps, a confirm dialog and a spooky look. It ran in an empty folder with **no** `.kiro` steering, specs, hooks or agents. The generated code was not edited; it is the first commit of `examples/haunted-seance` (not one of the two Skeleton Crew apps).
- **Seance:** the app in `apps/seance`, built from the skeleton with the steering and specs in this repo. (The hooks existed but had not run; see `docs/kiro-brain.md`.) It was tested at its live URL.

Both were measured with the same scripts, in `scripts/compare/` (the extra checks are in `extra-checks.mjs`):

- axe-core, with the same WCAG tags Seance's own tests use (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`), on every step, the error state and the open dialog;
- 21 scripted checks in Chromium through Playwright: screen reader, keyboard and focus, vision, wording and motion.

## Limits of this comparison

- **The two builds did not get the same prompt.** The baseline got the short plain prompt in `examples/haunted-seance/PROMPT.txt`. Seance got the steering files, the skeleton, and a spec that asked for accessibility features and tests by name. The comparison shows what a plain prompt gives you against what Skeleton Key gives you. It does not isolate which part made the difference.
- **One build of each.** Another run of the same prompt could score differently.
- **We wrote the checks.** Claude Code wrote the scripts in `scripts/compare/`, for this project. Ten of the 21 checks were added after the exorcism run. They are not an independent benchmark.
- **The exorcism prompt names many of the things the checks measure** (`scripts/exorcise.txt`), so a high score after it is expected to some degree.
- **Scripted checks in Chromium only.** No person and no screen reader took part.

Re-measured on 2026-11-23 with the same scripts: baseline 2 of 20, after the exorcism 21 of 21, Seance (live) 21 of 21, axe 0 on all three.

## Result 1: the scanner says both are clean

| | Baseline | Seance |
|---|---|---|
| axe violations, 5 states scanned | **0** | **0** |

The baseline is not careless code. It has real `<label>`s, `<fieldset>` and `<legend>` for the radio groups, `aria-invalid`, `role="dialog"` and `aria-modal`. An axe scan passes it.

## Result 2: screen reader, vision, motion and keyboard users get very different apps

21 checks in five groups. Each is a behaviour or a value axe does not settle on its own: where focus goes, what is announced, contrast over gradients and selected states, and whether motion can be stopped.

| Group | Check | WCAG | Baseline | After exorcism | Seance |
|---|---|---|---|---|---|
| Screen reader | Decorative emoji hidden from screen readers | 1.1.1 | ❌ 5 read aloud (👰 🏴 ☠ 🧸 🕯) | ✅ | ✅ |
| Screen reader | Errors announced once, not as competing alerts | 4.1.3 | ✅ | ✅ | ✅ |
| Screen reader | Choice group linked to its error message | 1.3.1, 3.3.1 | ❌ error on screen, not linked | ✅ | ✅ |
| Screen reader | Page title names the current step | 2.4.2 | ❌ always "Seance Booking" | ✅ | ✅ |
| Screen reader | Each step has its own heading | 1.3.1, 2.4.6 | ❌ one h1 only | ✅ | ✅ |
| Screen reader | Booking success is announced | 4.1.3 | ❌ live region inserted with its text | ✅ | ✅ |
| Screen reader | Page title changes on success | 2.4.2 | ❌ | ✅ | ✅ |
| Keyboard and focus | First Tab stop is a skip link | 2.4.1 | ❌ lands on the first radio | ✅ | ✅ |
| Keyboard and focus | Empty submit moves focus to the errors | 3.3.1, 2.4.3 | ❌ focus stays on Continue | ✅ | ✅ |
| Keyboard and focus | Step change moves focus to the new step's heading | 2.4.3 | ❌ focus stays on Continue | ✅ | ✅ |
| Keyboard and focus | Dialog: focus starts inside | 2.4.3 | ✅ | ✅ | ✅ |
| Keyboard and focus | Dialog: Tab never reaches the page behind it | 2.4.3 | ❌ reaches "Full name" behind it | ✅ | ✅ |
| Keyboard and focus | Dialog: Escape closes it | 2.1.1 | ❌ | ✅ | ✅ |
| Keyboard and focus | Dialog: focus returns to the button that opened it | 2.4.3 | ⚪ not testable (Escape does not close it) | ✅ | ✅ |
| Vision | All text meets contrast, incl. gradients and selected states | 1.4.3 | ❌ Continue 4.23:1, selected time 3.30:1 | ✅ | ✅ |
| Vision | Input borders visible against the page | 1.4.11 | ❌ 1.53:1 | ✅ | ✅ |
| Vision | Chosen option shown by more than colour | 1.4.1 | ❌ radio hidden, only colour and glow | ✅ ✓ mark | ✅ drawn dot |
| Vision | Text fields show a real outline on focus | 2.4.7 | ❌ box-shadow only | ✅ | ✅ |
| Wording | Past-date error says how to fix it | 3.3.3 | ❌ "The dead cannot travel to the past." | ✅ adds "Pick today or a later date." | ✅ |
| Motion | Reduced-motion preference respected | 2.3.3 | ❌ 5 animations still running | ✅ | ✅ |
| Motion | On-page control to stop motion | 2.2.2 | ❌ none | ✅ "Pause animations" | ✅ |
| **Passed** | | | **2 of 20** | **21 of 21** | **21 of 21** |

By group, baseline → after: screen reader 1/7 → 7/7, keyboard 1/6 → 7/7, vision 0/4 → 4/4, wording 0/1 → 1/1, motion 0/2 → 2/2.

The contrast checker resolves every colour through the browser, composites translucent layers and takes the worst gradient stop, so it settles the text that axe leaves as "incomplete".

## Result 3: the exorcism

The baseline was copied unedited into `examples/haunted-seance` (first commit). Kiro was then run in this repo with the reusable prompt `scripts/exorcise.txt`. It used the `a11y` MCP server (`audit_page`, `keyboard_walk`, `page_outline`, `check_contrast`) together with the steering rules. It added a skip link, per-step titles, focus management, an error summary, a native `<dialog>`, a "Pause animations" toggle and contrast fixes, and kept the design. The MCP tools load a page without clicking or typing, so they only reached step 1. As Kiro's report says, most of the defects were found by reading the source, and Kiro did not run the later steps in a browser. The scripted checks above were run afterwards. Kiro's own report, including what it could not verify, is in `examples/haunted-seance/EXORCISM.md`.

Measured afterwards with the same script: **2 of 20 → 21 of 21**, and still 0 axe violations.

## Why this matters for the entry

Automated tools find only some accessibility problems. Many of the others are about behaviour and context: where focus goes, what is announced, contrast on gradients and selected states, colour-only cues, helpful error wording and whether motion can be stopped. Those are exactly what Skeleton Key adds: the steering rules, the focus-on-route-change hook, the `keyboard_walk` tool in the a11y MCP server, and the Trusted Tester agent. Both apps "pass axe". On these checks, only one of them handles focus, announcements, contrast and motion.

## Found along the way: a bug in Seance

The same scripts found one real bug in Seance. If a spirit radio has focus, nothing is chosen, and the user **clicks** Next with a pointer, nothing happens. Leaving the radio shows its inline error, which pushes the button down between the press and the click. The keyboard path works. Kiro was given the bug report (`scripts/kiro-batches/17-fix-seance-blur-click.txt`) and fixed it with regression tests. See the git history.

## How to rerun

```bash
# before: check out the first commit of examples/haunted-seance, run `npm run dev -- --port 4180` there, then
node scripts/compare/measure-baseline.mjs http://localhost:4180/
# after the exorcism: `npm run dev -- --port 4181` in examples/haunted-seance, then
node scripts/compare/measure-baseline.mjs http://localhost:4181/
node scripts/compare/measure-seance.mjs https://hassank007.github.io/skeleton-key/seance/
```
