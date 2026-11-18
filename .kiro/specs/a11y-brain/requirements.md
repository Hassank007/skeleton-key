# Accessibility Brain: Requirements

The "brain" is the Kiro-side half of Skeleton Key: a reviewer agent and four agent hooks that keep any app built from the skeleton accessible while it is being edited with Kiro. Requirements use EARS notation. WCAG references are to WCAG 2.2.

## REQ-1 Trusted Tester agent definition

**User story:** As a developer, I want a custom Kiro agent that reviews code the way a DHS Trusted Tester would, so that I get a repeatable, evidence-based accessibility review without an accessibility specialist.

### Acceptance criteria

- 1.1 The system SHALL provide a custom agent named `trusted-tester` in `.kiro/agents/trusted-tester.json`, using the Kiro custom-agent JSON format (`name`, `description`, `prompt`, `tools`, `allowedTools`, `resources`).
- 1.2 The agent's `prompt` SHALL state that it follows the DHS Section 508 Trusted Tester method and the ICT Testing Baseline for Web.
- 1.3 The agent's `resources` SHALL include every file in `.kiro/steering/` so it applies the repository rules.
- 1.4 The agent SHALL be read-only: its `tools` and `allowedTools` SHALL NOT include file-write or shell tools.
- 1.5 WHEN the agent definition file is parsed, THEN it SHALL be valid JSON and the `prompt` file reference SHALL resolve to an existing file.

---

## REQ-2 Trusted Tester test coverage

**User story:** As a developer, I want the agent to walk the web-relevant ICT Baseline tests in a fixed order, so that no category of barrier is skipped.

### Acceptance criteria

- 2.1 WHEN the agent reviews a file, THEN it SHALL check keyboard access (WCAG 2.1.1) and the absence of keyboard traps (WCAG 2.1.2).
- 2.2 WHEN the agent reviews a file, THEN it SHALL check focus order (WCAG 2.4.3), focus visibility (WCAG 2.4.7) and focus not obscured (WCAG 2.4.11).
- 2.3 WHEN the agent reviews a file, THEN it SHALL check non-interference: no audio that autoplays for more than 3 seconds without a control (WCAG 1.4.2), no single-character shortcuts without a way to turn them off (WCAG 2.1.4), and no unexpected context change on focus or input (WCAG 3.2.1, 3.2.2).
- 2.4 WHEN the agent reviews a file, THEN it SHALL check colour contrast for text and UI components (WCAG 1.4.3, 1.4.11) and that colour is not the only means of conveying information (WCAG 1.4.1).
- 2.5 WHEN the agent reviews a page or document shell, THEN it SHALL check the page title (WCAG 2.4.2) and the page language (WCAG 3.1.1).
- 2.6 WHEN the agent reviews a file, THEN it SHALL check headings and structure: heading order, one `h1`, landmarks, and a bypass mechanism (WCAG 1.3.1, 2.4.1, 2.4.6).
- 2.7 WHEN the agent reviews a form, THEN it SHALL check labels, instructions, error identification and error suggestions, and autocomplete tokens (WCAG 1.3.1, 1.3.5, 3.3.1, 3.3.2, 3.3.3, 4.1.2).
- 2.8 WHEN the agent reviews a file, THEN it SHALL check that links and buttons have an accessible name that matches their visible label (WCAG 2.4.4, 2.5.3, 4.1.2).
- 2.9 WHEN the agent reviews a file, THEN it SHALL check text alternatives for images: meaningful images have `alt` text and decorative images have `alt=""` or `aria-hidden="true"` (WCAG 1.1.1).
- 2.10 WHEN the agent reviews a file, THEN it SHALL check that status messages and loading states are announced through a live region (WCAG 4.1.3).
- 2.11 WHEN the agent reviews a file, THEN it SHALL check timing: time limits and auto-updating or moving content have a way to adjust, pause or stop (WCAG 2.2.1, 2.2.2).
- 2.12 WHEN the agent reviews a file, THEN it SHALL check for content that flashes more than three times per second (WCAG 2.3.1) and that animation honours `prefers-reduced-motion` (WCAG 2.3.3).
- 2.13 WHEN the agent reviews a file, THEN it SHALL check reflow at 320 CSS px, text resize to 200%, text-spacing overrides and a target size of at least 24 by 24 CSS px (WCAG 1.4.4, 1.4.10, 1.4.12, 2.5.8).
- 2.14 WHEN the agent reviews a file, THEN it SHALL check that instructions do not rely only on sensory characteristics such as shape, colour, size or position (WCAG 1.3.3).
- 2.15 WHEN a baseline test does not apply to the reviewed file, THEN the agent SHALL list it as "Not applicable" with a one-line reason instead of omitting it.

