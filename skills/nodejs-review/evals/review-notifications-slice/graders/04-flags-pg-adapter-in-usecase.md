---
type: llm
focus: trace
weight: 1
---

REVIEW.md flags usecase.ts importing PgNotificationStore and pg's Pool and storing the concrete adapter instead of the consumer-defined NotificationStore port (the field type is the contract)
