---
tags: [nodejs-review]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Can you review the notifications slice under src/features/notifications for me? A contractor wrote it and I want to know what to fix before we build on it. Write the review to REVIEW.md. Don't change the code.

Input files: tsconfig.json, eslint.config.mjs, src/features/notifications/domain.ts, src/features/notifications/ports.ts, src/features/notifications/usecase.ts, src/features/notifications/http.ts, src/features/notifications/worker.ts, src/features/notifications/postgres.ts, src/features/billing/domain.ts