---
type: llm
focus: trace
weight: 1
---

The pg error mapping (codes 23505 and 42P01) happens exactly once, inside postgres.ts, mapping to a typed domain error, and usecase.ts no longer catches or string-matches message text.
