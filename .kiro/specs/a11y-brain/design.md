# Accessibility Brain: Design

## Overview

The brain is configuration, not application code. It has three parts, all committed under version control:

| Part | Path | Purpose |
|---|---|---|
| Agent | `.kiro/agents/trusted-tester.json` and `.kiro/agents/prompts/trusted-tester.md` | On-demand Trusted Tester review (REQ-1 to REQ-4) |
| Hooks | `.kiro/hooks/*.kiro.hook` | Automatic and manual actions on file events (REQ-5 to REQ-8) |
| Docs | `docs/kiro-brain.md` | Developer guide (REQ-10) |

No new runtime or dev dependencies are added. Validation of the JSON files uses a short Node script run once and not committed.

## Agent: `trusted-tester`

**Location and format.** Kiro custom agents are JSON files in `.kiro/agents/` (workspace scope). The file uses the documented fields `name`, `description`, `prompt`, `tools`, `allowedTools` and `resources`. The `prompt` field points at a Markdown file with `file://./prompts/trusted-tester.md`, a path relative to the agent file, so the long prompt stays readable and diffable.

```json
{
  "name": "trusted-tester",
  "description": "Reviews web UI code with the DHS Section 508 Trusted Tester method ...",
  "prompt": "file://./prompts/trusted-tester.md",
  "tools": ["fs_read", "grep", "glob"],
  "allowedTools": ["fs_read", "grep", "glob"],
  "resources": ["file://.kiro/steering/*.md"]
}
```

**Read-only by design (REQ-1.4).** A reviewer that can edit files would blur "report" and "fix". Fixing is the job of the `a11y-guard` hook and the developer. Without a shell tool the agent cannot run axe, so any check that needs a running page is reported as "Not tested" (REQ-4.2).

**Prompt structure.** The prompt file has these sections, in order:

1. Role and method: Trusted Tester, ICT Testing Baseline for Web, WCAG 2.2 AA.
2. Honesty rules: no conformance claim without cited evidence; "Static review only" banner; "Not tested" for anything needing a browser or assistive technology.
3. Procedure: identify the file type, then walk the baseline tests in the fixed order below.
4. Baseline checklist: each test with its WCAG 2.2 criteria and what to look for in React/JSX/CSS.
5. Finding format and severity scale.
6. Output template ending in the results table.

**Baseline walk order (REQ-2).**

| # | Test | WCAG 2.2 criteria |
|---|---|---|
| 1 | Keyboard access and no traps | 2.1.1, 2.1.2 |
| 2 | Focus order, visibility, not obscured | 2.4.3, 2.4.7, 2.4.11 |
| 3 | Non-interference | 1.4.2, 2.1.4, 3.2.1, 3.2.2 |
| 4 | Colour and contrast | 1.4.1, 1.4.3, 1.4.11 |
| 5 | Page title and language | 2.4.2, 3.1.1 |
| 6 | Headings, landmarks, bypass | 1.3.1, 2.4.1, 2.4.6 |
| 7 | Forms: labels, instructions, errors, autocomplete | 1.3.1, 1.3.5, 3.3.1, 3.3.2, 3.3.3, 4.1.2 |
| 8 | Link and button names | 2.4.4, 2.5.3, 4.1.2 |
| 9 | Images and text alternatives | 1.1.1 |
| 10 | Dynamic content and status messages | 4.1.3 |
| 11 | Timing | 2.2.1, 2.2.2 |
| 12 | Flashing and motion | 2.3.1, 2.3.3 |
| 13 | Reflow, resize, spacing, target size | 1.4.4, 1.4.10, 1.4.12, 2.5.8 |
| 14 | Sensory characteristics | 1.3.3 |

**Finding format (REQ-3).**

```
[Serious] 2.4.7 Focus Visible
Location: skeleton/src/components/Button.module.css:12
Issue: `outline: none` removes the focus indicator.
Fix: replace with `.btn:focus-visible { outline: 3px solid var(--color-focus-ring); outline-offset: 2px; }`
```

Severity scale: Critical, Serious, Moderate, Minor, defined in the prompt.

