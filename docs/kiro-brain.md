# The Kiro accessibility brain

Skeleton Key ships a reviewer agent, four hooks and one manual workflow that keep an app accessible while you edit it with Kiro. Everything lives in `.kiro/` and is committed. The design is in `.kiro/specs/a11y-brain/`.

## The `trusted-tester` agent

`trusted-tester` reviews code with the DHS Section 508 Trusted Tester method. It walks 14 ICT Baseline tests for web UI: keyboard, focus, non-interference, contrast, title and language, headings and landmarks, forms, link and button names, images, status messages, timing, flashing, reflow and resize, and sensory characteristics.

It is read-only. It reports, you fix.

**Start it**

- Kiro CLI: `kiro-cli chat --agent trusted-tester`
- Kiro IDE: choose `trusted-tester` in the agent selector.

Then ask, for example: `Review skeleton/src/components/Dialog.tsx`.

**What you get**

- Findings, each with the WCAG 2.2 criterion, a severity (Critical, Serious, Moderate, Minor), a `path:line` location and a concrete fix.
- A results table with Pass, Fail, Not applicable or Not tested for each of the 14 tests.
- A list of manual steps for anything it could not check from source.

## The hooks

Hooks are JSON files in `.kiro/hooks/` in the current Kiro format (`"version": "v1"`).

> **History.** The original hooks were written in the legacy `*.kiro.hook` format. The current Kiro IDE does not run that format (it offers to convert it), so those hooks had not run when the apps were built (2026-11-18). They were converted to the current format on 2026-11-23, and the legacy files were deleted. Nothing in the app build history should be read as the hooks having reviewed the code.

| Hook | Trigger | What it does |
|---|---|---|
| `a11y-guard` | A `.tsx` file is saved in `skeleton/src/` or `apps/*/src/` (`PostFileSave`) | Reviews the file against `.kiro/steering/accessibility.md`, fixes violations, explains each fix in one line. |
| `a11y-guard-agent` | The agent writes a file with `fs_write`, `fs_append` or `str_replace` (`PostToolUse`) | Runs `node scripts/hooks/a11y-guard.mjs`: ESLint with the project's jsx-a11y strict rules on that one `.tsx` file. Prints the violations with line numbers, or "no jsx-a11y violations". Appends a line to `.kiro/hook-runs.log`. Does nothing for other files. |
| `test-buddy` | Create a `.tsx` file in a `src/components/` folder (`PostFileCreate`) | Writes `tests/unit/<Component>.test.tsx` with Vitest and `vitest-axe`, runs it and fixes it until it passes. |
| `skeleton-sync` | A file in `skeleton/src/components/` is saved (`PostFileSave`) | Lists the apps that use the component and what each needs updated. Report only. |

`PostFileSave` and `PostFileCreate` do not fire only when a person saves. In Kiro CLI 3.4.0 they also fired after the agent's own writes (probe run on 2026-11-23, `scripts/kiro-batches/20-hook-probe.txt`). In this session the agent's `str_replace` on `skeleton/src/components/Button.tsx` triggered the `a11y-guard` and `skeleton-sync` instructions, and they reached the agent as HOOK_INSTRUCTION blocks. `a11y-guard-agent` (`PostToolUse`) also ran: `.kiro/hook-runs.log` on the developer's machine has a line for it, and in the probe it caught 3 jsx-a11y violations in `HookProbe.tsx` (click-events-have-key-events, no-static-element-interactions, alt-text). Its printed output did not reach the agent in this session. The agent saw only the log line afterwards, so the log is the evidence that it ran. Not tested: the hooks in the Kiro IDE.

**`readme-keeper`** is not a hook. The current Kiro IDE has no manual hook trigger, so it is a manual steering file, `.kiro/steering/readme-keeper.md`. Type `/readme-keeper` in chat to refresh `README.md` from `.kiro/specs/` and `.kiro/hooks/`.

**Turn a hook off**: set `"enabled": false` on it in its `.kiro/hooks/<name>.json` file, or toggle it in the Agent Hooks panel.

**Test the command hook**: `npm run test:scripts` runs `scripts/hooks/tests/a11y-guard.test.mjs`.

## Limits

The brain reads source code. It does not drive a browser or a screen reader, so it cannot prove an app is accessible. It will not claim conformance without evidence, and it marks checks it cannot run as "Not tested". Back it with the axe tests (`npm test`, `npm run test:e2e`) and a manual pass: Tab through every page, zoom to 400%, and listen with a screen reader.
