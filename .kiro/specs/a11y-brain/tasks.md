# Accessibility Brain: Implementation Tasks

## 1. Trusted Tester agent

- [x] 1. Create the `trusted-tester` agent
  - [x] 1.1 Create `.kiro/agents/prompts/trusted-tester.md` with the role, honesty rules, procedure, baseline checklist, finding format, severity scale and output template. *(REQ-2, REQ-3, REQ-4)*
  - [x] 1.2 Create `.kiro/agents/trusted-tester.json` with read-only `tools` and `allowedTools`, the steering `resources` and the `file://./prompts/trusted-tester.md` prompt. *(REQ-1)*

## 2. Hooks

- [x] 2. Create the hooks in `.kiro/hooks/` (current `v1` JSON format)
  - [x] 2.1 Create `a11y-guard.json` (`PostFileSave`, `.tsx` under `skeleton/src/` and `apps/*/src/`). *(REQ-5, REQ-9)*
  - [x] 2.2 Create `test-buddy.json` (`PostFileCreate`, `src/components/*.tsx`). *(REQ-6, REQ-9)*
  - [x] 2.3 Create `skeleton-sync.json` (`PostFileSave`, `skeleton/src/components/**`). *(REQ-7, REQ-9)*
  - [x] 2.4 Create the manual steering file `.kiro/steering/readme-keeper.md` (`inclusion: manual`). *(REQ-8)*
  - [x] 2.5 Originally written in the legacy `*.kiro.hook` format, which the current Kiro IDE does not run. Converted to the files above on 2026-11-23 and the four legacy files deleted. *(REQ-9)*

## 2b. Agent-edit hook

- [x] 2b. Check the agent's own edits
  - [x] 2b.1 Write `scripts/hooks/a11y-guard.mjs` (stdin JSON in, path search, scope check, project ESLint, one-line result, `.kiro/hook-runs.log`, never fails). *(REQ-11)*
  - [x] 2b.2 Create `.kiro/hooks/a11y-guard-agent.json` (`PostToolUse`, `^(fs_write|fs_append|str_replace)$`, `command` action). *(REQ-11)*
  - [x] 2b.3 Add `.kiro/hook-runs.log` to `.gitignore`. *(REQ-11)*
  - [x] 2b.4 Write `scripts/hooks/tests/a11y-guard.test.mjs` (ignored types, out-of-scope path, Windows and POSIX paths, violation, clean file, malformed stdin) and add it to `npm run test:scripts`. *(REQ-11)*

## 3. Documentation

- [x] 3. Write `docs/kiro-brain.md`
  - [x] 3.1 Explain the agent, how to start it and what its report contains. *(REQ-10)*
  - [x] 3.2 Add the hooks table with triggers, actions and how to disable each. *(REQ-10)*
  - [x] 3.2b State that the original hooks were legacy-format and had not run when the apps were built (2026-11-18), and were converted on 2026-11-23. *(REQ-10)*
  - [x] 3.3 State the limits of static review. *(REQ-4, REQ-10)*

## 4. Verification

- [x] 4. Validate the brain files
  - [x] 4.1 Run a one-off script that parses the agent and hook JSON (hook matchers tested against Windows and POSIX sample paths), checks required fields and the prompt path, then delete the script. *(REQ-1, REQ-9)*
  - [x] 4.2 Run `git check-ignore` on the new files and confirm none are ignored. *(REQ-9)*
  - [x] 4.3 Re-run `npm run lint`, `npx tsc --noEmit`, `npm test` and the Playwright tests in `skeleton/` to confirm nothing regressed. *(REQ-9)*
