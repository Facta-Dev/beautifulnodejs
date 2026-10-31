---
type: llm
focus: trace
weight: 1
---

The routes in http.ts no longer write their own error JSON; errors surface as typed errors for the single error handler, and no response body leaks err.message or a stack trace.
