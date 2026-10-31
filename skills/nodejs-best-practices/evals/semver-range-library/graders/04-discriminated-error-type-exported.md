---
type: llm
focus: trace
weight: 1
---

The library exports a discriminated parse-error type (e.g. a union of variants carrying the failure kind) and parse failures return that type as a value rather than throwing a bare string or Error.
