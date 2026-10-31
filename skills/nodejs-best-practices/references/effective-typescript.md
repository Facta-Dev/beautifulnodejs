# Effective TypeScript (digest)

Source: *Effective TypeScript* by Dan Vanderkam (O'Reilly, 2nd edition), free
sample items online at https://effectivetypescript.com . Sixty-two items on
understanding and mastering TypeScript: the type system, inference, type design,
`any` management, declarations, and day-to-day practice. Read this when weighing
alternatives — `interface` vs `type`, narrowing tactics, designing types that
don't allow invalid states, or how to get past a type error honestly.

## Getting up to speed

1. **TypeScript's type system is independent from your runtime.** Types exist at
   compile time and are erased at runtime. Every type-level claim is a claim
   about a runtime value; design types so the claim holds.
2. **Turn the compiler's checking on and know what each flag does.** The strict
   family plus `noUncheckedIndexedAccess` and `noImplicitOverride` are the
   working set this skill assumes.
3. **Structural typing: a type is its shape, not its name.** Consequences: an
   adapter satisfies a consumer-defined port without importing it, and any code
   with the same shape satisfies your public interface.

## Type system fundamentals

4. **Add tsconfig options only when you understand them.** An option you don't
   understand either checks nothing or breaks the build for nothing; enable
   incrementally and read what each flag actually checks.
5. **Know how to narrow `unknown`**: `typeof`, `in`, `instanceof`, and custom
   `x is T` guards. A custom guard must be a real runtime check, not a cast in
   predicate clothing.
6. **Prefer a type annotation over an `as`** — an annotation is a checked
   claim, an `as` is an unchecked one.
7. **Mutability is a design decision.** `readonly` fields, `ReadonlyArray<T>`
   for data a callee must not mutate, `as const` for literal tables.
8. **Literal types are the raw material of discriminated unions.** Unions of
   string literals close the set of values; `satisfies` tables keep the runtime
   object honest against the type.
9. **Use `interface` for object shapes you may extend or merge (and for ports);
   `type` for unions, conditionals, and mapped types.** `extends` beats
   intersection for error messages and compile speed; intersections can produce
   `never` fields with no runtime counterpart.
10. **Template literal types** compose with unions: `` `${"GET"} /${string}` ``
    types a route table without enumerating it.
11. **Know what a name in type position refers to.** `typeof x` in type
    position takes the value's type; `keyof T` reads the keys of a type; a
    type alias is transparent — it does not create a new type. Branded ids
    (`type UserId = string & { __brand: "UserId" }`) are the exception on
    purpose.
12. **Use `module: NodeNext` for Node.js services.** It makes the resolution
    rules match what `node` does at runtime — the extension and `exports` map
    errors surface at compile time, not first request.

## Type design

13. **Design types so invalid states are unrepresentable.** A `state: "pending"
    | "loaded" | "error"` union beats a status string plus comments; a shape
    union beats optional fields that enable "radius only when kind is circle"
    states.
14. **Prefer unions of interfaces to interfaces of optional fields.** An
    interface of optionals allows every combination, including the invalid ones.
15. **Avoid option bags without a discriminated kind** — a wide options object
    can express states the runtime never wants.
16. **Distinguish `null` and `undefined` deliberately, and never let bare
    `undefined` leak through an API.** Give an absent look-up a named type
    (`Widget | null`) chosen on purpose.
17. **Model the error set as a discriminated union** — one union per area, one
    variant per cause, data as variant fields. Thrown strings have no runtime
    shape for `catch` to narrow on.
18. **Strings are not enums**: a union of literals plus a `satisfies` table
    instead of a runtime enum object, unless the framework needs the enum.
19. **Conditional and mapped types** (`ReturnType`, `Awaited`, `infer`) buy
    composition; chained type-level code nobody can read is complexity, not
    power.
20. **`satisfies` checks a value against a type without widening it**:
    exhaustive `switch` arms, `satisfies Record<Kind, Handler>` tables where a
    missing key is a compile error.

## Inference and narrowing

21. **Let inference work inside function bodies; be explicit at module
    boundaries.** An accidental `Promise<void>` on an exported function changes
    every caller's types; exports carry explicit return types.
22. **Narrow with built-in guards** (`typeof`, `instanceof`, `in`) before custom
    guards, and reserve custom guards for checks reused across files.
23. **A type predicate must actually predicate.** `x is T` returning `true` for
    a value the runtime check never verified is a soundness hole — the compiler
    cannot check your predicate's body for honesty.
24. **`!` (non-null assertion) is an unchecked narrowing**, the same family as
    `as`; justify it or replace it with a guard.

## any management

25. **`any` disables checking for everything it touches.** The path out:
    `unknown` at the trust boundary, a guard, then the exact type.
26. **`as unknown as X` is a red-flag finding, not a fix.**
27. **Parse JSON with a schema at the edge** (Zod); never `JSON.parse(...) as
    Config`. A cast on parse is an unchecked claim about untrusted data.
28. **`catch (e)` is `unknown` by default under `useUnknownInCatchVariables`
    (part of strict)**; narrow it before using it, not `catch (e: any)`.
29. **Typed module augmentation** (`declare module "fastify"` extending
    `FastifyRequest`) is checked augmentation, not an `any` hole — keep the
    augmentations in one place so two files can't disagree.
30. **Every `any` in a shipped type is a hole in every consumer's checking.**

## Declarations and module shape

31. **`import type` for type-only imports**, so a type-only dependency never
    creates a runtime edge (the `consistent-type-imports` rule).
32. **Explicit return types on exports** — the book's recommendation and the
    drop-in's `explicit-module-boundary-types` rule.
33. **No default exports in library code**; named exports keep refactoring and
    grep honest.

## Writing and running code

34. **The type checker, the linter, and tests catch different things.** A
    `switch` missing a variant, a floating promise, a domain file importing zod:
    none of these are compile errors. Run all three (`tsc --noEmit`, eslint,
    tests) as gates, never argue a gate away.
35. **Lint with the same program the build uses** (typescript-eslint's
    `projectService` reads the project's tsconfig), so the linter sees the types
    the compiler sees.
36. **Pin dependencies to modern majors and audit** (`pnpm audit
    --audit-level=high`); a package you never update is a package whose
    changelog you can't read when you finally must.

## Tests (the book's testing guidance, condensed)

37. **Tests beside the code** (`usecase.test.ts`); table-driven `it.each` rows —
    one behavior per row, so adding a case is adding a row.
38. **A failing test before fixing a bug.**
39. **Fakes implement the consumer's port** (~10 lines each); unit tests never
    touch real Redis/Postgres.
40. **Tests never sleep and never read the wall clock**: inject a `Clock` and
    dates. Tests that sleep are flaky; tests that read the real clock are
    non-deterministic.

## Why these condensed items

Each condensed item compresses one or a few book items; the groupings follow the
book's parts. None fabricates a quote. When the book and the skill disagree, the
skill text says which to follow — e.g. the book tolerates an `as` you can
justify, the skill requires the justification on the line.