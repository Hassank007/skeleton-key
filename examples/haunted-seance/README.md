# Haunted Seance: the exorcism example

This is **not** one of the two Skeleton Crew apps (those are `apps/grimoire` and `apps/seance`). It shows that Skeleton Key's accessibility brain can rescue an app that was **not** built from the skeleton.

1. **Before.** Kiro generated this app from the plain prompt in `PROMPT.txt`, in an empty folder with no steering, specs or hooks. The first commit of this folder is that output, unedited.
2. **Exorcism.** Kiro was then run in this repo, with the steering and the `a11y` MCP server, using the reusable prompt `scripts/exorcise.txt`. It audits the first screen of the running app and reads the source, fixes what it finds, and writes `EXORCISM.md` with the before and after findings and what it could not verify.
3. **Measured.** `scripts/compare/measure-baseline.mjs` runs the same checks before and after. See `docs/baseline-comparison.md`.

Compare the two commits to see exactly what the exorcism changed:

```bash
git log --oneline -- examples/haunted-seance
```

Run it:

```bash
cd examples/haunted-seance
npm install
npm run dev
```
