# Trusted Tester review: Grimoire (`apps/grimoire/src/`)

Static review by the `trusted-tester` agent, against WCAG 2.2 AA. It is not a conformance statement. No Critical, Serious or Moderate findings. Three Minor findings and several notes.

## Findings and what was done

| # | Criterion | Location | Finding | Outcome |
| --- | --- | --- | --- | --- |
| 1 | 2.4.7 Focus Visible | `PageShell.module.css` `.main { outline: none }` | After the skip link moves focus to `main`, no ring was shown. | **Fixed in `skeleton/` first**, then in Grimoire: the `outline: none` rule is removed (the global `:focus:not(:focus-visible)` rule still hides the ring for mouse focus). Tests: skeleton `home.spec.ts` and Grimoire `catalogue.spec.ts` check the outline after Tab, Enter on the skip link. |
| 2 | 1.3.1 Info and Relationships | `PageShell.tsx` site name has `aria-hidden="true"` | The visible text "Grimoire" is hidden from assistive technology. | **Not changed.** The skeleton and `design.md` section 5.6 keep the site name `aria-hidden`: the `h1` of every page and every page title already name the site, and a repeated brand string in the banner is noise for screen-reader users. Hiding repeated text is not a failure of an A or AA criterion. Revisit with the skeleton if users ask for it. |
| 3 | 2.4.11 Focus Not Obscured (best practice) | `BookCard.module.css` `scroll-margin-top` on `.card` | The margin was on the card, but the focused element is the link, so it had no effect. | **Fixed** in Grimoire: the rule is on `.card .link` and adds room for the card ring. Not browser-tested beyond the existing e2e check that the card top is below the header. |

## Notes (no failed criterion)

- Motion toggle under OS reduced motion does nothing but stays enabled. Accurate, not changed.
- No `aria-current="page"` on the nav (2.4.8 is AAA). Not changed.
- Sticky header at 320 px wide takes space. Not changed. Needs a manual look.
- Live regions sit inside `#root`, which `Dialog` makes `inert`. No status message is sent while a dialog is open today.
- The card meta line "Author · School · Hazard" has no labels. Acceptable.
- `Tabs` and `Toast` are not used by any Grimoire page.

## Manual steps the reviewer lists as still needed

Skip link ring, card ring under the header, 400% zoom look, text-spacing bookmarklet, screen reader pass (NVDA or VoiceOver), dialog pass. Automated Playwright checks cover the keyboard, reflow and text-spacing parts; a screen reader has not been run.
