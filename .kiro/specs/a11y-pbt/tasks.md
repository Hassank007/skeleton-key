# Property-Based Accessibility Tests: Implementation Tasks

All paths are relative to `skeleton/` unless stated. Run commands from `skeleton/`. Mark a task `[x]` only after its checks pass.

## 1. Infrastructure

- [x] 1. Add fast-check and the shared support code
  - [x] 1.1 Install `fast-check` and `dom-accessibility-api` with `npm install -D fast-check@^4 dom-accessibility-api@^0.5.16`. Confirm `npm ls dom-accessibility-api` shows one deduped version. *(REQ-1.1, REQ-8.7)*
  - [x] 1.2 Create `tests/unit/support/pbt.ts` with `MIN_RUNS`, `numRuns()`, `seed()` and `checkProperty()` including the case-count guard. *(REQ-1.3 to 1.9)*
  - [x] 1.3 Add `tests/unit/support/pbt.test.ts` with example tests: `FC_NUM_RUNS=5` is raised to 100, `FC_NUM_RUNS=250` gives 250, `FC_SEED` is passed through, and a property that discards most cases fails the guard. *(REQ-1.5, 1.6, 1.8)*

## 2. Contrast utility and example tests

- [x] 2. Build the WCAG relative-luminance utility
  - [x] 2.1 Create `tests/unit/support/contrast.ts` with `parseHex`, `relativeLuminance` and `contrastRatio`; use `0.04045`; throw on non-hex input naming the value. *(REQ-2.1 to 2.4)*
  - [x] 2.2 Create `tests/unit/contrast.test.ts` with the example tests listed in REQ-2.5 and the threshold note from REQ-2.6. *(REQ-2.5, 2.6)*
  - [x] 2.3 Replace the private `lum` and `ratio` helpers in `tests/unit/tokens-contrast.test.ts` with imports from `support/contrast.ts`; confirm the file still passes. *(REQ-2.7)*

## 3. Property 1: Contrast

- [x] 3. Prove contrast for every theme pair
  - [x] 3.1 Create `tests/unit/support/theme-tokens.ts` that parses `tokens.css` and `dark.css` (`?raw`) into the `light`, `dark-media` and `dark-attr` maps, throwing on missing tokens and non-hex values. *(REQ-3.1 to 3.3)*
  - [x] 3.2 Run `grep` for `var(--color-` over `src/**/*.css` and list how each colour token is used; write `tests/unit/support/token-matrix.ts` with `MATRIX` and `EXEMPT` from that list, each entry carrying its criterion and use. *(REQ-3.5, 3.6, 3.8, 3.9)*
  - [x] 3.3 Create `tests/unit/properties/contrast.property.test.ts`: exhaustive `it.each` over theme × matrix pair, with the failure message from REQ-3.12. *(REQ-3.7, 3.12)*
  - [x] 3.4 Add to the same file: the two-dark-blocks equality test, the token completeness test and the negative-control test. *(REQ-3.4, 3.10, 3.11)*
  - [x] 3.5 IF a real pair fails, fix the token in `src/tokens/tokens.css` or `src/tokens/dark.css`, not the matrix, and record the change in the final report. *(REQ-8.6)*

## 4. Property 2: Field

- [x] 4. Prove the Field contract
  - [x] 4.1 Create `tests/unit/properties/Field.property.test.tsx` with the file header comment, the generators from the design and the render helper for the ten control kinds. *(REQ-4.1 to 4.3, 7.3)*
  - [x] 4.2 Assert accessible name equals the visible label, `aria-describedby` equals the existing hint and error ids, ids resolve once, `aria-invalid` iff error. *(REQ-4.4 to 4.7)*
  - [x] 4.3 Assert the "Error:" text prefix and zero axe violations, and add the jsdom colour-contrast comment. *(REQ-4.8, 4.9, 4.11)*
  - [x] 4.4 Run the property. IF the empty-string case fails, change `src/components/Field.tsx` so an empty or whitespace-only hint or error counts as absent, and add an example regression test to `tests/unit/Field.test.tsx`. IF it passes, note "no defect found". *(REQ-4.10, 8.6)*

## 5. Property 3: Dialog

- [x] 5. Prove the Dialog focus trap and focus return
  - [x] 5.1 Create `tests/unit/properties/Dialog.property.test.tsx` with the file header comment, the children generators (focusables, distractors, interleaving) and the action and close-method generators. *(REQ-5.1 to 5.5, 7.3)*
  - [x] 5.2 Implement the procedure: open from a focused trigger, await focus inside, run each action and assert focus is inside the panel after each. *(REQ-5.6, 5.7)*
  - [x] 5.3 Close via the generated method and assert the dialog is gone and focus is on the trigger; assert role, `aria-modal`, name and zero axe violations while open. *(REQ-5.8 to 5.10)*
  - [x] 5.4 Clean up `inert` and portal nodes between cases. *(REQ-1.9)*
  - [x] 5.5 Run the property. IF the panel-focus Shift+Tab escape appears, fix `src/components/Dialog.tsx` as described in the design and add the shrunk counterexample to `tests/unit/Dialog.test.tsx`. *(REQ-5.11, 8.6)*

## 6. Property 4: Tabs

- [x] 6. Prove the Tabs keyboard model
  - [x] 6.1 Create `tests/unit/properties/Tabs.property.test.tsx` with the file header comment, the `chain`-based generator and the `next(count, index, key)` reference model. *(REQ-6.1 to 6.3, 6.9, 7.3)*
  - [x] 6.2 Implement `checkState`: one selected tab, one `tabindex=0`, one visible panel linked both ways, focus on the selected tab, index equals model. Call it after render and after every key. *(REQ-6.4 to 6.8, 6.10)*
  - [x] 6.3 Mutation check: temporarily change `End` in `src/components/Tabs.tsx` to select `tabs.length - 2`, confirm the property fails and shrinks, then revert the change and confirm `git diff` shows no change to `Tabs.tsx`. *(design: Risks)*

## 7. Documentation

- [x] 7. Document the tests
  - [x] 7.1 Confirm each property test file starts with the invariant comment and a pointer to the matching `design.md` section. *(REQ-7.3)*
  - [x] 7.2 Add a "Property-based tests" section to `README.md` with how to run, `FC_NUM_RUNS`, `FC_SEED` and replay. *(REQ-8.8)*

## 8. Verification

- [x] 8. Run every check and fix every failure
  - [x] 8.1 `npm run lint` reports zero errors and zero warnings, and `npx eslint tests/unit/properties tests/unit/support tests/unit/contrast.test.ts --max-warnings 0` does too. *(REQ-8.1)*
  - [x] 8.2 `npx tsc --noEmit` reports zero errors. *(REQ-8.2)*
  - [x] 8.3 `npm test` passes; record the test counts per file and in total. *(REQ-8.3, 1.10)*
  - [x] 8.4 Confirm each property ran at least 100 cases (the guard passes) and the suite finishes inside the timeouts. *(REQ-1.4, 1.8, 1.10)*
  - [x] 8.5 `npm run test:e2e` passes (Playwright). *(REQ-8.4)*
  - [x] 8.6 Confirm no `apps/` file changed, no axe rule was disabled and no lint-disable comment was added in the new files: `git diff --stat -- ../apps` is empty and `grep -rn "eslint-disable\|disableRules\|rules:" tests/unit/properties tests/unit/support` finds nothing. *(REQ-8.5, 8.7)*
  - [x] 8.7 Remove any temporary files created while working. Run `git status` and confirm only intended files changed.
