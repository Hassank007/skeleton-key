---
inclusion: always
---

# Product: Skeleton Key

Skeleton Key is a lean, accessible-by-default web app skeleton. Any app built from it passes WCAG 2.2 AA on day one, so teams start from "accessible" instead of retrofitting it later.

## Who it's for
Developers and small teams who want to ship fast without leaving disabled users behind, and who don't have an accessibility specialist on staff.

## What the skeleton gives you
- Semantic page shell: skip link, landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page.
- Route changes that move focus to the new page heading and announce the page title.
- A live-region announcer for status messages (WCAG 4.1.3).
- Accessible primitives: Button, Link, Field (label + hint + error), Dialog (APG modal pattern), Toast (polite live region), Tabs (APG pattern).
- Design tokens with contrast checked to at least 4.5:1 for text and 3:1 for UI, in light and dark themes.
- `prefers-reduced-motion` respected everywhere, plus a user toggle.
- Accessibility checks built in: axe-core in development, automated axe tests in the test suite.

## The two apps built on it (Skeleton Crew category)
1. **Grimoire** (`apps/grimoire`): a content-browsing app. A spooky catalogue of spells/books with search, filters, a results list, and a detail view. Shows read-heavy patterns.
2. **Seance** (`apps/seance`): a transactional app. A multi-step booking form for a "seance" appointment with validation, error summary, a confirmation dialog, and a success status message. Shows form-heavy patterns.

They must look and behave clearly differently, to prove the skeleton is flexible.

## The differentiator (why this wins)
Skeleton Key is not just a template. It ships an accessibility "brain" for Kiro, so any app built from it with Kiro stays accessible:
1. **Trusted Tester reviewer agent**: a custom Kiro agent that reviews code using the DHS Section 508 Trusted Tester method, triggered by hooks on save.
2. **Accessibility Conformance Report**: each app generates a VPAT/ACR-style report (WCAG 2.2 AA criteria, Supports / Partially Supports / Does Not Support, with evidence) straight from its test results.
3. **Property-based accessibility tests** (fast-check): accessibility invariants proven over thousands of generated inputs, e.g. every generated token pair meets contrast, every Field config produces a labelled input, Dialog keeps focus trapped for any content.
4. **A custom accessibility MCP server** (`mcp/a11y-mcp`): exposes axe, contrast and keyboard-walk checks to Kiro so it can verify the running app itself.

Pitch line: "Same scan score. Different doors." (two pages can both scan clean and still treat a keyboard or screen reader user very differently)

All code in this repo is new, written during the hackathon. Do not copy code from other projects.

## Theme
Kiroween: spooky, but never at the cost of accessibility. Spooky visuals stay decorative; every real piece of content is real text.
