---
type: llm
focus: trace
weight: 1
---

Every test in test_inventory.py has a ported counterpart that passes, and the edge cases match: line-number parse errors, duplicate-sku detection, empty and comment-only input, whitespace trimming, case-sensitive skus, inclusive low_stock in definition order, zero-quantity items, and non-mutating withdraw
