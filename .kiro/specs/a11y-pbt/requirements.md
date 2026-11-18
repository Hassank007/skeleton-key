# Property-Based Accessibility Tests: Requirements

This spec adds property-based tests (PBT) to `skeleton/`, using `fast-check` with Vitest. A property test states an accessibility invariant and checks it against many generated inputs, instead of the handful an example test uses. Requirements use EARS notation. WCAG references are to WCAG 2.2.

**Scope.** Four properties (contrast, Field, Dialog, Tabs), a small WCAG relative-luminance utility with its own example-based tests, and the shared test support they need. Everything lives in `skeleton/` and reaches the apps through `npm run new-app`. Out of scope: Button, AppLink, Toast, PageShell; the Playwright page-level tests; the conformance report and the MCP server (they may consume these tests' results later).

**Terms.**
- *Case*: one generated input to a property.
- *Token matrix*: the explicit, checked-in list of which colour token may be used on which surface token (REQ-2).
- *Theme source*: one place where colour tokens are defined. There are three: the light `:root` block in `tokens.css`, the `prefers-color-scheme: dark` block in `dark.css`, and the `[data-theme='dark']` block in `dark.css`.

---

## REQ-1 Test infrastructure

**User story:** As a developer, I want the property tests to run with `npm test` and report failures I can reproduce, so that a failing property is a bug report and not a flaky test.

### Acceptance criteria

- 1.1 The system SHALL add `fast-check` to `skeleton/` as a devDependency, and SHALL record the reason for it in `design.md`.
- 1.2 The system SHALL place property tests under `skeleton/tests/unit/properties/` in files named `*.property.test.ts(x)`, so that the existing Vitest `include` pattern runs them without config changes.
- 1.3 The system SHALL provide one shared helper that holds the default number of cases, the case-count floor and the seed handling for every property test.
- 1.4 The default number of cases per property (except contrast) SHALL be at least 100.
- 1.5 IF the environment variable `FC_NUM_RUNS` is set to a number below 100, THEN the helper SHALL ignore it and use 100.
- 1.6 WHEN the environment variable `FC_SEED` is set, THEN the helper SHALL pass it to `fast-check` so that a failure can be replayed.
- 1.7 WHEN a property fails, THEN the output SHALL include the `fast-check` seed, the failing path and the shrunk counterexample.
- 1.8 WHEN a property finishes, THEN the helper SHALL fail the test if fewer than 100 cases ran (for example because of discarded preconditions).
- 1.9 The property tests SHALL NOT use `Math.random`, wall-clock time or network access, and SHALL leave the DOM clean between cases (unmount, and no leftover `inert` attribute or portal nodes).
- 1.10 WHEN `npm test` runs on a clean checkout, THEN the whole suite (existing tests plus property tests) SHALL pass, and each property test file SHALL finish within the per-test timeout set in the design.

---

## REQ-2 Contrast: WCAG relative-luminance utility

**User story:** As a developer, I want one small, correct contrast calculator with its own tests, so that every contrast claim in the repo rests on code that is itself verified.

### Acceptance criteria

- 2.1 The system SHALL provide a utility at `skeleton/tests/unit/support/contrast.ts` that parses `#rgb` and `#rrggbb` colours, computes WCAG relative luminance and computes the contrast ratio of two colours, following the WCAG 2.2 definitions.
- 2.2 The utility SHALL linearise sRGB channels with the threshold `0.04045` and the exponent `2.4`.
- 2.3 The contrast ratio SHALL be symmetric in its two arguments, and SHALL be at least 1 and at most 21.
- 2.4 IF the utility receives a string that is not a 3-digit or 6-digit hex colour (for example a named colour, `rgb()`, `var()` or an 8-digit hex with alpha), THEN it SHALL throw an error naming the offending value.
- 2.5 The system SHALL provide example-based tests for the utility in `skeleton/tests/unit/contrast.test.ts` covering at least: black on white is `21:1`; a colour on itself is `1:1`; `#767676` on white is at least 4.5:1 and `#777777` on white is below 4.5:1; the luminance of pure red, green and blue; 3-digit and 6-digit forms of the same colour give the same ratio; argument order does not change the ratio; invalid input throws.
- 2.6 The example tests SHALL include a case that distinguishes the `0.04045` threshold from the older `0.03928` value, or SHALL state in a comment why the two give the same result for 8-bit channels.
- 2.7 The existing `skeleton/tests/unit/tokens-contrast.test.ts` SHALL use the shared utility instead of its private copy of the luminance code, and SHALL keep passing.

---

## REQ-3 Contrast property: every theme pair

**User story:** As a developer, I want every colour pairing the themes can produce to be checked, so that no token change can silently drop below the WCAG minimums.

### Acceptance criteria

- 3.1 The system SHALL read the token values from the real CSS files (`src/tokens/tokens.css` and `src/tokens/dark.css`) and SHALL NOT keep a second copy of the colour values in test code.
- 3.2 The system SHALL parse all three theme sources and SHALL produce a complete colour map for each of: light, dark via `prefers-color-scheme`, and dark via `[data-theme='dark']`.
- 3.3 IF a theme source lacks a colour token that the light theme defines, or defines one with a non-hex value, THEN the test SHALL fail and name the token and the source.
- 3.4 The dark theme via `prefers-color-scheme` and the dark theme via `[data-theme='dark']` SHALL define identical values for every colour token. IF they differ, THEN the test SHALL fail and name the token.
- 3.5 The system SHALL keep a token matrix in `skeleton/tests/unit/support/token-matrix.ts` that lists, for each foreground token, the background tokens it is allowed on and the required minimum (4.5 for text, 3 for UI components and focus rings).
- 3.6 The token matrix SHALL be derived from how the tokens are used in the components' CSS Modules, and each entry SHALL carry the WCAG criterion it protects (1.4.3 or 1.4.11).
- 3.7 FOR EVERY theme and EVERY allowed pair in the token matrix, the test SHALL assert that the contrast ratio meets the pair's minimum. The check SHALL be exhaustive over the matrix and SHALL NOT sample.
- 3.8 The matrix SHALL include at least these text pairs on both `--color-surface` and `--color-surface-raised`: `--color-text`, `--color-text-muted`, `--color-link`, `--color-link-hover`, `--color-error`, `--color-success`, `--color-warning`; and `--color-text-on-accent` on both `--color-accent` and `--color-accent-hover`. Each SHALL need at least 4.5:1.
- 3.9 The matrix SHALL include these UI pairs on both surface tokens, each needing at least 3:1: `--color-border`, `--color-focus-ring` and `--color-accent`.
- 3.10 WHEN a colour token declared in `tokens.css` or `dark.css` appears neither in the token matrix nor in an explicit exemption list with a written reason, THEN the test SHALL fail, so that a new token cannot skip the check.
- 3.11 The test SHALL include a negative control: WHEN it is given a synthetic token set with one pair below the minimum, THEN the checker SHALL report that pair as a failure. This proves the property can fail.
- 3.12 WHEN a pair fails, THEN the failure message SHALL include the theme, the foreground token and value, the background token and value, the measured ratio to two decimals and the required minimum.

---

## REQ-4 Field property

**User story:** As a developer, I want every Field configuration to produce a correctly labelled and described control, so that no combination of label, hint, error and input type can break the form contract.

### Acceptance criteria

- 4.1 The system SHALL provide a property test at `skeleton/tests/unit/properties/Field.property.test.tsx`.
- 4.2 The generator SHALL produce, for each case: a field `id`; a label string; a hint that is absent or a string; an error that is absent or a string; a `required` flag; and a control kind taken from `text`, `email`, `password`, `tel`, `url`, `search`, `number`, `date`, `textarea` and `select`.
- 4.3 The generated strings SHALL include non-empty text with spaces, punctuation, quotes, `<`, `&` and non-ASCII characters, and SHALL include the empty string for hint and error as an explicit edge case.
- 4.4 FOR ANY generated case, the rendered control SHALL have an accessible name, computed with `dom-accessibility-api`, equal to the normalised text of the visible `<label>` (which includes the "(required)" suffix when `required` is true).
- 4.5 FOR ANY generated case, the control's `aria-describedby` SHALL list exactly the ids of the hint element and the error element that exist in the DOM, in the order hint then error, and every listed id SHALL resolve to exactly one element.
- 4.6 IF neither a hint nor an error exists, THEN the control SHALL have no `aria-describedby` attribute.
- 4.7 FOR ANY generated case, the control SHALL have `aria-invalid="true"` if and only if an error message exists, and SHALL otherwise have no `aria-invalid` attribute or the value `"false"`.
- 4.8 FOR ANY generated case, the visible error text SHALL start with the text "Error:" so that the error state is not conveyed by colour or icon alone (WCAG 1.4.1, 3.3.1).
- 4.9 FOR ANY generated case, `vitest-axe` SHALL report zero violations on the rendered Field.
- 4.10 The generator SHALL define an empty string for hint or error as "no message". IF `Field` renders an empty hint or error element, or sets `aria-invalid="true"` without visible error text, THEN the property SHALL fail, and the task list SHALL include fixing `Field` so that it treats an empty or whitespace-only hint or error as absent.
- 4.11 The test file SHALL state in a comment that `axe`'s `color-contrast` rule cannot run in jsdom and that colour contrast is covered by REQ-3.

---

## REQ-5 Dialog property

**User story:** As a developer, I want the Dialog's focus trap and focus return checked against many content shapes, so that no mix of focusable children can let a keyboard user escape or lose their place.

### Acceptance criteria

- 5.1 The system SHALL provide a property test at `skeleton/tests/unit/properties/Dialog.property.test.tsx`.
- 5.2 The generator SHALL produce between 1 and 10 focusable children per case, each chosen from: `button`, enabled `input`, `textarea`, `select`, `a` with `href`, and a `div` with `tabindex="0"`.
- 5.3 The generator SHALL also interleave non-focusable distractors chosen from: a disabled `button`, a disabled `input`, an `a` without `href`, a `div` with `tabindex="-1"` and plain text. Distractors SHALL NOT count toward the 1 to 10 children.
- 5.4 The generator SHALL NOT produce a positive `tabindex`. The design SHALL record this as a documented exclusion.
- 5.5 The generator SHALL produce a sequence of 1 to 30 actions, each one of `Tab`, `Shift+Tab` or a click on a non-focusable area of the dialog panel.
- 5.6 WHEN the dialog is open, THEN FOR ANY generated children and action sequence, after every action `document.activeElement` SHALL be inside the dialog panel (WCAG 2.1.2, 2.4.3).
- 5.7 WHEN the dialog opens, THEN focus SHALL move into the dialog before the first action runs.
- 5.8 The test SHALL open the dialog from a trigger button that has focus, and, after the action sequence, SHALL close it by one generated method chosen from Escape, the close button and a click on the backdrop.
- 5.9 WHEN the dialog closes by any of those methods, THEN `document.activeElement` SHALL be the trigger button and the dialog SHALL no longer be in the DOM.
- 5.10 FOR ANY generated case, the open dialog SHALL have `role="dialog"`, `aria-modal="true"` and an accessible name equal to its title, and `vitest-axe` SHALL report zero violations on the open dialog.
- 5.11 IF a property run exposes a focus escape in `Dialog` (for example Shift+Tab while the panel itself has focus), THEN the task list SHALL include fixing `Dialog` in `skeleton/src/components/Dialog.tsx`, and the shrunk counterexample SHALL be kept as an example-based regression test in `tests/unit/Dialog.test.tsx`.

---

## REQ-6 Tabs property

**User story:** As a developer, I want the Tabs keyboard model checked against any number of tabs and any key sequence, so that the selection, roving tabindex and panel visibility can never disagree.

### Acceptance criteria

- 6.1 The system SHALL provide a property test at `skeleton/tests/unit/properties/Tabs.property.test.tsx`.
- 6.2 The generator SHALL produce a tab count from 1 to 12, unique tab values that are safe to use in element ids, a generated label per tab and a generated initially selected index.
- 6.3 The generator SHALL produce a sequence of 0 to 50 key presses, each one of `ArrowLeft`, `ArrowRight`, `Home` and `End`.
- 6.4 The test SHALL start each case by focusing the initially selected tab, and SHALL then press the keys in order.
- 6.5 FOR ANY generated case, after the initial render and after every key press, exactly one tab SHALL have `aria-selected="true"` and all others SHALL have `aria-selected="false"`.
- 6.6 FOR ANY generated case, after the initial render and after every key press, the selected tab SHALL be the only tab with `tabindex="0"`, and every other tab SHALL have `tabindex="-1"`.
- 6.7 FOR ANY generated case, after the initial render and after every key press, exactly one `tabpanel` SHALL be visible, and it SHALL be the panel that the selected tab's `aria-controls` points to and whose `aria-labelledby` points back to the selected tab.
- 6.8 FOR ANY generated case, after every key press, the focused element SHALL be the selected tab (automatic activation).
- 6.9 The test SHALL include an independent reference model, a pure function from (tab count, current index, key) to the next index (wrapping for arrows, 0 for Home, last for End), and SHALL assert that the selected tab's index equals the model's index after every key press.
- 6.10 The case with one tab SHALL be covered by the generator's range, and SHALL satisfy every criterion above.

---

## REQ-7 Explanation of what each property protects

**User story:** As a reviewer, I want to know what each property catches that example tests cannot, so that I can judge whether the extra test code is worth keeping.

### Acceptance criteria

- 7.1 The system SHALL provide `design.md` in this spec folder with a section for each of the four properties.
- 7.2 Each section SHALL state the invariant, the input space, the class of defect the property protects against and why a hand-written example test would not catch it.
- 7.3 Each property test file SHALL start with a short comment stating the invariant it proves and pointing to the matching section of `design.md`.

---

## REQ-8 Quality gates and repository hygiene

**User story:** As a maintainer, I want the new tests to pass under the same gates as the rest of the skeleton, so that they never become the reason the build is red.

### Acceptance criteria

- 8.1 WHEN `npm run lint` runs in `skeleton/`, THEN it SHALL report zero errors and zero warnings. Because that script lints only `src`, WHEN `npx eslint tests/unit/properties tests/unit/support tests/unit/contrast.test.ts --max-warnings 0` runs, THEN it SHALL also report zero errors and zero warnings. (Existing test files have five known lint errors, in `Dialog.test.tsx`, `Toast.test.tsx` and `vitest-axe.d.ts`. They are outside this spec.)
- 8.2 WHEN `npx tsc --noEmit` runs in `skeleton/`, THEN it SHALL report zero errors for the new test files under strict mode.
- 8.3 WHEN `npm test` runs in `skeleton/`, THEN every existing and new test SHALL pass.
- 8.4 WHEN the Playwright tests run in `skeleton/` (`npm run test:e2e`), THEN they SHALL still pass.
- 8.5 The property tests SHALL NOT disable an axe rule, add an ESLint disable comment to hide an accessibility violation or weaken an assertion to make a case pass.
- 8.6 WHEN a property test finds a defect in a skeleton component, THEN the fix SHALL be made in `skeleton/src/` and not worked around in the test.
- 8.7 The change SHALL add no dependency other than `fast-check` and `dom-accessibility-api`, and SHALL NOT modify any `apps/` folder.
- 8.8 The system SHALL add a short "Property-based tests" section to `skeleton/README.md` explaining how to run them, `FC_NUM_RUNS` and `FC_SEED`, and how to replay a failure.