---

## REQ-3 Finding report format

**User story:** As a developer, I want every finding in the same structure, so that I can triage and fix it quickly.

### Acceptance criteria

- 3.1 WHEN the agent reports a finding, THEN the finding SHALL include the WCAG 2.2 success criterion number and name, a severity, the location as `path:line`, and a concrete fix.
- 3.2 The agent SHALL use exactly these severities: Critical (blocks a user completely), Serious (major barrier with a workaround), Moderate (slows a user down), Minor (best-practice gap).
- 3.3 WHEN the agent proposes a fix, THEN the fix SHALL show the corrected code or the exact attribute or token to change.
- 3.4 WHEN the agent finishes a review, THEN it SHALL end with a results table giving each baseline test one of: Pass, Fail, Not applicable, Not tested.
- 3.5 IF the agent finds no issues in a test category, THEN it SHALL report "No issues found by static review" for that category and name what it inspected.

---

## REQ-4 No conformance claims without evidence

**User story:** As a developer, I want the agent to be honest about what it did and did not verify, so that I never ship on a false "accessible" verdict.

### Acceptance criteria

- 4.1 The agent SHALL NOT state that code, a page or an app "conforms", "is accessible" or "passes WCAG" unless it cites evidence such as a test result, a tool output or a manual keyboard check it actually ran.
- 4.2 WHEN a check needs a running page or a screen reader that the agent cannot use (for example rendered contrast, real focus order, screen-reader output), THEN the agent SHALL mark it "Not tested" and say what manual step would verify it.
- 4.3 WHEN the agent reviews source only, THEN its report SHALL state "Static review only. This is not a conformance statement."
- 4.4 IF the agent cites evidence, THEN it SHALL name the command or file that produced it and the result.

---

## REQ-5 a11y-guard hook

**User story:** As a developer, I want every saved component checked against our accessibility rules, so that violations are fixed as I write them.

### Acceptance criteria

- 5.1 The system SHALL provide a hook named `a11y-guard` in `.kiro/hooks/a11y-guard.kiro.hook`.
- 5.2 WHEN a `.tsx` file under `skeleton/src/` or `apps/*/src/` is saved, THEN the hook SHALL trigger an agent prompt for that file (event `fileEdited`).
- 5.3 The hook prompt SHALL instruct the agent to review the saved file against `.kiro/steering/accessibility.md` (WCAG 2.2 AA).
- 5.4 WHEN the review finds a violation, THEN the prompt SHALL instruct the agent to fix it in the file and explain each fix in one line.
- 5.5 WHEN the review finds no violation, THEN the prompt SHALL instruct the agent to make no edit and reply with one line.
- 5.6 The hook SHALL NOT trigger on files under `node_modules/`, `dist/` or `tests/`.

---

## REQ-6 test-buddy hook

**User story:** As a developer, I want a new component to get its accessibility test automatically, so that the "every component has an axe test" rule is never skipped.

### Acceptance criteria

