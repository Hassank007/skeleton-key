# The Kiro accessibility brain

Skeleton Key ships a reviewer agent and four hooks that keep an app accessible while you edit it with Kiro. Everything lives in `.kiro/` and is committed. The design is in `.kiro/specs/a11y-brain/`.

## The `trusted-tester` agent

`trusted-tester` reviews code with the DHS Section 508 Trusted Tester method. It walks 14 ICT Baseline tests for web UI: keyboard, focus, non-interference, contrast, title and language, headings and landmarks, forms, link and button names, images, status messages, timing, flashing, reflow and resize, and sensory characteristics.

It is read-only. It reports, you fix.

**Start it**

- Kiro CLI: `kiro-cli chat --agent trusted-tester`
- Kiro IDE: choose `trusted-tester` in the agent selector.

Then ask, for example: `Review skeleton/src/components/Dialog.tsx`.

**What you get**

- Findings, each with the WCAG 2.2 criterion, a severity (Critical, Serious, Moderate, Minor), a `path:line` location and a concrete fix.
- A results table with Pass, Fail, Not applicable or Not tested for each of the 14 tests.
- A list of manual steps for anything it could not check from source.

## The hooks

| Hook | Trigger | What it does |
|---|---|---|
| `a11y-guard` | Save a `.tsx` file in `skeleton/src/` or `apps/*/src/` | Reviews the file against `.kiro/steering/accessibility.md`, fixes violations, explains each fix in one line. |
| `test-buddy` | Create a `.tsx` file in a `src/components/` folder | Writes `tests/unit/<Component>.test.tsx` with Vitest and `vitest-axe`, runs it and fixes it until it passes. |
| `skeleton-sync` | Change a file in `skeleton/src/components/` | Lists the apps that use the component and what each needs updated. Report only. |
| `readme-keeper` | You trigger it manually | Refreshes `README.md` from `.kiro/specs/` and `.kiro/hooks/`. |

**Run `readme-keeper`**: open the Agent Hooks panel in the Kiro sidebar and click the play button next to it.

**Turn a hook off**: set `"enabled": false` in its `.kiro/hooks/<name>.kiro.hook` file, or toggle it in the Agent Hooks panel.

## Limits

The brain reads source code. It does not drive a browser or a screen reader, so it cannot prove an app is accessible. It will not claim conformance without evidence, and it marks checks it cannot run as "Not tested". Back it with the axe tests (`npm test`, `npm run test:e2e`) and a manual pass: Tab through every page, zoom to 400%, and listen with a screen reader.
