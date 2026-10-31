---
tags: [nodejs-best-practices]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Here is a slice from our notifications service that a contractor wrote. It
works, but review comments keep piling up and I think it breaks our
architecture rules. Can you refactor it to satisfy the contract and give me a
short list of what you changed and why? Keep the public behavior the same.
Leave the eslint config as it is — it is the source of truth. Write the
refactored files under src/features/notifications/ (same layout), keep
src/features/billing/ untouched, and put the change list in CHANGES.md in the
current directory. When you're done, `npx tsc --noEmit` and `npx eslint .`
should both pass.

Input files: tsconfig.json, eslint.config.mjs, src/features/notifications/domain.ts, src/features/notifications/ports.ts, src/features/notifications/usecase.ts, src/features/notifications/http.ts, src/features/notifications/postgres.ts, src/features/notifications/worker.ts, src/features/billing/domain.ts