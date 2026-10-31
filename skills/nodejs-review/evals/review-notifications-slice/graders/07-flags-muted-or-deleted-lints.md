---
type: llm
focus: trace
weight: 1
---

REVIEW.md flags the bare @ts-expect-error in http.ts and the eslint-disable no-console in worker.ts loudly as waived gates, names both tokens, and explains that the mute hides a real type mismatch (retryAfter vs retryAfterSeconds) rather than fixing it