**Evidence model (REQ-4).** The prompt defines three evidence levels: "Verified" (the agent read a test or tool output and names it), "Static" (visible in source), and "Not tested". A "Pass" in the table requires Verified or Static evidence with the inspected lines named; Static passes carry the banner "Static review only. This is not a conformance statement."

## Hooks

Kiro hooks are JSON files named `<name>.kiro.hook` in `.kiro/hooks/`. Each one has this shape:

```json
{
  "enabled": true,
  "name": "a11y-guard",
  "description": "...",
  "version": "1",
  "when": { "type": "fileEdited", "patterns": ["skeleton/src/**/*.tsx"] },
  "then": { "type": "askAgent", "prompt": "..." }
}
```

| Hook | `when.type` | `when.patterns` | Requirement |
|---|---|---|---|
| a11y-guard | `fileEdited` (fires on save) | `skeleton/src/**/*.tsx`, `apps/*/src/**/*.tsx` | REQ-5 |
| test-buddy | `fileCreated` | `skeleton/src/components/*.tsx`, `apps/*/src/components/*.tsx` | REQ-6 |
| skeleton-sync | `fileEdited` | `skeleton/src/components/**` | REQ-7 |
| readme-keeper | `userTriggered` | none | REQ-8 |

All four use `then.type: "askAgent"` so the work runs in the active chat with the steering files already loaded.

**a11y-guard.** The prompt names the saved file, tells the agent to read `.kiro/steering/accessibility.md`, review the file against each rule that applies to it, edit only on violation, and reply with one line per fix. A clean file gets a single "No violations found" line. Patterns cover `src/` only, so test files in `tests/` and build output in `dist/` never trigger it (REQ-5.6).

**test-buddy.** The prompt tells the agent to read two existing tests in `tests/unit/` for the project pattern, create `tests/unit/<Component>.test.tsx` next to `src/`, render the component with the providers it needs, assert `expect(await axe(container)).toHaveNoViolations()`, add a keyboard interaction test where the component is interactive, then run `npx vitest run tests/unit/<Component>.test.tsx` and fix the test until it passes. If the component itself has a violation, the agent fixes the component, not the test. An existing test file is never overwritten.

**skeleton-sync.** Report-only. The prompt tells the agent to search `apps/` for imports of, or copies of, the changed component, then list each app and the update needed. If `apps/` is empty it says so. This respects the structure rule that apps are created with `npm run new-app` and shared improvements land in `skeleton/` first.

**readme-keeper.** Manual. The prompt tells the agent to read `.kiro/specs/*/requirements.md` and `.kiro/hooks/*.kiro.hook`, then update only the README sections that describe the specs, the Kiro brain and the hooks, keep the license section, and avoid conformance claims.

**Loop risk.** `a11y-guard` edits `.tsx` files, which is a save and could re-trigger the hook. The prompt says "if there is nothing to fix, do not edit", so the second run ends with no edit and the chain stops. `skeleton-sync` is report-only and cannot cascade.

## Documentation: `docs/kiro-brain.md`

Sections: what the brain is; the agent (start it with `kiro-cli --agent trusted-tester` or pick it in the agent selector; sample prompt; what the report contains); the hooks table (trigger, action, how to disable by setting `"enabled": false` or using the Agent Hooks panel); limits (static review only); links to the spec. Target length is about 80 lines (REQ-10.5).

## Validation (REQ-1.5, REQ-9)

A one-off Node script, deleted after use, checks that:

1. `trusted-tester.json` parses and has the required fields, and the `file://` prompt resolves to an existing file.
2. Each `*.kiro.hook` parses, has the required fields, and uses an allowed `when.type` and `then.type`.
3. `git check-ignore` reports none of the new files as ignored.

Because this change touches only JSON, Markdown and docs, no TypeScript, lint or test config changes. The existing `skeleton/` checks are re-run to show nothing regressed.

## Decisions

- **JSON agent with a Markdown prompt file** over an inline prompt: the prompt is long and reviewers want diffs.
- **Read-only agent** over a fixing agent: keeps review and repair separate (REQ-1.4).
- **`askAgent` hooks** over `runCommand` hooks: the work needs judgement, and `askAgent` reuses steering context.
- **No custom script or dependency** for the brain: the repository stays lean per `tech.md`. Automated axe evidence comes from the separate MCP and test specs.