- 6.1 The system SHALL provide a hook named `test-buddy` in `.kiro/hooks/test-buddy.kiro.hook`.
- 6.2 WHEN a new `.tsx` file is created in any `src/components` folder, THEN the hook SHALL trigger an agent prompt (event `fileCreated`).
- 6.3 The hook prompt SHALL instruct the agent to create a Vitest and `vitest-axe` test for the component in the sibling `tests/unit/` folder, named `<Component>.test.tsx`, following the pattern of the existing tests there.
- 6.4 The generated test SHALL render the component, assert that `axe` reports zero violations (WCAG 4.1.2 and related), and cover the component's keyboard behaviour where it has any (WCAG 2.1.1).
- 6.5 The hook prompt SHALL instruct the agent to run the new test and fix it until it passes, without weakening the assertion or disabling an axe rule.
- 6.6 IF a test file for the component already exists, THEN the hook prompt SHALL instruct the agent not to overwrite it.

---

## REQ-7 skeleton-sync hook

**User story:** As a maintainer, I want to know which apps are affected when a skeleton component changes, so that fixes made in the skeleton reach the apps.

### Acceptance criteria

- 7.1 The system SHALL provide a hook named `skeleton-sync` in `.kiro/hooks/skeleton-sync.kiro.hook`.
- 7.2 WHEN a file in `skeleton/src/components/` changes, THEN the hook SHALL trigger an agent prompt (event `fileEdited`).
- 7.3 The hook prompt SHALL instruct the agent to list each app in `apps/` that imports or contains a copy of the changed component, or to state that no apps exist yet.
- 7.4 The hook prompt SHALL instruct the agent to state, for each affected app, what needs updating (for example "copy the file", "update the prop name in `X.tsx`").
- 7.5 The hook prompt SHALL instruct the agent to report only and not edit app files, consistent with the rule that shared improvements go into `skeleton/` first.

---

## REQ-8 readme-keeper hook

**User story:** As a maintainer, I want one click to bring the README in line with the specs and hooks, so that the documentation does not drift.

### Acceptance criteria

- 8.1 The system SHALL provide a hook named `readme-keeper` in `.kiro/hooks/readme-keeper.kiro.hook`.
- 8.2 The hook SHALL run only when a developer triggers it manually (event `userTriggered`).
- 8.3 WHEN triggered, THEN the hook prompt SHALL instruct the agent to read every spec under `.kiro/specs/` and every hook under `.kiro/hooks/`, and update `README.md` to describe them.
- 8.4 The hook prompt SHALL instruct the agent to keep the README's existing license section and the project pitch line, and to change only the sections it can derive from specs and hooks.
- 8.5 The hook prompt SHALL instruct the agent to state facts only from the files it read and to not claim WCAG conformance (see REQ-4).

---

## REQ-9 Hook format and repository hygiene

**User story:** As a hackathon submitter, I want the brain files committed and valid, so that judges can see and run them.

### Acceptance criteria

- 9.1 Each hook file SHALL be valid JSON in the Kiro hook format with `enabled`, `name`, `description`, `version`, `when` and `then` fields.
- 9.2 Each hook's `then.type` SHALL be `askAgent` and its `when.type` SHALL be one of `fileEdited`, `fileCreated` or `userTriggered`.
- 9.3 The files under `.kiro/agents/` and `.kiro/hooks/` SHALL NOT be matched by `.gitignore`.
- 9.4 WHEN a validation script parses the agent and all hook files, THEN it SHALL report zero errors.

---

## REQ-10 Developer documentation

**User story:** As a developer, I want a short guide to the brain, so that I know what runs when I save a file and how to run the reviewer myself.

### Acceptance criteria

- 10.1 The system SHALL provide `docs/kiro-brain.md`.
- 10.2 The document SHALL explain what the `trusted-tester` agent is, how to start it, and what its report contains.
- 10.3 The document SHALL list each hook with its trigger, what it does and how to disable it.
- 10.4 The document SHALL state the limits of the brain: it performs static review and does not replace testing with assistive technology (see REQ-4).
- 10.5 The document SHALL be short enough to read in under five minutes.
