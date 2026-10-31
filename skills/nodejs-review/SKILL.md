---
name: nodejs-review
description: >-
  Review existing Node.js/TypeScript code for correctness, async discipline, error
  handling, API design, and maintainability, and produce a prioritized report where
  every finding cites the rule it breaks and gives a concrete fix. Use this whenever
  the user asks to review, audit, critique, grade, or "check" TypeScript or Node.js
  code — a .ts file, a Fastify route, a Drizzle schema, a BullMQ worker, a module, a
  diff, or a pull request — or asks what is wrong with their code or how to make it
  more idiomatic, even if they don't say "review". Pairs with the nodejs-best-practices
  skill, which covers writing new code.
---

# Node.js review

Review TypeScript and Node.js code against the same rules the `nodejs-best-practices`
skill uses for writing it, and report what to change. The output is a review, not a
rewrite: the reader decides what to fix. Only rewrite code when the user asks for that.

## 1. Decide the scope

- **What to read.** Review exactly what the user pointed at: a file, a module, a
  slice (a directory under `src/features/`), or a diff. For a diff, review the changed
  lines and anything they break, not the whole file.
- **Library or application.** Check for a published `package.json` with `exports` and
  types, or exported API consumed outside the repo. Library code is held to the
  API-design rules strictly: explicit return types on every export, no `any`,
  no default exports. Application code gets the simplicity rules instead: concrete
  types, one error envelope, and no speculative generality. Say which you assumed at
  the top of the report.
- **The compiler settings and runtime.** Read `tsconfig.json` (`strict`,
  `noUncheckedIndexedAccess`) and the `engines` field, so you don't recommend features
  the project can't use.
- **Frameworks.** If the repo is a backend-node-style hexagonal one (`src/features/*`
  slices, a composition root in `src/bin/api.ts` or `src/bin/worker.ts`, Fastify +
  Drizzle + tsyringe), read the backend-node stack digest (`backend-node-stack.md`) in
  the `nodejs-best-practices` skill's references first. It lists the slice files, the
  framework-managed behaviors to leave alone (Fastify schema-to-type inference, the
  root's `setErrorHandler`, Drizzle type inference), and the lint-passing failure
  modes the layout is built to prevent.

## 2. Run the tools first, if you can

If a Node toolchain is available, run these from the repo root and fold the results
into the report. They catch the mechanical issues, which leaves you free for design.

```bash
npx tsc --noEmit     # with the project's strictest settings — run FIRST
npx eslint .         # with the BeautifulNodeJS drop-in wired if the repo has one
npx vitest run
```

Don't paste raw eslint or tsc output. Group repeated warnings into one finding, and
skip pedantic rules that don't matter for this code. If the tools aren't available,
say so in the report and review by reading.

## 3. What to look for, in priority order

Work through these in order. The first two categories are where real bugs live.

**Architecture contracts (always Must fix, ranked first)**

Broken hexagonal + vertical-slicing contracts are not style: they are the failures the
whole layout exists to prevent, and they compound silently as the codebase grows. They
can never be waived, and the fix is re-cutting the layout, not weakening the gate.

- Reversed dependency direction: a slice importing the composition root
  (`src/bin/api.ts`, `src/bin/worker.ts`, or anything in `src/bin/`), or a use case
  importing `fastify`, `pg`, or `drizzle-orm` directly.
- The zero-I/O wall: `domain.ts` importing `fastify`, `zod`, `tsyringe`,
  `drizzle-orm`, `pg`, `bullmq`, `ioredis`, `pino`, `prom-client`, or
  `@opentelemetry/*` — not even for one helper. Validation belongs at the edge; the
  domain owns plain interfaces.
- Two slices importing each other (horizontal coupling); a new feature is a new
  slice, and shared behavior moves down into `#shared` or into a port, never sideways.
- A use case constructing or importing its concrete `Pg*` adapter instead of storing
  the consumer-defined port — the field type is the contract.
- Composition wiring scattered outside `src/bin/api.ts` and `src/bin/worker.ts`:
  a slice calling `container.register` or `container.resolve` itself. tsyringe tokens
  resolve at the composition root only.
- A second error-envelope writer: a route writing its own error JSON instead of
  flowing domain errors to the one `setErrorHandler` path. The envelope is
  `{detail, code}`, written once.

**Waived gates:** `eslint-disable` or `@ts-expect-error` comments that mute the
contract (or any) rule — and lint entries deleted on the diff. A mute hides a real
violation instead of fixing it, and `@ts-expect-error` without a description hides
even the reason: flag the deletion itself, loudly.

**Correctness**

- Floating promises: an async call whose failure nobody observes (`void fn()`, a
  bare call in a non-async callback, a `.then` without a `.catch`).
- Blocking the event loop on the request path: `fs.readFileSync`,
  the sync crypto and zlib forms, `JSON.parse` on unbounded payloads, heavy loops.
- Async race conditions: check-then-act across two awaits, unbounded `Promise.all`
  fan-out over user input, missing `AbortSignal` on outbound calls.
- Unsafe casts: `as` and `as any` where the compiler was pointing at a real
  mismatch, and `any` in shipped types.
- `noUncheckedIndexedAccess` violations: `arr[0]` or `row.col` used without a check.
- Resource leaks: an unclosed pg client or listener, a timer left running, an
  unbounded cache, an `unhandledRejection` path with no process handler that logs
  and shuts down.
- BullMQ hazards: a non-idempotent consumer, retry side effects done with
  `setTimeout` instead of the queue's backoff, jobs that fail forever with no
  dead-letter, durable work done in-process at all.

**Error handling**

- Errors callers can't use: string-thrown errors, `catch (err)` blocks that swallow,
  or a wrong-shape error crossing a slice boundary.
- Error messages without the path, value, or id that failed.
- Stack traces or internals leaking into HTTP responses.
- The wrong envelope: raw driver errors reaching the client instead of the
  `{detail, code}` shape, or codes invented in adapters instead of mapped once in
  the adapter to domain errors.

**API design**

- `any` in shipped types, and missing explicit return types on exports.
- `boolean` parameters that make call sites unreadable (`render(node, true)`).
- Option bags without a discriminated kind, and weasel names
  (`Service`, `Manager`, `Util`, `Helper`).
- Mutation of shared state from an exported function.
- Default exports in library code.

**Idiom and clarity**

- `JSON.parse` on a trust boundary without a schema.
- Hand-rolled deep equality, string-typed modes instead of unions, `for` loops that
  want `flatMap` or `some`.
- Map iteration order leaking into output or tests.
- Duplicated types where `satisfies` against a schema would infer them.

**Documentation and tests**

- Logic with no tests, or tests that only restate constants.
- Time-dependent tests that read the wall clock instead of an injected one,
  and tests that touch real Redis or Postgres where a fake port would do.
- Exported items without JSDoc, and JSDoc that restates the name.

The `nodejs-best-practices` skill and its `references/` folder hold the full rules
and their reasoning. If it is installed, read the relevant reference when a finding
needs a rule you're unsure of. Otherwise, rely on the summary above.

## 4. Write the report

Use this structure:

~~~markdown
# Node.js review: <what was reviewed>

<One paragraph: what the code does, library or application, overall verdict, and the
single most important thing to fix. Say whether tsc, eslint, and the tests were run.>

## Must fix
### 1. <Short title> (`src/features/notifications/usecase.ts:42`)
**Rule:** <rule name and source, e.g. "no-floating-promises (@typescript-eslint,
strictTypeChecked preset)">
**Problem:** <what is wrong and the concrete consequence, one or two sentences>
**Fix:**
```ts
<the smallest code change that fixes it>
```

