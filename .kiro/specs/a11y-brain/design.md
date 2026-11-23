# Accessibility Brain: Design

## Overview

The brain is configuration, not application code. It has three parts, all committed under version control:

| Part | Path | Purpose |
|---|---|---|
| Agent | `.kiro/agents/trusted-tester.json` and `.kiro/agents/prompts/trusted-tester.md` | On-demand Trusted Tester review (REQ-1 to REQ-4) |
| Hooks | `.kiro/hooks/*.json`, `scripts/hooks/a11y-guard.mjs` | Automatic actions on file events and agent tool calls (REQ-5 to REQ-7, REQ-9, REQ-11) |
| Manual workflow | `.kiro/steering/readme-keeper.md` | On-demand README refresh (REQ-8) |
| Docs | `docs/kiro-brain.md` | Developer guide (REQ-10) |

No new runtime or dev dependencies are added. Validation of the JSON files uses a short Node script run once and not committed. The one committed script, `scripts/hooks/a11y-guard.mjs`, uses only Node built-ins and the ESLint that each project already has.

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

Kiro hooks are JSON files in `.kiro/hooks/` (documented at kiro.dev/docs/hooks). Each file has `version: "v1"` and a `hooks` array, and Kiro loads it when a session starts. This is the current format. The first versions of these hooks used the legacy `<name>.kiro.hook` format (`when` / `then`, `fileEdited`, `fileCreated`, `userTriggered`). The current Kiro IDE offers to convert that format and does not run it, so the hooks had not run when the apps were built (2026-11-18). They were converted on 2026-11-23. Each file now has this shape:

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "a11y-guard",
      "description": "...",
      "trigger": "PostFileSave",
      "matcher": "(^|[/\\\\])(skeleton|apps[/\\\\][^/\\\\]+)[/\\\\]src[/\\\\].*\\.tsx$",
      "action": { "type": "agent", "prompt": "..." },
      "enabled": true
    }
  ]
}
```

For file events, `matcher` is a regular expression tested against the file path. Windows paths use `\`, so every matcher accepts `/` and `\` through the character class `[/\\]` (written `[/\\\\]` in JSON).

| Hook | `trigger` | `matcher` (tested against) | Action | Requirement |
|---|---|---|---|---|
| a11y-guard | `PostFileSave` | `.tsx` under `skeleton/src/` or `apps/*/src/` (file path) | `agent` prompt | REQ-5 |
| test-buddy | `PostFileCreate` | `.tsx` directly in `skeleton/src/components/` or `apps/*/src/components/` (file path) | `agent` prompt | REQ-6 |
| skeleton-sync | `PostFileSave` | anything in `skeleton/src/components/` (file path) | `agent` prompt | REQ-7 |
| a11y-guard-agent | `PostToolUse` | `^(fs_write\|fs_append\|str_replace)$` (tool ID) | `command`: `node scripts/hooks/a11y-guard.mjs` | REQ-11 |

The three `agent` hooks inject their prompt into the active chat, so the work runs with the steering files already loaded. `a11y-guard-agent` is a `command` hook because its check is deterministic (ESLint) and needs no judgement.

**a11y-guard.** The prompt names the saved file, tells the agent to read `.kiro/steering/accessibility.md`, review the file against each rule that applies to it, edit only on violation, and reply with one line per fix. A clean file gets a single "No violations found" line. Patterns cover `src/` only, so test files in `tests/` and build output in `dist/` never trigger it (REQ-5.6).

**test-buddy.** The prompt tells the agent to read two existing tests in `tests/unit/` for the project pattern, create `tests/unit/<Component>.test.tsx` next to `src/`, render the component with the providers it needs, assert `expect(await axe(container)).toHaveNoViolations()`, add a keyboard interaction test where the component is interactive, then run `npx vitest run tests/unit/<Component>.test.tsx` and fix the test until it passes. If the component itself has a violation, the agent fixes the component, not the test. An existing test file is never overwritten.

**skeleton-sync.** Report-only. The prompt tells the agent to search `apps/` for imports of, or copies of, the changed component, then list each app and the update needed. If `apps/` is empty it says so. This respects the structure rule that apps are created with `npm run new-app` and shared improvements land in `skeleton/` first.

**a11y-guard-agent.** The Kiro documentation says `PostFileSave` fires when "the agent saves or modifies files", but this repository treats it as firing for a person's saves only, because it has not been confirmed to fire for the agent's tool edits. The `PostToolUse` hook covers them directly: it fires after each file-writing tool call and does not depend on how the file event is raised. Kiro sends the event JSON on stdin, and the script (`scripts/hooks/a11y-guard.mjs`) works as follows:

1. Search the whole event for path strings (keys such as `path`, `file_path`, `filePath`, `target_file`, or any `.tsx` string) and take the first one in scope.
2. Stay silent (exit 0, no output) unless it is a `.tsx` file under `skeleton/src/` or `apps/*/src/`. Backslash and forward-slash paths, relative paths and absolute paths inside the repository are accepted.
3. Run `node_modules/eslint/bin/eslint.js --format json <file>` with the project folder (`skeleton/` or `apps/<name>/`) as the working directory, so the project's own `eslint.config.js` (jsx-a11y strict) applies. Keep only `jsx-a11y/*` messages.
4. Print `a11y-guard: <file>: no jsx-a11y violations`, or each violation as `<file>:<line>:<col> <rule>: <message>` followed by `Fix these now, following .kiro/steering/accessibility.md.` Exit code 0 means Kiro adds this output to the agent's context.
5. Append `<ISO time>\ta11y-guard-agent\t<file>\t<result>` to `.kiro/hook-runs.log` (ignored by git) on every run, including ignored files. This log is the local evidence that the hook fires.

The script never exits non-zero. Its own failures (malformed stdin, ESLint not installed, parse error) print one line and exit 0, so a broken hook cannot block the agent. A missing `node_modules` is reported, not fixed.

**readme-keeper.** Manual, and a steering file, not a hook: the current Kiro IDE has no manual hook trigger (legacy manual hooks only appear with a legacy label), and its documentation recommends a manually included steering file for on-demand workflows. `.kiro/steering/readme-keeper.md` has `inclusion: manual` and runs as `/readme-keeper`. The prompt tells the agent to read `.kiro/specs/*/requirements.md` and `.kiro/hooks/*.json`, then update only the README sections that describe the specs, the Kiro brain and the hooks, keep the license section, and avoid conformance claims.

**Loop risk.** `a11y-guard` edits `.tsx` files, which is a save and could re-trigger the hook. The prompt says "if there is nothing to fix, do not edit", so the second run ends with no edit and the chain stops. `skeleton-sync` is report-only and cannot cascade. `a11y-guard-agent` only reads and prints, so it cannot trigger itself, but the agent's fixes are new tool calls that run it again, which ends as soon as the output is "no jsx-a11y violations".

## Documentation: `docs/kiro-brain.md`

Sections: what the brain is; the agent (start it with `kiro-cli --agent trusted-tester` or pick it in the agent selector; sample prompt; what the report contains); the hooks table (trigger, action, how to disable by setting `"enabled": false` or using the Agent Hooks panel); the manual `/readme-keeper` workflow; a plain statement that the original hooks used the legacy format and had not run when the apps were built (2026-11-18) and were converted on 2026-11-23; limits (static review only); links to the spec. Target length is about 80 lines (REQ-10.5).

## Validation (REQ-1.5, REQ-9)

A one-off Node script, deleted after use, checks that:

1. `trusted-tester.json` parses and has the required fields, and the `file://` prompt resolves to an existing file.
2. Each `.kiro/hooks/*.json` parses, has `version: "v1"` and a `hooks` array, each hook has the required fields and an allowed `trigger` and `action.type`, and each `matcher` compiles as a regular expression and matches the sample Windows and POSIX paths.
3. `git check-ignore` reports none of the new files as ignored.

Because this change touches only JSON, Markdown and docs, no TypeScript, lint or test config changes. The existing `skeleton/` checks are re-run to show nothing regressed.

## Decisions

- **JSON agent with a Markdown prompt file** over an inline prompt: the prompt is long and reviewers want diffs.
- **Read-only agent** over a fixing agent: keeps review and repair separate (REQ-1.4).
- **`agent` hooks** for review and test writing: the work needs judgement, and they reuse steering context.
- **A `command` hook for agent edits**: the ESLint check is deterministic, and its output reaches the agent as context. It is the one script in the brain (`scripts/hooks/a11y-guard.mjs`), with no dependency, so the repository stays lean per `tech.md`. Automated axe evidence comes from the separate MCP and test specs.
- **Steering file for readme-keeper** over a hook: no manual hook trigger exists in the current IDE.
