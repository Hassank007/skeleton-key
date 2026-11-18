# Accessibility Conformance Report: WCAG Edition (VPAT 2.5 style)

## Product information

- **Product name:** seance
- **Product version:** 0.0.0
- **Report date:** 2026-11-18
- **Product description:** Not provided
- **Applicable standard:** WCAG 2.2 Level A and Level AA
- **Generator:** Skeleton Key ACR generator (scripts/acr.mjs)
- **Generator version:** 1.0.0

The layout follows the style of the Information Technology Industry Council (ITI) VPAT 2.5 WCAG edition. This is not an official VPAT and does not use the ITI template or logo.

## Disclaimer

This report is generated from automated test results and a static code review. It is not a legal certification, an audit by an accredited body, or a statement of compliance with any law. Automated tools find only a part of the accessibility problems that exist; criteria marked Not Evaluated need testing by a person, including with assistive technology.

## Evaluation methods

- **Playwright page tests with axe-core:** read; 44 passed, 0 failed, 0 skipped, 0 inconclusive; axe-core 4.14.1, 23 scans, pages: /, /about, /book/details, /book/spirit, /book/time, /no/such/page; colour schemes: dark, light.
- **Vitest unit and property tests:** read; 422 passed, 0 failed, 0 skipped, 0 inconclusive.
- **Trusted Tester static review:** read from docs/trusted-tester-review-seance.md.

## Terms

- **Supports:** The evidence listed in the remarks shows the criterion is met, and none of it shows otherwise.
- **Partially Supports:** Some checks pass while others fail, or a known problem is still open.
- **Does Not Support:** A check fails or a serious problem is open, and no qualifying check passes.
- **Not Applicable:** The app owner states the criterion does not apply and gives a reason. The generator did not test it.
- **Not Evaluated:** There is not enough evidence either way, or a person must judge it.

## Summary

| Conformance Level | Criteria |
| --- | --- |
| Supports | 23 |
| Partially Supports | 0 |
| Does Not Support | 0 |
| Not Applicable | 0 |
| Not Evaluated | 32 |