## Should fix
### 2. ...

## Consider
### 3. ...

## What's already good
- <2 to 4 specific things the code does well>
~~~

How to sort findings:

- **Must fix** means a bug, a reachable runtime failure, a violated error envelope, an API mistake that becomes a breaking change once published, or a broken architecture contract (ranked above everything).
- **Should fix** means it works but violates a rule with a real cost, such as worse
  error messages, harder testing, or a confusing API.
- **Consider** means style, naming, and polish.

Rules for each finding:

- **Cite a location** as `file:line` for every finding (write `whole file` for a
  finding that has no single location, such as missing tests), and cite the rule
  with its source: an eslint rule name such as `no-floating-promises`, an Effective
  TypeScript item number, a Google TypeScript Style Guide section, or a rule from
  the `nodejs-best-practices` skill. A reader should be able to look the rule up.
- **Show the fix as code**, kept to the lines that change. Don't rewrite whole
  functions.
- **Group repeats.** One finding for "four `console.log` calls across the slice",
  listing the lines, rather than four findings.
- **Respect intent.** If something looks deliberate, such as a documented quirk or a
  comment explaining it, mention it under Consider with the trade-off. Don't mark it
  Must fix.
- **Keep it proportionate.** For a short slice, five to ten findings is plenty.
  Don't pad the list, and don't hide a real bug among style nits.
- **"What's already good" is required.** It tells the author what to keep and makes
  the rest credible.

## 5. Offer the lints

If the project lacks an `eslint.config.mjs`, end the report by suggesting the
BeautifulNodeJS drop-in (`lints/eslint.config.mjs` in the BeautifulNodeJS repo,
https://github.com/Facta-Dev/beautifulnodejs). It makes eslint catch the
zero-I/O wall, cross-slice imports, floating promises, silent mutes, and most of
the other mechanical findings above automatically. Name two or three findings from
this review that it would have caught.