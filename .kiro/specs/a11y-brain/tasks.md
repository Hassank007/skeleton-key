# Accessibility Brain: Implementation Tasks

## 1. Trusted Tester agent

- [x] 1. Create the `trusted-tester` agent
  - [x] 1.1 Create `.kiro/agents/prompts/trusted-tester.md` with the role, honesty rules, procedure, baseline checklist, finding format, severity scale and output template. *(REQ-2, REQ-3, REQ-4)*
  - [x] 1.2 Create `.kiro/agents/trusted-tester.json` with read-only `tools` and `allowedTools`, the steering `resources` and the `file://./prompts/trusted-tester.md` prompt. *(REQ-1)*

## 2. Hooks

- [x] 2. Create the four agent hooks in `.kiro/hooks/`
  - [x] 2.1 Create `a11y-guard.kiro.hook` (`fileEdited`, `.tsx` under `skeleton/src/` and `apps/*/src/`). *(REQ-5, REQ-9)*
  - [x] 2.2 Create `test-buddy.kiro.hook` (`fileCreated`, `src/components/*.tsx`). *(REQ-6, REQ-9)*
  - [x] 2.3 Create `skeleton-sync.kiro.hook` (`fileEdited`, `skeleton/src/components/**`). *(REQ-7, REQ-9)*
  - [x] 2.4 Create `readme-keeper.kiro.hook` (`userTriggered`). *(REQ-8, REQ-9)*

## 3. Documentation

- [x] 3. Write `docs/kiro-brain.md`
  - [x] 3.1 Explain the agent, how to start it and what its report contains. *(REQ-10)*
  - [x] 3.2 Add the hooks table with triggers, actions and how to disable each. *(REQ-10)*
  - [x] 3.3 State the limits of static review. *(REQ-4, REQ-10)*

## 4. Verification

- [x] 4. Validate the brain files
  - [x] 4.1 Run a one-off script that parses the agent and hook JSON, checks required fields and the prompt path, then delete the script. *(REQ-1, REQ-9)*
  - [x] 4.2 Run `git check-ignore` on the new files and confirm none are ignored. *(REQ-9)*
  - [x] 4.3 Re-run `npm run lint`, `npx tsc --noEmit`, `npm test` and the Playwright tests in `skeleton/` to confirm nothing regressed. *(REQ-9)*