## Table 1: Success Criteria, Level A

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.1.1 Non-text Content | Supports | Passing: tests/e2e/motion.spec.ts "Mist art and motion &gt; the mist is aria-hidden and has no title [SC 1.1.1]"; tests/unit/MistArt.test.tsx "MistArt is hidden from assistive technology and not focusable [SC 1.1.1]". |
| 1.2.1 Audio-only and Video-only (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that audio-only and video-only content has a text or audio alternative. |
| 1.2.2 Captions (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has accurate captions. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has an audio description or a text alternative. |
| 1.3.1 Info and Relationships | Supports | Passing: tests/e2e/about.spec.ts "Introduction page and shell &gt; has the title, one h1, the landmarks, and says nothing is stored [SC 2.4.2, 1.3.1]"; tests/e2e/not-found.spec.ts "Not found page &gt; has the title and exactly one h1 [SC 2.4.2, 1.3.1]"; tests/unit/ConfirmDialog.test.tsx "ConfirmDialog lists the booking in a description list with six rows [SC 1.3.1]"; and 18 more. |
| 1.3.2 Meaningful Sequence | Not Evaluated | No evidence found for this criterion. |
| 1.3.3 Sensory Characteristics | Not Evaluated | Needs human judgement: A person must check that instructions do not rely only on shape, colour, size, position or sound. |
| 1.4.1 Use of Color | Supports | Passing: tests/unit/Field.test.tsx "Field error message contains "Error:" prefix (not colour-only) [SC 1.4.1, 3.3.1]"; tests/unit/StepProgress.test.tsx "StepProgress says each step state in words [SC 1.4.1]". |
| 1.4.2 Audio Control | Not Evaluated | No evidence found for this criterion. |
| 2.1.1 Keyboard | Supports | Passing: tests/e2e/booking-errors.keyboard.spec.ts "Booking: error path with the keyboard only &gt; errors are found, linked, fixed and the booking is finished [SC 2.1.1, 2.4.3, 3.3.1, 3.3.3, 4.1.3]"; tests/e2e/booking-happy.keyboard.spec.ts "Booking: happy path with the keyboard only &gt; books a séance from the introduction to the success view [SC 2.1.1, 2.4.3, 2.4.7, 3.3.7, 4.1.3]"; tests/e2e/dialog.spec.ts "Dialog (About page demo) &gt; Escape closes the dialog and returns focus to the trigger [SC 2.1.1, 2.1.2]"; and 15 more. |
| 2.1.2 No Keyboard Trap | Supports | Passing: tests/e2e/booking-errors.keyboard.spec.ts "Keyboard trap check &gt; Tab forward and back through every step never traps focus and never lands on body [SC 2.1.2, 2.4.3]"; tests/e2e/dialog.spec.ts "Dialog (About page demo) &gt; Escape closes the dialog and returns focus to the trigger [SC 2.1.1, 2.1.2]"; tests/unit/ConfirmDialog.test.tsx "ConfirmDialog Escape calls onClose [SC 2.1.2]"; and 1 more. |
| 2.1.4 Character Key Shortcuts | Not Evaluated | No evidence found for this criterion. |
| 2.2.1 Timing Adjustable | Not Evaluated | No evidence found for this criterion. |
| 2.2.2 Pause, Stop, Hide | Supports | Passing: tests/e2e/motion.spec.ts "Mist art and motion &gt; the toggle works from the keyboard [SC 2.1.1, 2.2.2]"; tests/e2e/motion.spec.ts "Mist art and motion &gt; with the OS reduced-motion setting the mist does not animate [SC 2.2.2]"; tests/e2e/motion.spec.ts "Mist art and motion &gt; without the OS setting the mist drifts, and the in-app "Reduce motion" toggle stops it [SC 2.2.2]". |
| 2.3.1 Three Flashes or Below Threshold | Not Evaluated | No evidence found for this criterion. |
| 2.4.1 Bypass Blocks | Supports | Passing: tests/e2e/about.spec.ts "Introduction page and shell &gt; first Tab press focuses the skip link, and Enter moves focus to main [SC 2.4.1]"; tests/unit/PageShell.test.tsx "PageShell activating the skip link moves focus to &lt;main&gt; [SC 2.4.1]"; tests/unit/PageShell.test.tsx "PageShell the skip link is present and href targets #main-content [SC 2.4.1]"; and 1 more. |
| 2.4.2 Page Titled | Supports | Passing: tests/e2e/about.spec.ts "About page &gt; navigating Intro → About moves focus to About h1 and updates title [SC 2.4.2, 2.4.3]"; tests/e2e/about.spec.ts "Introduction page and shell &gt; has the title, one h1, the landmarks, and says nothing is stored [SC 2.4.2, 1.3.1]"; tests/e2e/not-found.spec.ts "Not found page &gt; has the title and exactly one h1 [SC 2.4.2, 1.3.1]"; and 5 more. |
| 2.4.3 Focus Order | Supports | Passing: tests/e2e/about.spec.ts "About page &gt; navigating Intro → About moves focus to About h1 and updates title [SC 2.4.2, 2.4.3]"; tests/e2e/about.spec.ts "Introduction page and shell &gt; keyboard walk: logical Tab order and a visible focus ring on every stop [SC 2.4.3, 2.4.7]"; tests/e2e/booking-errors.keyboard.spec.ts "Booking: error path with the keyboard only &gt; errors are found, linked, fixed and the booking is finished [SC 2.1.1, 2.4.3, 3.3.1, 3.3.3, 4.1.3]"; and 20 more. |
| 2.4.4 Link Purpose (In Context) | Not Evaluated | No test tagged for this criterion was found. axe rule link-name passed on 21 of 21 scans (not enough on its own for this criterion). |
| 2.5.1 Pointer Gestures | Not Evaluated | No evidence found for this criterion. |
| 2.5.2 Pointer Cancellation | Not Evaluated | No evidence found for this criterion. |
| 2.5.3 Label in Name | Not Evaluated | No evidence found for this criterion. |
| 2.5.4 Motion Actuation | Not Evaluated | Needs human judgement: A person must check that no function depends only on device motion, or that motion can be turned off. |
| 3.1.1 Language of Page | Supports | Passing: axe rule html-has-lang passed on 23 of 23 scans; axe rule html-lang-valid passed on 23 of 23 scans. |
| 3.2.1 On Focus | Not Evaluated | No evidence found for this criterion. |
| 3.2.2 On Input | Not Evaluated | No evidence found for this criterion. |
| 3.2.6 Consistent Help | Not Evaluated | Needs human judgement: A person must check that help options appear in the same place on each page. |
| 3.3.1 Error Identification | Supports | Passing: tests/e2e/booking-errors.keyboard.spec.ts "Booking: error path with the keyboard only &gt; errors are found, linked, fixed and the booking is finished [SC 2.1.1, 2.4.3, 3.3.1, 3.3.3, 4.1.3]"; tests/e2e/booking-errors.keyboard.spec.ts "Booking: error path with the keyboard only &gt; the guard sends a visit to step 3 back to step 1 and focus follows [SC 3.3.1, 2.4.3]"; tests/unit/BookingPage.test.tsx "failed submit and the error summary marks every field of the step touched, so each shows its error with a linked description [SC 3.3.1]"; and 12 more. |
| 3.3.2 Labels or Instructions | Supports | Passing: tests/unit/DetailsStep.test.tsx "DetailsStep labels each input and marks it required [SC 3.3.2]"; tests/unit/DetailsStep.test.tsx "DetailsStep links a hint to each input; the phone hint names the allowed characters [SC 3.3.2]"; tests/unit/Field.test.tsx "Field renders a label associated with the input [SC 1.3.1, 3.3.2]"; and 6 more. |
| 3.3.7 Redundant Entry | Supports | Passing: tests/e2e/booking-happy.keyboard.spec.ts "Booking: happy path with the keyboard only &gt; books a séance from the introduction to the success view [SC 2.1.1, 2.4.3, 2.4.7, 3.3.7, 4.1.3]". |
| 4.1.2 Name, Role, Value | Supports | Passing: tests/e2e/axe-steps.spec.ts "Axe scans of every step and state &gt; dark scheme &gt; introduction has zero axe violations (dark) [SC 1.4.3, 1.4.11, 4.1.2]"; tests/e2e/axe-steps.spec.ts "Axe scans of every step and state &gt; dark scheme &gt; step 1 has zero axe violations with a spirit selected (dark) [SC 1.4.3, 1.4.11, 4.1.2]"; tests/e2e/axe-steps.spec.ts "Axe scans of every step and state &gt; dark scheme &gt; step 1 has zero axe violations with the error summary (dark) [SC 1.4.3, 1.4.11, 4.1.2]"; and 30 more. |

## Table 2: Success Criteria, Level AA

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.2.4 Captions (Live) | Not Evaluated | Needs human judgement: A person must check that live audio has real-time captions. |
| 1.2.5 Audio Description (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has an audio description. |
| 1.3.4 Orientation | Not Evaluated | No evidence found for this criterion. |
| 1.3.5 Identify Input Purpose | Supports | Passing: tests/unit/DetailsStep.test.tsx "DetailsStep uses the autocomplete tokens name, email and tel [SC 1.3.5]"; axe rule autocomplete-valid passed on 4 of 4 scans. |
| 1.4.3 Contrast (Minimum) | Not Evaluated | Inconclusive: axe rule color-contrast was incomplete on /book/spirit (6 nodes); axe rule color-contrast was incomplete on /book/time (1 node); axe rule color-contrast was incomplete on /book/time (1 node); axe rule color-contrast was incomplete on /book/details (2 nodes); axe rule color-contrast was incomplete on /book/details (2 nodes); axe rule color-contrast was incomplete on /book/spirit (6 nodes); axe rule color-contrast was incomplete on /book/time (1 node); axe rule color-contrast was incomplete on /book/time (1 node); axe rule color-contrast was incomplete on /book/details (2 nodes); axe rule color-contrast was incomplete on /book/details (2 nodes). A flaky test or an incomplete axe check blocks a rating until it is stable or a person checks it. |
| 1.4.4 Resize Text | Not Evaluated | No test tagged for this criterion was found. axe rule meta-viewport passed on 23 of 23 scans (not enough on its own for this criterion). |
| 1.4.5 Images of Text | Not Evaluated | Needs human judgement: A person must check that text is real text and not an image of text. |
| 1.4.10 Reflow | Supports | Passing: tests/e2e/responsive.spec.ts "Reflow and text spacing &gt; at 320 px wide, step 3 with errors has no horizontal scroll and nothing is clipped [SC 1.4.10]". |
| 1.4.11 Non-text Contrast | Supports | Passing: tests/e2e/axe-steps.spec.ts "Axe scans of every step and state &gt; dark scheme &gt; introduction has zero axe violations (dark) [SC 1.4.3, 1.4.11, 4.1.2]"; tests/e2e/axe-steps.spec.ts "Axe scans of every step and state &gt; dark scheme &gt; step 1 has zero axe violations with a spirit selected (dark) [SC 1.4.3, 1.4.11, 4.1.2]"; tests/e2e/axe-steps.spec.ts "Axe scans of every step and state &gt; dark scheme &gt; step 1 has zero axe violations with the error summary (dark) [SC 1.4.3, 1.4.11, 4.1.2]"; and 35 more. |
| 1.4.12 Text Spacing | Supports | Passing: tests/e2e/responsive.spec.ts "Reflow and text spacing &gt; with the WCAG text-spacing overrides, step 3 with errors loses no text and does not overlap [SC 1.4.12]". |
| 1.4.13 Content on Hover or Focus | Not Evaluated | No evidence found for this criterion. |
| 2.4.5 Multiple Ways | Not Evaluated | No evidence found for this criterion. |
| 2.4.6 Headings and Labels | Not Evaluated | No evidence found for this criterion. |
| 2.4.7 Focus Visible | Supports | Passing: tests/e2e/about.spec.ts "Introduction page and shell &gt; keyboard walk: logical Tab order and a visible focus ring on every stop [SC 2.4.3, 2.4.7]"; tests/e2e/booking-happy.keyboard.spec.ts "Booking: happy path with the keyboard only &gt; books a séance from the introduction to the success view [SC 2.1.1, 2.4.3, 2.4.7, 3.3.7, 4.1.3]". |
| 2.4.11 Focus Not Obscured (Minimum) | Not Evaluated | No evidence found for this criterion. |
| 2.5.7 Dragging Movements | Not Evaluated | No evidence found for this criterion. |
| 2.5.8 Target Size (Minimum) | Supports | Passing: tests/unit/SpiritStep.test.tsx "SpiritStep clicking the label selects the radio [SC 2.5.8]"; axe rule target-size passed on 23 of 23 scans. |
| 3.1.2 Language of Parts | Not Evaluated | Needs human judgement: A person must check that passages in another language are marked with a lang attribute. |
| 3.2.3 Consistent Navigation | Not Evaluated | Needs human judgement: A person must compare navigation across pages to check it keeps the same relative order. Passing evidence is cited but does not change this Level: tests/e2e/about.spec.ts "Introduction page and shell &gt; the nav links are "Book a séance" then "About" [SC 3.2.3]". |
| 3.2.4 Consistent Identification | Not Evaluated | Needs human judgement: A person must compare components across pages to check they are identified the same way. |
| 3.3.3 Error Suggestion | Supports | Passing: tests/e2e/booking-errors.keyboard.spec.ts "Booking: error path with the keyboard only &gt; errors are found, linked, fixed and the booking is finished [SC 2.1.1, 2.4.3, 3.3.1, 3.3.3, 4.1.3]"; tests/unit/BookingPage.test.tsx "per-field validation shows the error on blur, with aria-describedby resolving to the error text, and clears it on a valid change [SC 3.3.1, 3.3.3]". |
| 3.3.4 Error Prevention (Legal, Financial, Data) | Not Evaluated | Needs human judgement: A person must decide whether the pages handle legal or financial data and, if so, check reversal, checking or confirmation. |
| 3.3.8 Accessible Authentication (Minimum) | Supports | Passing: tests/unit/DetailsStep.test.tsx "DetailsStep asks for no password and no confirmation field [SC 3.3.8]"; tests/unit/DetailsStep.test.tsx "DetailsStep does not block paste [SC 3.3.8]". |
| 4.1.3 Status Messages | Supports | Passing: tests/e2e/booking-errors.keyboard.spec.ts "Booking: error path with the keyboard only &gt; errors are found, linked, fixed and the booking is finished [SC 2.1.1, 2.4.3, 3.3.1, 3.3.3, 4.1.3]"; tests/e2e/booking-happy.keyboard.spec.ts "Booking: happy path with the keyboard only &gt; books a séance from the introduction to the success view [SC 2.1.1, 2.4.3, 2.4.7, 3.3.7, 4.1.3]"; tests/unit/BookingPage.test.tsx "BookingPage titles and headings a route change moves focus to the new h1 and announces the title politely [SC 2.4.3, 4.1.3]"; and 6 more. |

## Evidence summary

### Files

- Read: apps/seance/evidence/vitest.json (modified 2026-11-18T15:19:56.133Z)
- Read: apps/seance/evidence/playwright.json (modified 2026-11-18T15:21:00.922Z)
- Read: apps/seance/evidence/axe/chromium-about-page-zero-axe-violations-wcag-2-2-aa.json (modified 2026-11-18T15:20:18.102Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-introduction-has-zero-axe-violations-dark-sc-1-4-3-1-4-dark.json (modified 2026-11-18T15:20:32.272Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-step-1-has-zero-axe-violations-clean-dark-sc-1-4-3-1-4-dark.json (modified 2026-11-18T15:20:33.228Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-step-1-has-zero-axe-violations-with-a-spirit-selected--dark.json (modified 2026-11-18T15:20:36.190Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-step-1-has-zero-axe-violations-with-the-error-summary--dark.json (modified 2026-11-18T15:20:34.556Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-step-2-has-zero-axe-violations-clean-dark-sc-1-4-3-1-4-dark.json (modified 2026-11-18T15:20:37.330Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-step-2-has-zero-axe-violations-with-the-error-summary--dark.json (modified 2026-11-18T15:20:38.214Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-step-3-has-zero-axe-violations-clean-dark-sc-1-4-3-1-4-dark.json (modified 2026-11-18T15:20:38.799Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-step-3-has-zero-axe-violations-with-the-error-summary--dark.json (modified 2026-11-18T15:20:40.757Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-the-open-confirmation-dialog-has-zero-axe-violations-d-dark.json (modified 2026-11-18T15:20:41.869Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-dark-scheme-the-success-view-has-zero-axe-violations-dark-sc-1-4-3-dark.json (modified 2026-11-18T15:20:43.851Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-introduction-has-zero-axe-violations-light-sc-1-4-3-1-4-11-4-1-2.json (modified 2026-11-18T15:20:20.936Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-step-1-has-zero-axe-violations-clean-light-sc-1-4-3-1-4-11-4-1-2.json (modified 2026-11-18T15:20:23.088Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-step-1-has-zero-axe-violations-with-a-spirit-selected-light-sc-1-4.json (modified 2026-11-18T15:20:23.263Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-step-1-has-zero-axe-violations-with-the-error-summary-light-sc-1-4.json (modified 2026-11-18T15:20:23.255Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-step-2-has-zero-axe-violations-clean-light-sc-1-4-3-1-4-11-4-1-2.json (modified 2026-11-18T15:20:25.752Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-step-2-has-zero-axe-violations-with-the-error-summary-light-sc-1-4.json (modified 2026-11-18T15:20:28.911Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-step-3-has-zero-axe-violations-clean-light-sc-1-4-3-1-4-11-4-1-2.json (modified 2026-11-18T15:20:28.443Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-step-3-has-zero-axe-violations-with-the-error-summary-light-sc-1-4.json (modified 2026-11-18T15:20:29.267Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-the-open-confirmation-dialog-has-zero-axe-violations-light-sc-1-4-.json (modified 2026-11-18T15:20:30.744Z)
- Read: apps/seance/evidence/axe/chromium-axe-scans-of-every-step-and-state-the-success-view-has-zero-axe-violations-light-sc-1-4-3-1-4-11-4-1.json (modified 2026-11-18T15:20:33.937Z)
- Read: apps/seance/evidence/axe/chromium-not-found-page-dark-scheme-zero-axe-violations-dark-dark.json (modified 2026-11-18T15:20:55.064Z)
- Read: apps/seance/evidence/axe/chromium-not-found-page-zero-axe-violations-wcag-2-2-aa.json (modified 2026-11-18T15:20:53.619Z)
- Read: docs/trusted-tester-review-seance.md (Trusted Tester review)

### Counts

- **Tests:** 466 passed, 0 failed, 0 skipped, 0 inconclusive. Of the tests that ran, 215 carry an SC tag and 251 do not.
- **axe scans:** 23
- **Trusted Tester findings:** 0 open, 0 fixed, 0 unmapped

### Warnings

- None.
