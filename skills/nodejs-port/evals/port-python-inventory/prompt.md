---
tags: [nodejs-port]
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

We're moving our inventory module from Python to TypeScript. Port inventory.py to an
idiomatic ESM TypeScript package with the same behavior, and port test_inventory.py too
so we know it matches. Put the package in the current directory (package.json, src/) and
add a PORTING.md with notes for the reviewer.

Input files: inventory.py, test_inventory.py
