---
inclusion: always
---

# Repository structure

```
skeleton-key/
  .kiro/            specs, steering and hooks (must stay committed)
  skeleton/         the template: page shell, accessible primitives, tokens, tests
  apps/
    grimoire/       app 1, created from the skeleton: content browsing
    seance/         app 2, created from the skeleton: multi-step booking form
  mcp/
    a11y-mcp/       our MCP server: audit_page, keyboard_walk, page_outline, check_contrast
  docs/             audit results and generated reports
  scripts/
    new-app.mjs     copies skeleton/ into apps/<name> and renames it
  LICENSE           MIT
  README.md
```

- Apps are created from the skeleton with `npm run new-app <name>`, then customised. Don't hand-copy files.
- Each app is a standalone Vite project with its own package.json, so it can be deployed on its own.
- Shared improvements go back into `skeleton/` first, then into the apps.
