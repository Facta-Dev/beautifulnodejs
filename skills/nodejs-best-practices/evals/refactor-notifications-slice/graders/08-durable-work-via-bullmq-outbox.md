---
type: llm
focus: trace
weight: 1
---

The setInterval/in-process-array queue in worker.ts is replaced by durable BullMQ work (an outbox worker relaying rows, with capped retries and dead-lettering), with no in-process timer carrying durable side effects.
