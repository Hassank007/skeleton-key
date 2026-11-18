# Accessibility Conformance Report: WCAG Edition (VPAT 2.5 style)

## Product information

- **Product name:** Golden App
- **Product version:** 1.2.3
- **Report date:** 2025-01-01
- **Product description:** A fixture app used to check the generated report byte for byte.
- **Applicable standard:** WCAG 2.2 Level A and Level AA
- **Generator:** Skeleton Key ACR generator (scripts/acr.mjs)
- **Generator version:** 1.0.0

The layout follows the style of the Information Technology Industry Council (ITI) VPAT 2.5 WCAG edition. This is not an official VPAT and does not use the ITI template or logo.

## Disclaimer

This report is generated from automated test results and a static code review. It is not a legal certification, an audit by an accredited body, or a statement of compliance with any law. Automated tools find only a part of the accessibility problems that exist; criteria marked Not Evaluated need testing by a person, including with assistive technology.

## Evaluation methods

- **Playwright page tests with axe-core:** read; 4 passed, 1 failed, 1 skipped, 1 inconclusive; axe-core 4.10.3, 2 scans, pages: /, /about; colour schemes: dark, light.
- **Vitest unit and property tests:** read; 4 passed, 1 failed, 1 skipped, 0 inconclusive.
- **Trusted Tester static review:** read from docs/trusted-tester-review-app.md.

## Terms

- **Supports:** The evidence listed in the remarks shows the criterion is met, and none of it shows otherwise.
- **Partially Supports:** Some checks pass while others fail, or a known problem is still open.
- **Does Not Support:** A check fails or a serious problem is open, and no qualifying check passes.
- **Not Applicable:** The app owner states the criterion does not apply and gives a reason. The generator did not test it.
- **Not Evaluated:** There is not enough evidence either way, or a person must judge it.

## Summary

| Conformance Level | Criteria |
| --- | --- |
| Supports | 7 |
| Partially Supports | 1 |
| Does Not Support | 3 |
| Not Applicable | 1 |
| Not Evaluated | 43 |

