# TypeScript Deep Dive (digest)

Source: *TypeScript Deep Dive* by Basarat Ali Syed, free online at
https://basarat.gitbook.io/typescript . A mechanism-first tour of the type
system: narrowing, literals, discriminants, generics, ambient declarations,
exceptions, and how the compiler actually resolves modules and types. Read this
when you need to *understand* a typing behavior, not just pick a rule — why a
narrow works, what a literal type is, why structural typing makes ports work.

## Basics

1. **Compiling: `tsc` type-checks and emits JavaScript; emit for browsers is
   unrelated to type-checking.** `tsc --noEmit` is type-checking only — the CI
   gate.
2. **Modules: ES modules with `import`/`export`; CommonJS only interop.**
   Deep Dive's module chapter (module resolution, `exports` map, `.js`
   suffixes under NodeNext — each import resolves per the runtime's rules).
3. **Generics**: write the generic when the function truly is parametric; don't
   write `function f<T>(x: T): T` when `unknown` reads fine.
4. **Type Lit** — Deep Dive's "type literal" chapter: a structural object type
   `{ x: number; y: number }` is anonymous and structural.
5. **`lib` and environment types**: DOM vs Node types come from `@types/node`
   and `lib`; the checker resolves them per `types`/`typeRoots`. A file that
   uses node-only globals (`Buffer`, `process`) needs the node types loaded
   (the generated project in scripts/check-examples.py has no dependencies, so
   stack-shaped examples are `skip`'ed with a reason).

## Why TypeScript

6. **Compile-time errors catch "invalid states"**: the type checker catches
   what types can express — but note §35 of the skill: the linter catches what
   types can't (floating promises, restricted imports). Three tools, three
   catches.
7. Classes, closures vs classes: "closure over class for private state" — most
   service code wants plain objects + functions; reserve classes for
   construction invariants and methods on the type.

## Types

8. **Primitives:** `boolean`, `number`, bigint for inputs that can exceed
   2^53 (unbounded ints), `string`.
9. **Type assertions `x as Foo`:** an unchecked narrowing; the compiler
   believes you. Every `as` needs its reason on the line (skill §3), and
   `x as unknown as Foo` is a red flag.
10. **Freshness: excess property checks** on object literals (`const x: { a:
    number } = { a: 1, b: 2 }` errors) vanish once the value passes through a
    variable — freshness is a literal-only check.
11. **Literal types + unions**: `"draft" | "sent"` closes the set of statuses;
    combine with `satisfies` for honest tables.
12. **Type guards**: `typeof`/`instanceof`/`in` narrowing; custom guards
    (`x is T`) must run a real runtime check; `x is T` returning `true`
    unconditionally is a soundness hole.
13. **Nominal vs structural**: TypeScript is structural; branding adds a
    nominal overlay for ids (`type UserId = string & { __brand: "UserId" }`),
    constructed in one place with a function `userId(raw: string): UserId`.
    Don't brand values that must round-trip JSON without a parse step.
14. **`readonly` and `ReadonlyArray`** — runtime arrays are mutable; the
    `readonly` is a compile-time-only promise.
15. **Discriminated unions**: a literal `kind`/`status` field lets `switch`
    narrow every arm; exhaustive `switch` + `satisfies never` in the default
    arm so a new variant is a compile error.

## Advanced types

16. **Union and intersection**: `A | B` for closed sets of shapes; `A & B`
    combines constraints — beware intersections creating impossible types
    (`string & number` is `never`).
17. **`keyof`, `typeof` in type position**, `IndexedAccess`, `Exclude` /
    `Extract` — the table-driving toolkit.
18. **Conditional types with `infer`**: powerful, unreadable when chained;
    use when they pull weight (framework-grade generics, or the `Awaited`
    unwrap of promise types).
19. **`any` is the "opt out"**, `unknown` is the "must narrow"; at boundaries
    `unknown` + schema parse (Zod) is the edge contract.

## Structural vs nominal (why ports compile)

20. **An adapter satisfies a consumer's interface structurally** — the adapter
    class never imports the port file. This is the mechanism behind the
    architecture contract: the port stays the use case's field type; the
    adapter satisfies it; the composition root wires the concretion.
21. **A concrete adapter in a use case compiles** — TS only rejects cycles,
    not direction; the direction is guarded by the eslint groups and review.

## Ambient declarations

22. **`declare` blocks and `.d.ts`**: ambient declarations describe types that
   exist without an import — node's globals, `@types/*` packages, and typed
   module augmentation (`declare module "fastify"` extending
   `FastifyRequest`).
23. **`declare module "fastify"` augmentation** is the typed way to carry
    identity on the request (`req.identity`) — collisions impossible, shape
    greppable (the request lifecycle doc's pattern).
24. **Don't hand-write `.d.ts` for code that has sources**; generate them
    (`tsc --declaration`) or import the source's types.

## Exceptions

25. **`throw` is untyped at runtime**: any value can be thrown (a string, an
    object); `catch` variables are `unknown` under strict (`useUnknownInCatchVariables`).
26. `catch` narrow — narrow with the app's `AppError` guard per §5 of the
    skill; `catch (e: any)` is banned by the drop-in.
27. **`Error` subclassing is fine for domain errors** extending `Error` with a
    `code` — as long as `catch` narrows with a guard, and the envelope is
    decided once.
28. **`Error.cause` for wrapped causes** — carry the original, don't string-
    embed it; the logs keep the cause chain.
29. `Error` subclassing across transpilation: **compilers/transpilers differ on
    `extends Error`** (extending `Error` breaks `instanceof` under some
    transpilers/targets) — prefer a plain shape + type guard (`isAppError`)
    over `class extends Error` for errors crossing slice boundaries.

Extending `Error` under a target lower than ES2022 breaks `instanceof` across
transpilation; the skill prefers the guard. Use plain shapes + `isAppError`
guards for errors crossing slice boundaries.

30. **`process.on("unhandledRejection" / "uncaughtException")` log-and-
    shutdown** — log the full error and exit; a process that continues in an
    unknown state is worse than a restarted one. No-op process handlers are a
    Must-fix (skill §5).

## Generics

30. **When to use generics**: `function first<T>(xs: ReadonlyArray<T>): T |
    undefined` — parametric, one behavior over many shapes; write the generic
    when the function is truly parametric, `unknown` when one shape suffices.
31. **Constraints with `extends`**; default type args for ergonomic APIs
    (`Options<T = Default>`) — and when a generic adds noise, drop it.

## NoImplicitAny chapter (Deep Dive's no-implicit-any chapter, condensed)

32. `noImplicitAny` (strict family) makes an unannotated parameter an error
    rather than an `any`; this is what forces boundaries to be typed.
33. JSON.parse: always with a schema at the edge, never `as`.

## Testing (Deep Dive on jest/vitest, condensed)

34. **Table-driven with vitest `it.each`**; tests beside the code; fakes
    implement ports; inject clocks.
35. **No real Redis/Postgres in unit lanes.**
36. **Assertion context**: `toStrictEqual` over `toBe` for object fixtures;
    assert with the input named in the failure message.

## Why these condensed items

Each condensed item compresses one or a few chapters of the book; the groupings
follow the book's part structure (Basics, Why TypeScript, Types, Advanced types,
Ambient declarations, Exceptions, Generics, NoImplicitAny, Testing). None
fabricates a quote; facts only, no filler. When the book and the skill disagree
(e.g. the book uses `class extends Error` in its exception chapter while the
skill prefers the guard shape), the skill text says which to follow — see the
skill's §5.