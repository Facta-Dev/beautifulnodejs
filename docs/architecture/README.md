# Architecture diagrams

Authored with Archify, sibling set of the facta backend template. Each pair is
`<stem>.<type>.json` (the diagram source) plus the rendered `<stem>.<type>.html`
(explorable standalone page, dark/light themes, live motion).

| Stem | Type | What it shows | JSON | HTML |
|---|---|---|---|---|
| `c4-containers` | architecture | Containers: API clients → ingress → Fastify api (tsyringe root) → outbox worker, Postgres behind PgBouncer, Redis/BullMQ, mail vendor — plus the CI contract gates (lint harness · examples compiler · contracts tests) that make them non-waivable | [json](c4-containers.json) | [html](c4-containers.html) |
| `services-slices` | architecture | The hexagon inside the api: feature slices, platform, shared kernel, Drizzle adapters, BullMQ queue, and the composition root wiring — the rings carry the machine gates (eslint no-restricted-imports walls, 38-rule proven-fire harness, contracts tests) | [json](services-slices.architecture.json) | [html](services-slices.architecture.html) |
| `auth-algorithm` | workflow | The auth algorithm: signup → 6-digit code → verify → password-first gates → JWT 15m + rotating refresh, codes out of the tokens | [json](auth-algorithm.workflow.json) | [html](auth-algorithm.workflow.html) |
| `outbox-algorithm` | workflow | Durable side effects: state change + outbox row in one transaction → BullMQ relay → idempotent consumer → capped retries → dead-letter | [json](outbox-algorithm.workflow.json) | [html](outbox-algorithm.workflow.html) |
| `auth-sequence` | sequence | Signup, code delivery and login as a call chain: one transaction, the BullMQ outbox worker, then verify + mint with rotation | [json](auth-sequence.sequence.json) | [html](auth-sequence.sequence.html) |
| `outbox-sequence` | sequence | Enqueue → claim → relay → deliver → settle plus the janitor purge, as participant messages | [json](outbox-sequence.sequence.json) | [html](outbox-sequence.sequence.html) |
| `database-dataflow` | dataflow | Where data goes: clients → use cases → Postgres (users/sessions, code tables) → outbox rows → BullMQ → mail sender | [json](database-dataflow.dataflow.json) | [html](database-dataflow.dataflow.html) |
| `runtime-lifecycle` | lifecycle | Boot rail: zod config → wiring → serve → readyz gate → request flow, with the drain loop, 401/403 gate and failure endings | [json](runtime-lifecycle.lifecycle.json) | [html](runtime-lifecycle.lifecycle.html) |