## Table 1: Success Criteria, Level A

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.1.1 Non-text Content | Not Evaluated | No test tagged for this criterion was found. axe rule image-alt passed on 1 of 1 scans (not enough on its own for this criterion). |
| 1.2.1 Audio-only and Video-only (Prerecorded) | Not Applicable | The app has no audio or video (owner-stated, not tested). |
| 1.2.2 Captions (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has accurate captions. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has an audio description or a text alternative. |
| 1.3.1 Info and Relationships | Supports | Passing: tests/unit/Button.test.tsx "Hostile \| title 'tick' &lt;script&gt;alert(1)&lt;/script&gt; [link] (http://x.test) [SC 1.3.1]". |
| 1.3.2 Meaningful Sequence | Not Evaluated | No evidence found for this criterion. |
| 1.3.3 Sensory Characteristics | Not Evaluated | Needs human judgement: A person must check that instructions do not rely only on shape, colour, size, position or sound. |
| 1.4.1 Use of Color | Not Evaluated | No evidence found for this criterion. |
| 1.4.2 Audio Control | Not Evaluated | No evidence found for this criterion. |
| 2.1.1 Keyboard | Supports | Passing: tests/e2e/home.spec.ts "Dialog &gt; Escape closes [SC 2.1.1, 2.1.2]". |
| 2.1.2 No Keyboard Trap | Supports | Passing: tests/e2e/home.spec.ts "Dialog &gt; Escape closes [SC 2.1.1, 2.1.2]". |
| 2.1.4 Character Key Shortcuts | Not Evaluated | No evidence found for this criterion. |
| 2.2.1 Timing Adjustable | Not Evaluated | No evidence found for this criterion. |
| 2.2.2 Pause, Stop, Hide | Not Evaluated | No evidence found for this criterion. |
| 2.3.1 Three Flashes or Below Threshold | Not Evaluated | No evidence found for this criterion. |
| 2.4.1 Bypass Blocks | Supports | Passing: tests/e2e/home.spec.ts "first Tab focuses the skip link [SC 2.4.1]". |
| 2.4.2 Page Titled | Supports | Passing: tests/unit/Button.test.tsx "Skeleton page has a title [SC 2.4.2]"; axe rule document-title passed on 2 of 2 scans. |
| 2.4.3 Focus Order | Supports | Passing: tests/e2e/home.spec.ts "Dialog &gt; bad tag [SC 9.9.9, 2.4.3]". |
| 2.4.4 Link Purpose (In Context) | Not Evaluated | No evidence found for this criterion. |
| 2.5.1 Pointer Gestures | Not Evaluated | No evidence found for this criterion. |
| 2.5.2 Pointer Cancellation | Not Evaluated | No evidence found for this criterion. |
| 2.5.3 Label in Name | Not Evaluated | No evidence found for this criterion. |
| 2.5.4 Motion Actuation | Not Evaluated | Needs human judgement: A person must check that no function depends only on device motion, or that motion can be turned off. |
| 3.1.1 Language of Page | Not Evaluated | No evidence found for this criterion. |
| 3.2.1 On Focus | Not Evaluated | No evidence found for this criterion. |
| 3.2.2 On Input | Not Evaluated | No evidence found for this criterion. |
| 3.2.6 Consistent Help | Not Evaluated | Needs human judgement: A person must check that help options appear in the same place on each page. |
| 3.3.1 Error Identification | Does Not Support | Failing: tests/unit/Button.test.tsx "Field shows an error [SC 3.3.1]". At least one check fails and no qualifying check passes. |
| 3.3.2 Labels or Instructions | Not Evaluated | No evidence found for this criterion. Fixed finding, history only (Minor, static review, docs/trusted-tester-review-app.md, status "FIXED"): "3.3.2 / 4.1.2 Field does not forward required". |
| 3.3.7 Redundant Entry | Not Evaluated | No evidence found for this criterion. |
| 4.1.2 Name, Role, Value | Supports | Passing: tests/unit/Button.test.tsx "Button has an accessible name [SC 4.1.2]". Fixed finding, history only (Minor, static review, docs/trusted-tester-review-app.md, status "FIXED"): "3.3.2 / 4.1.2 Field does not forward required". |

## Table 2: Success Criteria, Level AA

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.2.4 Captions (Live) | Not Evaluated | Needs human judgement: A person must check that live audio has real-time captions. |
| 1.2.5 Audio Description (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has an audio description. |
| 1.3.4 Orientation | Not Evaluated | No evidence found for this criterion. |
| 1.3.5 Identify Input Purpose | Not Evaluated | No evidence found for this criterion. |
| 1.4.3 Contrast (Minimum) | Partially Supports | Passing: axe rule color-contrast passed on 1 of 1 scans. Failing: axe rule color-contrast failed on / (2 nodes). Open finding (Moderate, static review, docs/trusted-tester-review-app.md, status "PARTLY ADDRESSED"): "1.4.3 Contrast evidence gap". Some checks pass while others fail or are still open, so the criterion is only partly supported. |
| 1.4.4 Resize Text | Not Evaluated | No evidence found for this criterion. |
| 1.4.5 Images of Text | Not Evaluated | Needs human judgement: A person must check that text is real text and not an image of text. |
| 1.4.10 Reflow | Does Not Support | Failing: tests/e2e/home.spec.ts "reflow at 320px [SC 1.4.10]". At least one check fails and no qualifying check passes. axe rule reflow-rule passed on 1 of 1 scans (not enough on its own for this criterion). Owner override Not Applicable ("Pretend nothing can reflow.") was ignored because evidence fails or a finding is open. |
| 1.4.11 Non-text Contrast | Not Evaluated | No evidence found for this criterion. |
| 1.4.12 Text Spacing | Not Evaluated | No evidence found for this criterion. |
| 1.4.13 Content on Hover or Focus | Not Evaluated | No evidence found for this criterion. |
| 2.4.5 Multiple Ways | Not Evaluated | Single-page app; a person must confirm. |
| 2.4.6 Headings and Labels | Not Evaluated | No evidence found for this criterion. |
| 2.4.7 Focus Visible | Not Evaluated | Inconclusive: tests/e2e/home.spec.ts "flaky focus ring [SC 2.4.7]" (flaky). A flaky test or an incomplete axe check blocks a rating until it is stable or a person checks it. |
| 2.4.11 Focus Not Obscured (Minimum) | Not Evaluated | No test tagged for this criterion was found. axe rule reflow-rule passed on 1 of 1 scans (not enough on its own for this criterion). |
| 2.5.7 Dragging Movements | Not Evaluated | No evidence found for this criterion. |
| 2.5.8 Target Size (Minimum) | Not Evaluated | Inconclusive: axe rule target-size was incomplete on / (1 node). A flaky test or an incomplete axe check blocks a rating until it is stable or a person checks it. |
| 3.1.2 Language of Parts | Not Evaluated | Needs human judgement: A person must check that passages in another language are marked with a lang attribute. |
| 3.2.3 Consistent Navigation | Not Evaluated | Needs human judgement: A person must compare navigation across pages to check it keeps the same relative order. |
| 3.2.4 Consistent Identification | Not Evaluated | Needs human judgement: A person must compare components across pages to check they are identified the same way. |
| 3.3.3 Error Suggestion | Not Evaluated | No evidence found for this criterion. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | Not Evaluated | Needs human judgement: A person must decide whether the pages handle legal or financial data and, if so, check reversal, checking or confirmation. |
| 3.3.8 Accessible Authentication (Minimum) | Not Evaluated | No evidence found for this criterion. |
| 4.1.3 Status Messages | Does Not Support | Open finding (Serious, static review, docs/trusted-tester-review-app.md, status "OPEN"): "Announcements may not be spoken \| check with a screen reader". A Critical or Serious finding from the static review is still open and no qualifying check passes. |

## Evidence summary

### Files

- Read: app/evidence/vitest.json (modified 2023-11-16T02:00:00.000Z)
- Read: app/evidence/playwright.json (modified 2023-11-16T02:00:00.000Z)
- Read: app/evidence/axe/about.json (modified 2023-11-16T02:00:00.000Z)
- Read: app/evidence/axe/home.json (modified 2023-11-16T02:00:00.000Z)
- Read: docs/trusted-tester-review-app.md (Trusted Tester review)

### Counts

- **Tests:** 8 passed, 2 failed, 2 skipped, 1 inconclusive. Of the tests that ran, 9 carry an SC tag and 2 do not.
- **axe scans:** 2
- **Trusted Tester findings:** 2 open, 1 fixed, 1 unmapped

### Warnings

- Unknown criterion "9.9.9" in the SC tag of test "Dialog &gt; bad tag [SC 9.9.9, 2.4.3]" (tests/e2e/home.spec.ts); it maps to nothing.
- Ignored the Not Applicable override for 1.4.10: it has failing evidence or an open finding.
