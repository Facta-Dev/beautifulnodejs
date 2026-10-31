---
type: llm
focus: trace
weight: 1
---

REVIEW.md flags the unawaited void this.store.save(notification) call in usecase.ts as a floating promise and shows the await-and-surface-the-error fix (not just removing the void)
