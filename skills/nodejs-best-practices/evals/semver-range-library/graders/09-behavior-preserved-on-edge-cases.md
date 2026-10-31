---
type: llm
focus: trace
weight: 1
---

The tests assert semver-spec behavior on the edge cases: prerelease identifiers sort before and by numeric/alpha rules, build metadata is ignored for compare but preserved on parse, and invalid inputs (leading zeros, whitespace, missing core parts) return the documented error variant.
