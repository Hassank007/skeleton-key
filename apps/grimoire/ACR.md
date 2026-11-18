# Accessibility Conformance Report: WCAG Edition (VPAT 2.5 style)

## Product information

- **Product name:** grimoire
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

- **Playwright page tests with axe-core:** read; 50 passed, 0 failed, 0 skipped, 0 inconclusive; axe-core 4.14.1, 13 scans, pages: /, /about, /books/no-such-book, /books/the-lantern-of-small-hours, /no/such/page; colour schemes: dark, light.
- **Vitest unit and property tests:** read; 319 passed, 0 failed, 0 skipped, 0 inconclusive.
- **Trusted Tester static review:** read from docs/trusted-tester-review-grimoire.md.

## Terms

- **Supports:** The evidence listed in the remarks shows the criterion is met, and none of it shows otherwise.
- **Partially Supports:** Some checks pass while others fail, or a known problem is still open.
- **Does Not Support:** A check fails or a serious problem is open, and no qualifying check passes.
- **Not Applicable:** The app owner states the criterion does not apply and gives a reason. The generator did not test it.
- **Not Evaluated:** There is not enough evidence either way, or a person must judge it.

## Summary

| Conformance Level | Criteria |
| --- | --- |
| Supports | 26 |
| Partially Supports | 0 |
| Does Not Support | 0 |
| Not Applicable | 0 |
| Not Evaluated | 29 |

