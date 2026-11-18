# Trusted Tester review: apps/seance

Reviewed once by the Trusted Tester reviewer agent (DHS Section 508 Trusted Tester method, WCAG 2.2 AA). The agent did a static read of `apps/seance/src/` and did not run a browser, so this is not a conformance statement. Rendered checks are covered by the Playwright axe scans (light and dark), the reflow and text-spacing specs and the keyboard-only specs in `apps/seance/tests/e2e/`.

## Findings and what was done

| # | Severity | Criterion | Location | Finding | Result |
| --- | --- | --- | --- | --- | --- |
| 1 | Moderate | 4.1.2 | `src/components/ErrorSummary.tsx` | `aria-labelledby` on a `div` with no role is not allowed. | **Fixed.** The `div` now has `role="group"`. The unit test checks it. |
| 2 | Minor | 4.1.3, 1.4.1 | `StepActions.tsx`, `BookingPage.tsx` | While submitting, sighted users saw only a dimmed button. | **Fixed.** `BookingPage` shows the visible text "Booking your séance…" while submitting. It is not a live region; the announcer speaks the same message. |
| 3 | Minor | 4.1.2 | `src/components/MotionToggle.tsx`, `MotionContext.tsx` | When the OS already asks for reduced motion, the toggle is pressed and does nothing, with no explanation. | **Not fixed here.** The toggle is a skeleton primitive and behaves the same in every app. Per REQ-19.1 it should be changed in `skeleton/` first, with a test. Left for a skeleton change. |
| 4 | Minor | 1.3.1 | `src/components/PageShell.tsx` | The visible site name "Seance" is `aria-hidden` and not a link. | **Not fixed here.** This is the skeleton's shell and a deliberate choice there (the page title and `h1` name the page). Same reason as 3: change `skeleton/` first. |

## Not checked by the agent

Rendered contrast, 320 px reflow, 400% zoom, text spacing, screen readers and the native date and time pickers. See `apps/seance/ACR.md` and the e2e specs for the automated evidence on contrast, reflow, spacing and keyboard use. No screen reader was available, so screen-reader behaviour is untested.
