---
name: nodejs-port
description: >-
  Port code from Python, Go, Ruby, Rust, C, C++, Java, or legacy JavaScript into
  idiomatic Node.js + TypeScript that keeps the original behavior: discriminated
  unions instead of error codes and thrown strings, typed errors instead of
  anything-goes exceptions, and tests that prove the port matches. Use this
  whenever the user asks to port, translate, convert, migrate, or rewrite code in
  TypeScript or JavaScript ("rewrite this in TypeScript", "what would this look
  like in Node", "move this module to TS"), even if they don't say "port". Port
  the original tests first. Pairs with the nodejs-best-practices skill, which
  covers the target code's style.
---

# Node.js port

The goal is the TypeScript a TypeScript developer would have written to solve the same
problem, with the same observable behavior. A line-by-line transliteration (C written in
TS syntax, or Python with `any` types everywhere) compiles but keeps every problem the
original had and drops the type system in between. Port the behavior, not the structure.

## 1. Understand the original before writing anything

1. **Read the code and its tests**, and anything that calls it, if you have it.
2. **List the observable behavior**: every public function, its inputs, its outputs, and
   every way it can fail. Include the quiet parts, which are where ports go wrong:
   ordering of results, how ties break, what happens on empty input, whitespace and case
   handling, integer limits, and what counts as an error versus a valid edge case. For
   JavaScript-adjacent originals add the TS-specific quiet parts: object key iteration
   order, the `undefined`/`null` split, and implicit string coercion.
3. **Note what is incidental**, meaning things the original only does because of its
   language: manual memory management, out-parameters, `NULL` returns, global state,
   fixed-size buffers, a class that exists only to group functions, or `isinstance`
   checks. These don't carry over.
4. If the original has a bug or an ambiguity, keep its behavior, flag it in the porting
   notes, and let the user decide. A port is not the place to silently fix things.

## 2. Port the tests first

Translate the original tests into TypeScript tests before porting the implementation.
Keep one TypeScript test per original test, with a name that maps back to it, so a reader
can check coverage; where the original used a subTest-like loop, use a table-driven test
with one row per case. The tests are the definition of "same behavior". If the original
has no tests, write characterization tests from the behavior list in step 1.

## 3. Design the TypeScript API, then implement it

Decide the public types and signatures from the behavior list, not from the original's
shape. Then implement against the ported tests.

### From C and C++

| In the original | In TypeScript |
|---|---|
| `malloc`/`free`, `new`/`delete`, `create`/`destroy` pairs | Plain objects and classes owned by the garbage collector; nothing to release |
| `NULL` meaning "absent" | `null` or `undefined`, one of them, with a type that says which |
| Error codes (`-1`, `ERR_*` defines), `errno` | A discriminated error union, one variant per code (see below) |
| Out-parameters (`int *err_line`, `long *out`) | Return values: put the data in the success value or the error variant |
| Flag bitmasks (`FLAG_A \| FLAG_B`) | An options object with named fields; never a raw `number` |
| `char *` plus length, `strcmp`, `strcasecmp` | `string`, `===`, `toLowerCase()` comparisons; check edge cases against the original |
| Pointer plus count, iteration by index | Arrays and iterators |
| Fixed-size buffers and their truncation | Growable arrays; drop the limit unless the limit is behavior |
| `#define` constants and macros | `const`, union types, and functions |
| Global or static mutable state | A class or object the caller owns |
| `strtol` and friends | `Number.parseInt`/`Number.parseFloat` with a validity check, or a Zod schema; map parse failures to your error union |

Do not write Node-API (N-API) bindings or `Buffer`-twin pointer math unless the port must
talk to C through FFI, and then confine it as the `nodejs-best-practices` skill describes.

### From Python

| In the original | In TypeScript |
|---|---|
| An exception hierarchy | One discriminated error union (or one per area) with a variant per exception class; data attributes become variant fields |
| `None` as a value | An explicit `Result` union, or the `null`/`undefined` distinction, chosen on purpose; never bare `undefined` leaking through an API without a type that says so |
| Strings used as a closed set (`kind in ("build", "test")`) | A union type, or a Zod enum at the trust boundary |
| Dicts or classes used as records | Interfaces with known fields, not `Record<string, any>` |
| `dict` iteration order (insertion order is guaranteed) | A `Map`, or order preserved through arrays; object key order for non-integer keys matches in practice but is not a contract — don't rely on it |
| Duck typing, `isinstance` | Interfaces plus type guards |
| Unbounded `int` | `number` with explicit precision limits, or `bigint` when input can exceed `2 ** 53`; document the limit |
| `sorted(..., key=...)` | `[...xs].sort()` with a comparator; JS sort is stable like Python's, but it mutates — copy first |
| `str.splitlines()`, `strip()`, `isalnum()` | `.split("\n")` (with `\r` handling), `.trim()`, regex checks; verify edge cases such as `\r\n`, Unicode, and empty strings against the original |
| `try`/`except` around a parse | A returned error variant, or `match`-style narrowing on the result |

### From Go

| In the original | In TypeScript |
|---|---|
| `(value, error)` returns | A per-function `Result<T, E>` discriminated union, not `T \| undefined` |
| `nil` | `null` with a narrowed type, or `undefined` chosen explicitly |
| Interfaces | Consumer-defined TypeScript interfaces, satisfied structurally |
| Goroutines and channels | `Promise.all` and async iterators; real concurrency only via `worker_threads` or a BullMQ queue — never naked callbacks |
| `defer` | `try`/`finally` |

### From Rust, Java, and other AOT languages

- Rust `Result`/`Option`, `match`, and enums with data become the same discriminated
  unions; traits become interfaces; `?` becomes early returns on the union.
- Java checked exceptions, `Optional`, and enum classes map the same way: one error union
  per area, `null`-or-value chosen explicitly, string enums rather than `String` fields.
- Generic type parameters translate directly; lifetimes disappear.

### From legacy JavaScript and to-TS migrations

Plain objects become interfaces, thrown strings and ad-hoc `Error`s become the typed
error union, callback APIs become Promises where callers need them, and `null`/`undefined`
assignments get an explicit type. Keep the runtime behavior: the goal is types over the
same code, not a rewrite.

### Errors become one exported discriminated union

Replace every original error path with one exported union, one variant per failure mode,
each variant carrying the data the caller needs:

```ts
interface Item {
  readonly sku: string;
  readonly name: string;
  readonly qty: number;
  readonly reorderAt: number;
}

type InventoryError =
  | { kind: "parse"; lineNo: number; message: string }
  | { kind: "duplicateSku"; lineNo: number; sku: string }
  | { kind: "unknownSku"; sku: string }
  | { kind: "insufficientStock"; sku: string; requested: number; available: number };

type ParseResult = { kind: "ok"; items: Item[] } | { kind: "error"; error: InventoryError };
```

Throw nothing across the ported API unless the original did and its callers still need it;
where the original threw, return the union. Never throw bare strings, and never catch
without narrowing.

### A port is domain code

A port produces pure logic. It does not introduce new infrastructure decisions: no HTTP,
no database, no queue, no logger in the ported code itself. If the port lands in a
backend-node repository, put it in a slice's `domain.ts` (it imports none of fastify, zod,
tsyringe, drizzle-orm, pg, bullmq, ioredis, pino, prom-client, or `@opentelemetry/*` — not
even for one helper), define any adapter port in the file that consumes it, and leave the
wiring to the composition root (`src/bin/api.ts`, `src/bin/worker.ts`), as the
`nodejs-best-practices` skill's architecture contract requires. If a side effect must be
durable, it is a porting decision worth flagging in the notes, not a `setTimeout` in the
implementation.

