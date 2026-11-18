# Accessibility Conformance Report: WCAG Edition (VPAT 2.5 style)

## Product information

- **Product name:** skeleton
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

- **Playwright page tests with axe-core:** read; 14 passed, 0 failed, 0 skipped, 0 inconclusive; axe-core 4.14.1, 4 scans, pages: /, /about, /no/such/page; colour schemes: dark, light.
- **Vitest unit and property tests:** read; 180 passed, 0 failed, 0 skipped, 0 inconclusive.
- **Trusted Tester static review:** read from docs/trusted-tester-review-skeleton.md.

## Terms

- **Supports:** The evidence listed in the remarks shows the criterion is met, and none of it shows otherwise.
- **Partially Supports:** Some checks pass while others fail, or a known problem is still open.
- **Does Not Support:** A check fails or a serious problem is open, and no qualifying check passes.
- **Not Applicable:** The app owner states the criterion does not apply and gives a reason. The generator did not test it.
- **Not Evaluated:** There is not enough evidence either way, or a person must judge it.

## Summary

| Conformance Level | Criteria |
| --- | --- |
| Supports | 10 |
| Partially Supports | 12 |
| Does Not Support | 0 |
| Not Applicable | 0 |
| Not Evaluated | 33 |

## Table 1: Success Criteria, Level A

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.1.1 Non-text Content | Partially Supports | Passing: tests/unit/HomePage.test.tsx "HomePage decorative ghost SVG has aria-hidden="true" and is not in the accessibility tree [SC 1.1.1]"; tests/unit/HomePage.test.tsx "HomePage decorative SVG carries no meaningful alt text or title [SC 1.1.1]". Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "1.1.1 Decorative SVG has both aria-hidden and role="img" (HomePage.tsx:15)". Some checks pass while others fail or are still open, so the criterion is only partly supported. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that audio-only and video-only content has a text or audio alternative. |
| 1.2.2 Captions (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has accurate captions. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has an audio description or a text alternative. |
| 1.3.1 Info and Relationships | Partially Supports | Passing: tests/unit/Field.test.tsx "Field renders a label associated with the input [SC 1.3.1, 3.3.2]"; tests/unit/Field.test.tsx "Field with error: input aria-describedby references the error id [SC 1.3.1, 3.3.1]"; tests/unit/Field.test.tsx "Field with hint: input aria-describedby references the hint id [SC 1.3.1, 3.3.2]"; and 5 more. Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "1.3.1 Site name "Skeleton Key" is aria-hidden (PageShell.tsx:40-42); only the emoji should be hidden". Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "1.3.1 Nav links expose no aria-current="page" (AppLink.tsx, PageShell.tsx)". Some checks pass while others fail or are still open, so the criterion is only partly supported. Fixed finding, history only (Moderate, static review, docs/trusted-tester-review-skeleton.md, status "FIXED"): "Only "/" and "/about" are routed. Other URLs render an empty &lt;main&gt;, no h1, and a stale document.title". |
| 1.3.2 Meaningful Sequence | Not Evaluated | No evidence found for this criterion. |
| 1.3.3 Sensory Characteristics | Partially Supports | Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "1.3.3 "Use the navigation above" relies on position (HomePage.tsx:44)". A Moderate or Minor finding from the static review is still open. Also needs human judgement: A person must check that instructions do not rely only on shape, colour, size, position or sound. |
| 1.4.1 Use of Color | Supports | Passing: tests/unit/Field.test.tsx "Field error message contains "Error:" prefix (not colour-only) [SC 1.4.1, 3.3.1]". |
| 1.4.2 Audio Control | Not Evaluated | No evidence found for this criterion. |
| 2.1.1 Keyboard | Supports | Passing: tests/e2e/dialog.spec.ts "Dialog (About page demo) &gt; Escape closes the dialog and returns focus to the trigger [SC 2.1.1, 2.1.2]"; tests/unit/Dialog.test.tsx "Dialog closes on Escape and returns focus to the trigger [SC 2.1.1, 2.1.2]"; tests/unit/properties/Tabs.property.test.tsx "Tabs property keeps selection, tabindex, focus and panel visibility in step for any key sequence [SC 2.1.1, 4.1.2]"; and 8 more. |
| 2.1.2 No Keyboard Trap | Supports | Passing: tests/e2e/dialog.spec.ts "Dialog (About page demo) &gt; Escape closes the dialog and returns focus to the trigger [SC 2.1.1, 2.1.2]"; tests/unit/Dialog.test.tsx "Dialog closes on Escape and returns focus to the trigger [SC 2.1.1, 2.1.2]". |
| 2.1.4 Character Key Shortcuts | Not Evaluated | No evidence found for this criterion. |
| 2.2.1 Timing Adjustable | Partially Supports | Open finding (Moderate, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "startTimer() never clears an existing timer and ignores hover/focus state. After mouseenter, focus and mouseleave, the timer restarts while focus is on Dismiss, so the toast can vanish under a keyboar...". A Moderate or Minor finding from the static review is still open. |
| 2.2.2 Pause, Stop, Hide | Supports | Passing: tests/e2e/home.spec.ts "Home page &gt; the in-app "Reduce motion" toggle stops the ghost animation [SC 2.2.2]". |
| 2.3.1 Three Flashes or Below Threshold | Not Evaluated | No evidence found for this criterion. |
| 2.4.1 Bypass Blocks | Supports | Passing: tests/e2e/home.spec.ts "Home page &gt; Enter on skip link moves focus to main content [SC 2.4.1]"; tests/e2e/home.spec.ts "Home page &gt; first Tab press focuses the skip link [SC 2.4.1]"; tests/unit/PageShell.test.tsx "PageShell activating the skip link moves focus to &lt;main&gt; [SC 2.4.1]"; and 2 more. |
| 2.4.2 Page Titled | Supports | Passing: tests/e2e/about.spec.ts "About page &gt; navigating Home → About moves focus to About h1 and updates title [SC 2.4.2, 2.4.3]"; tests/unit/NotFoundPage.test.tsx "NotFoundPage has an h1, a title and zero axe violations [SC 2.4.2]"; axe rule document-title passed on 4 of 4 scans. Fixed finding, history only (Moderate, static review, docs/trusted-tester-review-skeleton.md, status "FIXED"): "Only "/" and "/about" are routed. Other URLs render an empty &lt;main&gt;, no h1, and a stale document.title". |
| 2.4.3 Focus Order | Partially Supports | Passing: tests/e2e/about.spec.ts "About page &gt; navigating Home → About moves focus to About h1 and updates title [SC 2.4.2, 2.4.3]"; tests/e2e/dialog.spec.ts "Dialog (About page demo) &gt; opens the dialog and focus moves inside [SC 2.4.3]"; tests/e2e/dialog.spec.ts "Dialog (About page demo) &gt; Tab cycles focus inside the dialog and does not escape [SC 2.4.3]"; and 7 more. Open finding (Moderate, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "startTimer() never clears an existing timer and ignores hover/focus state. After mouseenter, focus and mouseleave, the timer restarts while focus is on Dismiss, so the toast can vanish under a keyboar...". Some checks pass while others fail or are still open, so the criterion is only partly supported. |
| 2.4.4 Link Purpose (In Context) | Not Evaluated | No test tagged for this criterion was found. axe rule link-name passed on 4 of 4 scans (not enough on its own for this criterion). |
| 2.5.1 Pointer Gestures | Not Evaluated | No evidence found for this criterion. |
| 2.5.2 Pointer Cancellation | Not Evaluated | No evidence found for this criterion. |
| 2.5.3 Label in Name | Not Evaluated | No evidence found for this criterion. |
| 2.5.4 Motion Actuation | Not Evaluated | Needs human judgement: A person must check that no function depends only on device motion, or that motion can be turned off. |
| 3.1.1 Language of Page | Supports | Passing: axe rule html-has-lang passed on 4 of 4 scans; axe rule html-lang-valid passed on 4 of 4 scans. |
| 3.2.1 On Focus | Not Evaluated | No evidence found for this criterion. |
| 3.2.2 On Input | Partially Supports | Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "3.2.2 Button has no default type="button" (Button.tsx:34-35)". A Moderate or Minor finding from the static review is still open. |
| 3.2.6 Consistent Help | Not Evaluated | Needs human judgement: A person must check that help options appear in the same place on each page. |
| 3.3.1 Error Identification | Supports | Passing: tests/unit/Field.test.tsx "Field error message contains "Error:" prefix (not colour-only) [SC 1.4.1, 3.3.1]"; tests/unit/Field.test.tsx "Field with error: aria-invalid is true on the input [SC 3.3.1, 4.1.2]"; tests/unit/Field.test.tsx "Field with error: input aria-describedby references the error id [SC 1.3.1, 3.3.1]"; and 1 more. |
| 3.3.2 Labels or Instructions | Partially Supports | Passing: tests/unit/Field.test.tsx "Field renders a label associated with the input [SC 1.3.1, 3.3.2]"; tests/unit/Field.test.tsx "Field required field includes "(required)" text in label [SC 3.3.2]"; tests/unit/Field.test.tsx "Field with hint: input aria-describedby references the hint id [SC 1.3.1, 3.3.2]"; and 1 more. Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "3.3.2 / 4.1.2 Field does not forward required, and cloneElement overwrites the child's aria-describedby (Field.tsx:60-73)". Some checks pass while others fail or are still open, so the criterion is only partly supported. |
| 3.3.7 Redundant Entry | Not Evaluated | No evidence found for this criterion. |
| 4.1.2 Name, Role, Value | Partially Supports | Passing: tests/unit/Dialog.test.tsx "Dialog has role="dialog", aria-modal, and aria-labelledby pointing to the title [SC 4.1.2]"; tests/unit/Field.test.tsx "Field with error: aria-invalid is true on the input [SC 3.3.1, 4.1.2]"; tests/unit/PageShell.test.tsx "PageShell the motion toggle is a pressed-state button that sets data-reduced-motion on &lt;html&gt; [SC 4.1.2]"; and 7 more. Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "4.1.2 MotionToggle shows aria-pressed="true" under OS reduced motion but does nothing when activated". Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "3.3.2 / 4.1.2 Field does not forward required, and cloneElement overwrites the child's aria-describedby (Field.tsx:60-73)". Some checks pass while others fail or are still open, so the criterion is only partly supported. |

## Table 2: Success Criteria, Level AA

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.2.4 Captions (Live) | Not Evaluated | Needs human judgement: A person must check that live audio has real-time captions. |
| 1.2.5 Audio Description (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has an audio description. |
| 1.3.4 Orientation | Not Evaluated | No evidence found for this criterion. |
| 1.3.5 Identify Input Purpose | Not Evaluated | No evidence found for this criterion. |
| 1.4.3 Contrast (Minimum) | Partially Supports | Passing: tests/unit/no-hex-in-components.test.ts "components use colour tokens only src/components/AppLink.module.css has no hex, rgb, hsl or named colour [SC 1.4.3]"; tests/unit/no-hex-in-components.test.ts "components use colour tokens only src/components/Button.module.css has no hex, rgb, hsl or named colour [SC 1.4.3]"; tests/unit/no-hex-in-components.test.ts "components use colour tokens only src/components/Dialog.module.css has no hex, rgb, hsl or named colour [SC 1.4.3]"; and 61 more. Open finding (Moderate, static review, docs/trusted-tester-review-skeleton.md, status "PARTLY ADDRESSED (token-level test added; browser dark-mode axe still open)"): "Playwright axe runs only in light scheme and never with the dialog open". Some checks pass while others fail or are still open, so the criterion is only partly supported. Fixed finding, history only (Serious, static review, docs/trusted-tester-review-skeleton.md, status "FIXED"): "In the dark theme, a hovered primary button shows white text on #a855f7, about 3.96:1, below 4.5:1". |
| 1.4.4 Resize Text | Not Evaluated | No test tagged for this criterion was found. axe rule meta-viewport passed on 4 of 4 scans (not enough on its own for this criterion). |
| 1.4.5 Images of Text | Not Evaluated | Needs human judgement: A person must check that text is real text and not an image of text. |
| 1.4.10 Reflow | Not Evaluated | No evidence found for this criterion. |
| 1.4.11 Non-text Contrast | Supports | Passing: tests/unit/properties/contrast.property.test.ts "contrast property: every theme pair dark-attr: --color-accent on --color-surface [SC 1.4.11]"; tests/unit/properties/contrast.property.test.ts "contrast property: every theme pair dark-attr: --color-accent on --color-surface-raised [SC 1.4.11]"; tests/unit/properties/contrast.property.test.ts "contrast property: every theme pair dark-attr: --color-border on --color-surface [SC 1.4.11]"; and 15 more. |
| 1.4.12 Text Spacing | Not Evaluated | No test tagged for this criterion was found. axe rule avoid-inline-spacing passed on 4 of 4 scans (not enough on its own for this criterion). |
| 1.4.13 Content on Hover or Focus | Not Evaluated | No evidence found for this criterion. |
| 2.4.5 Multiple Ways | Not Evaluated | No evidence found for this criterion. |
| 2.4.6 Headings and Labels | Not Evaluated | No evidence found for this criterion. |
| 2.4.7 Focus Visible | Partially Supports | Passing: tests/e2e/home.spec.ts "Home page &gt; keyboard walk: logical Tab order and a visible focus ring on every stop [SC 2.4.3, 2.4.7]". Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "2.4.7 .main has outline: none (PageShell.module.css:44-45); skip-link target shows no focus position". Some checks pass while others fail or are still open, so the criterion is only partly supported. |
| 2.4.11 Focus Not Obscured (Minimum) | Partially Supports | Open finding (Minor, static review, docs/trusted-tester-review-skeleton.md, status "OPEN"): "2.4.11 scroll-margin-top only applies to 'main *:focus-visible' (index.css:37-40)". A Moderate or Minor finding from the static review is still open. |
| 2.5.7 Dragging Movements | Not Evaluated | No evidence found for this criterion. |
| 2.5.8 Target Size (Minimum) | Supports | Passing: axe rule target-size passed on 4 of 4 scans. |
| 3.1.2 Language of Parts | Not Evaluated | Needs human judgement: A person must check that passages in another language are marked with a lang attribute. |
| 3.2.3 Consistent Navigation | Not Evaluated | Needs human judgement: A person must compare navigation across pages to check it keeps the same relative order. |
| 3.2.4 Consistent Identification | Not Evaluated | Needs human judgement: A person must compare components across pages to check they are identified the same way. |
| 3.3.3 Error Suggestion | Not Evaluated | No evidence found for this criterion. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | Not Evaluated | Needs human judgement: A person must decide whether the pages handle legal or financial data and, if so, check reversal, checking or confirmation. |
| 3.3.8 Accessible Authentication (Minimum) | Not Evaluated | No evidence found for this criterion. |
| 4.1.3 Status Messages | Partially Supports | Open finding (Moderate, static review, docs/trusted-tester-review-skeleton.md, status "OPEN (needs screen reader to confirm)"): "Dialog sets inert on #root while open. The announcer live regions are inside #root, so announce() calls made while a dialog is open may not be spoken". A Moderate or Minor finding from the static review is still open. |

## Evidence summary

### Files

- Read: skeleton/evidence/vitest.json (modified 2026-11-18T15:27:55.606Z)
- Read: skeleton/evidence/playwright.json (modified 2026-11-18T15:35:01.842Z)
- Read: skeleton/evidence/axe/chromium-about-page-zero-axe-violations-wcag-2-2-aa.json (modified 2026-11-18T15:34:56.761Z)
- Read: skeleton/evidence/axe/chromium-home-page-zero-axe-violations-wcag-2-2-aa.json (modified 2026-11-18T15:34:58.181Z)
- Read: skeleton/evidence/axe/chromium-not-found-page-dark-scheme-zero-axe-violations-dark-dark.json (modified 2026-11-18T15:35:01.162Z)
- Read: skeleton/evidence/axe/chromium-not-found-page-zero-axe-violations-wcag-2-2-aa.json (modified 2026-11-18T15:35:00.938Z)
- Read: docs/trusted-tester-review-skeleton.md (Trusted Tester review)

### Counts

- **Tests:** 194 passed, 0 failed, 0 skipped, 0 inconclusive. Of the tests that ran, 129 carry an SC tag and 65 do not.
- **axe scans:** 4
- **Trusted Tester findings:** 12 open, 2 fixed, 1 unmapped

### Warnings

- None.