## Table 1: Success Criteria, Level A

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.1.1 Non-text Content | Supports | Passing: tests/e2e/motion.spec.ts "Motion &gt; the candle is decorative and stops with OS reduced motion [SC 1.1.1]"; tests/unit/BookCard.test.tsx "BookCard hides the decorative cover from assistive technology [SC 1.1.1]"; tests/unit/BookCover.test.tsx "BookCover Alchemy cover is decorative: aria-hidden, no title, no text [SC 1.1.1]"; and 8 more. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that audio-only and video-only content has a text or audio alternative. |
| 1.2.2 Captions (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has accurate captions. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has an audio description or a text alternative. |
| 1.3.1 Info and Relationships | Supports | Passing: tests/e2e/book-detail.spec.ts "Book detail page &gt; has the title as h1, a unique page title and the facts as text [SC 1.3.1, 2.4.2]"; tests/unit/AboutPage.test.tsx "AboutPage has zero axe violations [SC 1.3.1]"; tests/unit/BookCard.test.tsx "BookCard has zero axe violations [SC 1.3.1]"; and 18 more. |
| 1.3.2 Meaningful Sequence | Not Evaluated | No evidence found for this criterion. |
| 1.3.3 Sensory Characteristics | Not Evaluated | Needs human judgement: A person must check that instructions do not rely only on shape, colour, size, position or sound. |
| 1.4.1 Use of Color | Supports | Passing: tests/unit/BookCard.test.tsx "BookCard shows school and hazard as text [SC 1.4.1]"; tests/unit/BookDetailPage.test.tsx "BookDetailPage: found shows the hazard as text and the tags as a list of text [SC 1.4.1]"; tests/unit/Field.test.tsx "Field error message contains "Error:" prefix (not colour-only) [SC 1.4.1, 3.3.1]". |
| 1.4.2 Audio Control | Not Evaluated | No evidence found for this criterion. |
| 2.1.1 Keyboard | Supports | Passing: tests/e2e/catalogue.spec.ts "Catalogue page &gt; Enter on a focused card link opens the detail page [SC 2.1.1]"; tests/e2e/catalogue.spec.ts "Catalogue page &gt; Space toggles a filter checkbox and narrows the list [SC 2.1.1, 4.1.2]"; tests/e2e/dialog.spec.ts "Dialog (About page demo) &gt; Escape closes the dialog and returns focus to the trigger [SC 2.1.1, 2.1.2]"; and 11 more. |
| 2.1.2 No Keyboard Trap | Supports | Passing: tests/e2e/about.spec.ts "About page &gt; no keyboard trap: Tab leaves the page and Shift+Tab comes back [SC 2.1.2]"; tests/e2e/book-detail.spec.ts "Book detail page &gt; no keyboard trap: Tab leaves the page and Shift+Tab comes back [SC 2.1.2]"; tests/e2e/catalogue.spec.ts "Catalogue page &gt; no keyboard trap: Tab leaves the page and Shift+Tab comes back [SC 2.1.2]"; and 3 more. |
| 2.1.4 Character Key Shortcuts | Not Evaluated | No evidence found for this criterion. |
| 2.2.1 Timing Adjustable | Not Evaluated | No evidence found for this criterion. |
| 2.2.2 Pause, Stop, Hide | Supports | Passing: tests/e2e/motion.spec.ts "Motion &gt; the "Reduce motion" toggle stops the candle [SC 2.2.2]". |
| 2.3.1 Three Flashes or Below Threshold | Not Evaluated | No evidence found for this criterion. |
| 2.4.1 Bypass Blocks | Supports | Passing: tests/e2e/catalogue.spec.ts "Catalogue page &gt; keyboard: the skip link moves focus to main and the ring shows [SC 2.4.1, 2.4.7]"; tests/e2e/catalogue.spec.ts "Catalogue page &gt; the first Tab press focuses the skip link [SC 2.4.1]"; tests/unit/PageShell.test.tsx "PageShell activating the skip link moves focus to &lt;main&gt; [SC 2.4.1]"; and 2 more. |
| 2.4.2 Page Titled | Supports | Passing: tests/e2e/about.spec.ts "About page &gt; navigating Catalogue → About moves focus to the About h1 and updates the title [SC 2.4.2, 2.4.3]"; tests/e2e/book-detail.spec.ts "Book detail page &gt; has the title as h1, a unique page title and the facts as text [SC 1.3.1, 2.4.2]"; tests/e2e/book-detail.spec.ts "Book detail page &gt; the unknown slug page has its own title and a way back [SC 2.4.2, 3.3.3]"; and 7 more. |
| 2.4.3 Focus Order | Supports | Passing: tests/e2e/about.spec.ts "About page &gt; navigating Catalogue → About moves focus to the About h1 and updates the title [SC 2.4.2, 2.4.3]"; tests/e2e/about.spec.ts "About page &gt; Tab order: skip link, Catalogue, About, Reduce motion, then the dialog button [SC 2.4.3, 2.4.7]"; tests/e2e/book-detail.spec.ts "Book detail page &gt; keyboard: focus lands on the h1, Tab reaches "Back to catalogue", Enter returns with the search kept [SC 2.4.3, 3.3.7]"; and 13 more. |
| 2.4.4 Link Purpose (In Context) | Supports | Passing: tests/e2e/catalogue.spec.ts "Catalogue page &gt; each card has exactly one link and one tab stop [SC 2.4.4, 4.1.2]"; tests/unit/BookCard.test.tsx "BookCard names the link with the book title and points to /books/&lt;slug&gt; [SC 2.4.4]". |
| 2.5.1 Pointer Gestures | Not Evaluated | No evidence found for this criterion. |
| 2.5.2 Pointer Cancellation | Not Evaluated | No evidence found for this criterion. |
| 2.5.3 Label in Name | Not Evaluated | No evidence found for this criterion. |
| 2.5.4 Motion Actuation | Not Evaluated | Needs human judgement: A person must check that no function depends only on device motion, or that motion can be turned off. |
| 3.1.1 Language of Page | Supports | Passing: axe rule html-has-lang passed on 13 of 13 scans; axe rule html-lang-valid passed on 13 of 13 scans. |
| 3.2.1 On Focus | Not Evaluated | No evidence found for this criterion. |
| 3.2.2 On Input | Not Evaluated | No evidence found for this criterion. |
| 3.2.6 Consistent Help | Not Evaluated | Needs human judgement: A person must check that help options appear in the same place on each page. |
| 3.3.1 Error Identification | Supports | Passing: tests/unit/Field.test.tsx "Field error message contains "Error:" prefix (not colour-only) [SC 1.4.1, 3.3.1]"; tests/unit/Field.test.tsx "Field with error: aria-invalid is true on the input [SC 3.3.1, 4.1.2]"; tests/unit/Field.test.tsx "Field with error: input aria-describedby references the error id [SC 1.3.1, 3.3.1]"; and 1 more. |
| 3.3.2 Labels or Instructions | Supports | Passing: tests/unit/Field.test.tsx "Field renders a label associated with the input [SC 1.3.1, 3.3.2]"; tests/unit/Field.test.tsx "Field required field includes "(required)" text in label [SC 3.3.2]"; tests/unit/Field.test.tsx "Field with hint: input aria-describedby references the hint id [SC 1.3.1, 3.3.2]"; and 2 more. |
| 3.3.7 Redundant Entry | Supports | Passing: tests/e2e/book-detail.spec.ts "Book detail page &gt; keyboard: focus lands on the h1, Tab reaches "Back to catalogue", Enter returns with the search kept [SC 2.4.3, 3.3.7]"; tests/e2e/book-detail.spec.ts "Book detail page &gt; the browser Back button also returns to the catalogue with the search kept [SC 3.3.7]"; tests/unit/BookDetailPage.test.tsx "BookDetailPage: found goes back to the catalogue with the earlier search [SC 3.3.7]"; and 1 more. |
| 4.1.2 Name, Role, Value | Supports | Passing: tests/e2e/catalogue.spec.ts "Catalogue page &gt; each card has exactly one link and one tab stop [SC 2.4.4, 4.1.2]"; tests/e2e/catalogue.spec.ts "Catalogue page &gt; Space toggles a filter checkbox and narrows the list [SC 2.1.1, 4.1.2]"; tests/unit/BookCard.test.tsx "BookCard contains no other interactive element [SC 4.1.2]"; and 12 more. |

## Table 2: Success Criteria, Level AA

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.2.4 Captions (Live) | Not Evaluated | Needs human judgement: A person must check that live audio has real-time captions. |
| 1.2.5 Audio Description (Prerecorded) | Not Evaluated | Needs human judgement: A person must check that prerecorded video has an audio description. |
| 1.3.4 Orientation | Not Evaluated | No evidence found for this criterion. |
| 1.3.5 Identify Input Purpose | Supports | Passing: axe rule autocomplete-valid passed on 5 of 5 scans. |
| 1.4.3 Contrast (Minimum) | Supports | Passing: tests/unit/no-hex-in-components.test.ts "components use colour tokens only src/components/AppLink.module.css has no hex, rgb, hsl or named colour [SC 1.4.3]"; tests/unit/no-hex-in-components.test.ts "components use colour tokens only src/components/BookCard.module.css has no hex, rgb, hsl or named colour [SC 1.4.3]"; tests/unit/no-hex-in-components.test.ts "components use colour tokens only src/components/BookCover.module.css has no hex, rgb, hsl or named colour [SC 1.4.3]"; and 70 more. |
| 1.4.4 Resize Text | Not Evaluated | No test tagged for this criterion was found. axe rule meta-viewport passed on 13 of 13 scans (not enough on its own for this criterion). |
| 1.4.5 Images of Text | Not Evaluated | Needs human judgement: A person must check that text is real text and not an image of text. |
| 1.4.10 Reflow | Supports | Passing: tests/e2e/responsive.spec.ts "Responsive and text spacing &gt; a detail page at 320px has no horizontal scroll [SC 1.4.10]"; tests/e2e/responsive.spec.ts "Responsive and text spacing &gt; catalogue at 320px has no horizontal scroll [SC 1.4.10]"; tests/e2e/responsive.spec.ts "Responsive and text spacing &gt; the cards are one column at 320px [SC 1.4.10]". |
| 1.4.11 Non-text Contrast | Supports | Passing: tests/unit/properties/contrast.property.test.ts "contrast property: every theme pair dark-attr: --color-accent on --color-surface [SC 1.4.11]"; tests/unit/properties/contrast.property.test.ts "contrast property: every theme pair dark-attr: --color-accent on --color-surface-raised [SC 1.4.11]"; tests/unit/properties/contrast.property.test.ts "contrast property: every theme pair dark-attr: --color-border on --color-surface [SC 1.4.11]"; and 15 more. |
| 1.4.12 Text Spacing | Supports | Passing: tests/e2e/responsive.spec.ts "Responsive and text spacing &gt; a card title is fully visible under text spacing [SC 1.4.12]"; tests/e2e/responsive.spec.ts "Responsive and text spacing &gt; the WCAG text-spacing overrides clip nothing and overlap nothing [SC 1.4.12]". |
| 1.4.13 Content on Hover or Focus | Not Evaluated | No evidence found for this criterion. |
| 2.4.5 Multiple Ways | Not Evaluated | No evidence found for this criterion. |
| 2.4.6 Headings and Labels | Supports | Passing: tests/unit/BookCard.test.tsx "BookCard has one h3 that contains the one link [SC 2.4.6]"; tests/unit/CataloguePage.test.tsx "CataloguePage has exactly one h1 and an ordered heading outline [SC 1.3.1, 2.4.6]". |
| 2.4.7 Focus Visible | Supports | Passing: tests/e2e/about.spec.ts "About page &gt; Tab order: skip link, Catalogue, About, Reduce motion, then the dialog button [SC 2.4.3, 2.4.7]"; tests/e2e/catalogue.spec.ts "Catalogue page &gt; keyboard walk: logical Tab order and a visible ring of at least 2px on every stop [SC 2.4.3, 2.4.7]"; tests/e2e/catalogue.spec.ts "Catalogue page &gt; keyboard: the skip link moves focus to main and the ring shows [SC 2.4.1, 2.4.7]"; and 2 more. |
| 2.4.11 Focus Not Obscured (Minimum) | Supports | Passing: tests/e2e/catalogue.spec.ts "Catalogue page &gt; the card ring is drawn on the whole card and is not hidden under the sticky header [SC 2.4.7, 2.4.11]". |
| 2.5.7 Dragging Movements | Not Evaluated | No evidence found for this criterion. |
| 2.5.8 Target Size (Minimum) | Supports | Passing: tests/e2e/responsive.spec.ts "Responsive and text spacing &gt; targets are at least 24 by 24 CSS px [SC 2.5.8]"; axe rule target-size passed on 13 of 13 scans. |
| 3.1.2 Language of Parts | Not Evaluated | Needs human judgement: A person must check that passages in another language are marked with a lang attribute. |
| 3.2.3 Consistent Navigation | Not Evaluated | Needs human judgement: A person must compare navigation across pages to check it keeps the same relative order. Passing evidence is cited but does not change this Level: tests/unit/PageShell.test.tsx "PageShell says Grimoire and has the links Catalogue and About in order [SC 3.2.3]". |
| 3.2.4 Consistent Identification | Not Evaluated | Needs human judgement: A person must compare components across pages to check they are identified the same way. |
| 3.3.3 Error Suggestion | Supports | Passing: tests/e2e/book-detail.spec.ts "Book detail page &gt; the unknown slug page has its own title and a way back [SC 2.4.2, 3.3.3]"; tests/e2e/catalogue.spec.ts "Catalogue page &gt; the empty state offers a fix, and Enter on "Clear search and filters" returns focus to the search box [SC 2.4.3, 3.3.3]"; tests/unit/BookDetailPage.test.tsx "BookDetailPage: unknown slug has the not-found h1, a sentence, the back link and the right title [SC 2.4.2, 3.3.3]"; and 4 more. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | Not Evaluated | Needs human judgement: A person must decide whether the pages handle legal or financial data and, if so, check reversal, checking or confirmation. |
| 3.3.8 Accessible Authentication (Minimum) | Not Evaluated | No evidence found for this criterion. |
| 4.1.3 Status Messages | Supports | Passing: tests/e2e/catalogue.spec.ts "Catalogue page &gt; the polite region gets the new count after the debounce and the assertive region stays empty [SC 4.1.3]"; tests/unit/CataloguePage.test.tsx "CataloguePage announcements announces the count politely after 500 ms and never assertively [SC 4.1.3]"; tests/unit/CataloguePage.test.tsx "CataloguePage announcements announces the empty result with the fix, once [SC 3.3.3, 4.1.3]"; and 11 more. |

## Evidence summary

### Files

- Read: apps/grimoire/evidence/vitest.json (modified 2026-11-18T13:58:02.861Z)
- Read: apps/grimoire/evidence/playwright.json (modified 2026-11-18T13:58:40.600Z)
- Read: apps/grimoire/evidence/axe/chromium-about-page-dark-scheme-zero-axe-violations-dark-dark.json (modified 2026-11-18T13:58:15.095Z)
- Read: apps/grimoire/evidence/axe/chromium-about-page-zero-axe-violations-wcag-2-2-aa.json (modified 2026-11-18T13:58:14.432Z)
- Read: apps/grimoire/evidence/axe/chromium-book-detail-page-dark-scheme-zero-axe-violations-found-book-dark-dark.json (modified 2026-11-18T13:58:17.517Z)
- Read: apps/grimoire/evidence/axe/chromium-book-detail-page-dark-scheme-zero-axe-violations-unknown-slug-dark-dark-not-found.json (modified 2026-11-18T13:58:17.970Z)
- Read: apps/grimoire/evidence/axe/chromium-book-detail-page-zero-axe-violations-found-book-wcag-2-2-aa.json (modified 2026-11-18T13:58:16.731Z)
- Read: apps/grimoire/evidence/axe/chromium-book-detail-page-zero-axe-violations-unknown-slug-not-found.json (modified 2026-11-18T13:58:17.058Z)
- Read: apps/grimoire/evidence/axe/chromium-catalogue-page-dark-scheme-zero-axe-violations-default-state-dark-dark.json (modified 2026-11-18T13:58:24.628Z)
- Read: apps/grimoire/evidence/axe/chromium-catalogue-page-dark-scheme-zero-axe-violations-empty-state-dark-dark-empty.json (modified 2026-11-18T13:58:26.249Z)
- Read: apps/grimoire/evidence/axe/chromium-catalogue-page-zero-axe-violations-default-state-wcag-2-2-aa.json (modified 2026-11-18T13:58:22.895Z)
- Read: apps/grimoire/evidence/axe/chromium-catalogue-page-zero-axe-violations-empty-state-empty.json (modified 2026-11-18T13:58:23.407Z)
- Read: apps/grimoire/evidence/axe/chromium-catalogue-page-zero-axe-violations-filtered-state-filtered.json (modified 2026-11-18T13:58:23.444Z)
- Read: apps/grimoire/evidence/axe/chromium-not-found-page-dark-scheme-zero-axe-violations-dark-dark.json (modified 2026-11-18T13:58:36.472Z)
- Read: apps/grimoire/evidence/axe/chromium-not-found-page-zero-axe-violations-wcag-2-2-aa.json (modified 2026-11-18T13:58:36.202Z)
- Read: docs/trusted-tester-review-grimoire.md (Trusted Tester review)

### Counts

- **Tests:** 369 passed, 0 failed, 0 skipped, 0 inconclusive. Of the tests that ran, 214 carry an SC tag and 155 do not.
- **axe scans:** 13
- **Trusted Tester findings:** 0 open, 0 fixed, 0 unmapped

### Warnings

- None.