## 4. Keep the port proportionate

A port that matches the original on every possible input is usually the wrong goal.
Match it on the inputs it actually receives, and use the JavaScript standard library and
the Node.js runtime for the rest.

- **Don't reimplement the source language's runtime.** Use `.trim()`, `Number.parseInt`,
  `Array.prototype.sort`, and `Map`, not hand-written copies of Python's `strip`, `int()`,
  or `sorted`, of C's locale-dependent `isspace` and `strtol`, or of Go's `strings.Fields`.
  Where TypeScript's behavior differs only on exotic input, such as Unicode digits,
  non-ASCII whitespace, integer precision beyond `2 ** 53`, or object key order, list the
  difference in the porting notes instead of coding around it. Write a compatibility shim
  only when the user says those inputs occur.
- **Don't grow the API.** Port the public surface the original has, plus what TypeScript
  callers expect: the public types, the exported error union, and `Iterable`-style access
  or accessors (`length`/`isEmpty`) where the original exposed them. Skip builders, mixin
  types, and event emitters unless the original's callers need them.
- **Keep the algorithm unless it's wrong.** Swap in a different algorithm only to fix a
  real problem, such as quadratic behavior on realistic input or blocking the event loop
  on large payloads, and say so in the notes.
- **Check the size.** Count code lines, excluding tests, comments, and doc comments. A
  port from Python or JavaScript usually lands slightly smaller than the original or
  similar size, because types replace runtime checks. A port from C or C++ usually lands
  smaller. Much larger usually means one of the three habits above.

Differential testing against the original is worth doing, but a few dozen realistic and
edge-case inputs answer the question. A fuzzing harness over millions of inputs usually
just finds exotic divergences that belong in the notes.

## 5. Verify

Run these if a Node.js toolchain is available, and fix everything before reporting:

```bash
npx tsc --noEmit
npx eslint .
npx vitest run
```

Every ported test must pass. If the original's tests can be run too, run them and compare
results on the same inputs. If the port targets a backend-node repository, apply the
`nodejs-best-practices` architecture contract before handing it back.

## 6. Write the porting notes

Alongside the code, write a short `PORTING.md` that a reviewer can check in a few
minutes, with a first sentence that says what the port is:

- **API mapping:** a table from each original function or type to its TypeScript
  equivalent.
- **Test mapping:** each original test and the TypeScript test that covers it.
- **Deliberate differences:** anything that now behaves differently and why, such as an
  out-of-memory error that no longer exists, a fixed buffer limit that's gone, or integer
  precision and iteration-order differences from the table above.
- **Failure modes:** every exported error variant and the input that produces it.
- **Preserved quirks:** odd behavior kept on purpose, so nobody "fixes" it by accident.
- **Verification:** which commands you ran and their result, or a plain statement that
  you couldn't run them.

For the style of the TypeScript itself, follow the `nodejs-best-practices` skill if it is
installed.