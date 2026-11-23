# Property-based test findings

Defects the `a11y-pbt` property tests found in `skeleton/`, with the shrunk counter-example and the fix. Each fix is in `skeleton/src/`, and each has an example regression test.

## 1. Field: whitespace-only hint or error renders an empty message and marks the control invalid

- **Property:** `tests/unit/properties/Field.property.test.tsx` (REQ-4.5, 4.7, 4.10).
- **Counter-example (fast-check seed 1818199050, shrunk):** `{ id: "a", label: "Say \"hi\" & <b>bye</b>", hint: undefined, error: "   ", required: false, kind: "text" }`. An earlier failure in the same run used `hint: ""` and `error: "   "`.
- **Symptom:** `aria-describedby` was `"a-error"` and `aria-invalid="true"` although the visible message was blank. The control was announced as invalid with nothing to read. An empty `hint` rendered an empty `<span id="x-hint">` that the control pointed to.
- **Cause:** `Field` tested `hint != null` and `error != null`, so `""` and whitespace counted as a message.
- **Fix:** `skeleton/src/components/Field.tsx` now uses `hasContent()`. `null`, `undefined`, booleans, the empty string and whitespace-only strings count as absent.
- **Regression test:** `tests/unit/Field.test.tsx`, "treats an empty or whitespace-only hint and error as absent".

## 2. Dialog: Shift+Tab leaves the dialog when the panel itself has focus

- **Property:** `tests/unit/properties/Dialog.property.test.tsx` (REQ-5.6, 5.11).
- **Counter-example (fast-check seed -1698121922, shrunk):** one `button` child, actions `["clickPanel", "Shift+Tab", "Tab"]`, close via Escape. Focus after `Shift+Tab` was the "Open dialog" trigger outside the dialog.
- **Cause:** the Tab handler only intercepted Tab on the first (Shift+Tab) or last (Tab) focusable child. A click on the panel's padding moves focus to the panel (`tabIndex={-1}`), which is neither.
- **Fix:** `skeleton/src/components/Dialog.tsx` now also treats the panel as a wrap point: Shift+Tab from the panel focuses the last focusable child, and Tab focuses the first.
- **Regression test:** `tests/unit/Dialog.test.tsx`, "keeps Shift+Tab inside the dialog when the panel itself has focus".

## No defect found

- **Contrast** (73 checks across the light theme and both dark sources): all pairs in the matrix pass, and the two dark blocks are identical.
- **Tabs:** the property passed on the current code. A temporary mutation (`End` selects `tabs.length - 2`) made it fail with the counter-example `values: ["a","aa","a0","ab"], initial: 0, keys: ["End"]`. The mutation was reverted.

## 3. Dialog property: flaky `expect(trigger).toHaveFocus()` after opening (test race, not a Dialog defect)

- **Report:** the property failed once in `apps/grimoire` ("Property failed after 26 tests", seed 2072499194, path "25"). Re-runs passed, including with `FC_SEED=2072499194`. The assertion text was not kept.
- **Suspect 1, proven:** the test asserted `expect(trigger).toHaveFocus()` right after `user.click(trigger)`. Dialog moves focus into the panel in a `requestAnimationFrame`. With a temporary `await new Promise(r => setTimeout(r, 50))` before that assertion, the property failed on the first case (seed -1587669035, counterexample: one `button` child, actions `["Tab"]`, close via Escape) with `expect(element).toHaveFocus()`. The assertion passes only if the frame has not fired yet, so it depends on timing. The delay was removed.
- **Suspect 2, not reproduced:** the same 50 ms delay before the `expect(trigger).toHaveFocus()` after close did not fail (100 cases passed). Testing Library wraps `user-event` calls in `act`, so the passive effect that restores focus has flushed by then. No change made for this assertion.
- **Fix:** removed the post-click `expect(trigger).toHaveFocus()`. The invariant stays: the following `waitFor` requires focus inside the dialog, every action re-checks it, and after close focus must be on the trigger. Applied in `skeleton/`, `apps/grimoire` and `apps/seance` (identical file). Dialog itself is unchanged.
- **Not proven:** that this assertion was the one that failed on 2026-11-23, since the message was lost. It is the only timing-dependent assertion found, and it fails deterministically once the frame has fired. The failing seed does not replay it, because the outcome depends on timing, not on the generated input.
