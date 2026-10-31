# Google TypeScript Style Guide (digest)

Source: the *Google TypeScript Style Guide* (Google, maintained live at
https://google.github.io/styleguide/tsguide.html) . A rules-first guide covering
naming, formatting, imports, and which language features to prefer and which to
avoid. Read this when settling naming or "which feature should I use" questions
in application and library TypeScript alike. Condenses the guide as published
(2025); anything it marks as historical has been left out.

## Source files

1. **Each file is a module.** Prefer ES modules; a file that only exists to
   re-export keeps its exports minimal.
2. **ES modules, `import type` for types** so a type-only dependency never
   creates a runtime edge (the skill's `consistent-type-imports` rule enforces
   it).
3. **UTF-8, LF, trailing newline**; 2-space indentation per Google; the
   BeautifulNodeJS drop-in defers to Prettier for whitespace and keeps these
   file rules.
4. **`const enum` — never.** Google bans it (unisolated-library hazard and
   deprecation pressure); use a plain string enum or a union of literals.
5. **`namespace` and `module` keywords — avoid** in a module world; use file
   layout and `type`/`const` objects instead.
6. **Use `export` (public) sparingly.** Widen visibility only when a consumer
   needs it: widening is non-breaking, tightening is not.

## Naming

| Item | Case | Notes |
|---|---|---|
| Types, classes, enum members | `UpperCamelCase` | Acronyms are one word: `Url`, `HttpClient` |
| Functions, locals, parameters | `camelCase` | |
| Constants (module-level) | `SCREAMING_SNAKE_CASE` | Google's rule; "constant" = set once |
| Property names in config objects | same as locals | |
| No `get`/`set` prefixes on simple getters | | name the value: `name()` not `getName()`; reserve `get`/`set` for accessors |

- Private fields by `#` over TypeScript `private`: it is enforcement, not
  decoration. In application code a leading underscore remains acceptable.
- **No abbreviated names an outsider can't read**: `userId` not `uid`; `i`/`j`
  in tight loops fine.
- **No weasel suffixes** `Service`, `Manager`, `Util`, `Helper` — name the
  thing. `Bookings`, `Dispatcher`, `OutboxPoller`.
- Name a function after what it returns or does, not how: `parseVersion` not
  `handleVersionString`.

## Language features: prefer and avoid

### Types

1. **Type vs interface**: both fine; **`interface` when it may be declared
   merged/extended (and for object shapes)**, `type` for unions, conditional
   types, mapped types, and anything not object-shaped.
2. **Type assertions `x as Foo` are a narrowing of last resort.** Every `as`
   should have a comment or be obviously safe; prefer type guards.
3. **`unknown` over `any`** at every boundary; `any` is reserved for genuinely
   untyped legacy seams, and then only in one narrow file.
3. **Type predicates (`x is Foo`) over assertions** when the check is shared.
4. **Optional fields `foo?: T` vs `foo: T | undefined`**: prefer `T | undefined`
   in most cases — absence is now a value the code must handle, not an omitted
   key. Optional fields carry an extra risk: they may be *missing*, and the
   type still has to survive `exactOptionalPropertyTypes`.
5. **Structural typing means the name doesn't matter, only the shape** — which
   is why adapters "implement" a consumer's interface without importing it.
6. **Discriminated unions** (`kind` field) over boolean flags; narrow with
   `switch` + exhaustiveness (`satisfies never`) so a new variant is a compile
   error.
7. **Branded types** where strings must not be interchangeable (ids). Google
   brands via a phantom property pattern similar to the skill's.
8. **`readonly` on fields and arrays; `as const` for literal tables.** A `ReadonlyArray` returned from a slice must never be handed off as `T[]`.
9. **Generics: default to concrete, generic only on need** — and when generic,
   use the full conditional/generic power only if it pulls real weight.
10. **Never `enum`?** No: enums are allowed but marginal; union types are the
    default. (Contrast: `const enum` is banned.)
11. **Never `namespace`, never `require`/`module.exports`** in new code.
12. **`function` declarations over `const fn = () =>`** for top-level functions.
    Arrow functions: the one-liner identity, or where `this` isn't an issue.

### Classes and objects

1. **Default to `class` only when behavior + construction invariants matter**;
   a plain object + functions is fine, and data-only records don't need a class.
2. `override` keyword on overriding members — matches `noImplicitOverride` in
   the strict set.
3. **Constructor parameter properties** (`constructor(private readonly x: T)`)
   are allowed and encouraged where they remove boilerplate.
4. Google bans `#private`-vs-`private` debate: **`#`-fields for enforcement.**
5. Rust-flavored "type state" tricks (builder chains with phantom types) are
   not idiomatic TS; use plain typed builder objects.

### Functions

1. **No default parameter values** in library code — they hide the actual
   value and break with spread calls; make the options object explicit.
   Application code may use them. (The skill keeps Google's rule.)
2. **Rest parameters over `arguments`**, always.
2. **Function overloads are allowed but discouraged**; overload resolution is
   call-site noise. Prefer unions of parameters or an options object.
3. **No `this` outside classes** — arrow functions bind `this` lexically.
   Out-of-class `this` is banned; out-of-class `function` is fine.
4. **Method chains that return `this` for fluent APIs** are fine; don't chain
   across modules.

### Control flow and expressions

1. **`for (const of)` over `for i in`**; `forEach` when the body is small; keep
   explicit loops when the body is large or needs early return.
2. **`switch` over chains of if/else on one value**, with `default` + `never`
   narrowing; TypeScript narrows union types in `switch`.
3. **No `==`/`!=`.** `===`/`!==` always; `== null` is allowed as the only
   exception (catches null *and* undefined in one check).
4. `let` reassignments and `var` — `var` is banned; `let` only when a
   reassignment is real, else `const`.
4. **No `with`/`eval`/`ecmaVersion` tricks.**
5. JS features Google bans: `prototype` mutation, `delete` on arrays,
   **`delete` allowed only on records whose shape allows absence**.

## Null and undefined

- **`!` (non-null assertion) requires justification** — it is an unchecked
  narrowing; treat like `as`. The drop-in's `no-non-null-assertion` keeps it
  typescript-eslint's default severity.
- **Prefer optional chaining/`??` over `&&`-chains** (`a?.b?.c`, `x ?? "default"`). The `a?.b as T` hazard: `a?.b as T` parses as `(a?.b) as T` — use
  parentheses or a guard.
  The `a?.b c?.d` hazard above also means `a?.b?.c`. Optional chains over
  optional fields: `a?.b?.c`, and `a?.b?.c` text is hard to read — limit to 2-3
  chains per expression.
- **`T | undefined` beats optional fields** (absence becomes a value), while
 `foo?: T` stays for wire shapes where the key's absence is the meaning.
- `??` vs `||`: `||` collapses `""`/`0` falsiness — `??` is the default merge
  nullish only. `||` only where falsiness *is* the meaning (defaults for
  strings/numbers where `""`/`0` are invalid anyway).

## Types at boundaries

1. **Any cross-boundary data gets parsed once** (Zod at trust boundaries — the
   outside world can send anything) "type the edge, trust the inside".
2. Google requires **explicit types on exported items (return types + field
   types)**; the skill carries it as `explicit-module-boundary-types` and
   lint-rule for exports only.
3. **Don't leak third-party types into your public API**; if a dependency type
   must appear, re-export it so callers can name the matching version.

## Dependencies and ecosystem

1. Use **package subpath imports (`#shared/*`)** as the import law; `#gen/*`
   only from the http adapters.
2. **Prettier owns formatting** (the guide's chapter on formatting is subsumed;
   `make fmt-check` in the backend-node skeleton).

# Types & declarations

1. **Don't put derivable constraints on struct definitions**; bounds belong on
   the impl/generic functions that need them (`function f<T extends Foo>(..)`).
2. **`declare` blocks (`declare module "fastify"**`) for the typed augmentations
   (`FastifyRequest.identity`) that the request lifecycle relies on.

# Types & declarations — the short version

This digest kept the guide's structure: Source files, Naming, Language features
(prefers/avoids), Null and undefined, Types at boundaries, Dependencies. Items
remain falsifiable: a reviewer can cite "Google TS guide: no `const enum`" or
"Google TS guide: `!` needs justification" in review.

## Why these condensed items

Each condensed item above compresses one or a few guide sections; none
fabricates a quote. When two sources disagree (e.g. Google allows enums,
Effective TypeScript advises unions as default), the skill text says which way
the skill resolves it.