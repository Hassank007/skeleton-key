---
inclusion: manual
---

# readme-keeper

Manual workflow: run it from chat with `/readme-keeper`. It refreshes README.md from the specs and hooks. Converted from the legacy `readme-keeper.kiro.hook` (trigger `userTriggered`), which the current Kiro IDE has no hook trigger for.

Read every requirements.md under .kiro/specs/ and every *.json file under .kiro/hooks/ (each can define several hooks) and the scripts they run, plus .kiro/agents/*.json. Then update README.md so its sections on the specs, the Kiro accessibility brain and the hooks are accurate: one line per spec describing what it covers, and a table of hooks with name, trigger and what it does. Keep the existing title, pitch, license section and links. Change only what you can derive from the files you read, and state facts only from those files. Do not claim that any app conforms to WCAG; describe what the tooling does instead. Reply with a short list of the README sections you changed.
