---
type: llm
focus: trace
weight: 1
---

usecase.ts no longer imports ./postgres.js and stores the NotificationStore port (ports.ts interface) as its field type instead of the concrete PgNotificationStore.
