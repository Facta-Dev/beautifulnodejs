---
tags: [nodejs-best-practices]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

I need a small TypeScript library for parsing and comparing semantic versions
and simple ranges, per the semver 2.0.0 spec. Give me `src/lib.ts` plus an
ESM `package.json`: a `parseVersion` that accepts `1.2.3`, `1.2.3-beta.1`, and
`1.2.3+build.5` (prerelease and build metadata), a `parseRange` for `^1.2.3`,
`~1.2.3`, and exact pins, a `satisfies(version, range)` check, and a
`compare(a, b)` that follows semver precedence (numeric identifiers, then
prerelease rules, build metadata ignored for ordering). No dependencies. Every
export gets an explicit return type, parse failures come back as a typed,
exported error value instead of a thrown string, and include table-driven
tests covering the spec's edge cases (prerelease precedence, build metadata,
whitespace, leading zeros, missing parts). Write the files to the current
directory.