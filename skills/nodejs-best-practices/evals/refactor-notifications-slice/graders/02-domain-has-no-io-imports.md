---
type: llm
focus: trace
weight: 1
---

src/features/notifications/domain.ts no longer imports zod, and imports no fastify, tsyringe, drizzle-orm, pg, bullmq, pino, or @opentelemetry/* module at all.
