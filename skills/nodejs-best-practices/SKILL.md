---
name: nodejs-best-practices
description: >-
  Write idiomatic, robust, maintainable Node.js + TypeScript. Use this skill whenever you
  write, review, refactor, debug, or explain Node.js or TypeScript code: new modules,
  Fastify routes and plugins, Zod schemas, Drizzle schemas and migrations, BullMQ workers,
  tsyringe wiring, pg queries, Pino loggers, tsconfig or eslint config, or tests. Trigger
  on any mention of Node.js, node, TypeScript, .ts files, tsc, tsconfig, eslint, fastify,
  zod, drizzle, drizzle-orm, pg, bullmq, pino, tsyringe, or the Node.js event loop, even
  when the user just says "fix this route" or "add a queue" and never says "best
  practices" or "idiomatic". Synthesized from the Google TypeScript Style Guide, Effective
  TypeScript, Node.js Best Practices, TypeScript Deep Dive, and the facta backend-node
  handbook.
---

# Node.js best practices

Distilled from five TypeScript and Node.js style and design guides, with a digest of
each in `references/`. Where they disagree, this file says which to follow and why.

## 1. Mindset

- **Write TypeScript-shaped code.** Don't write Python, Go, Java, or C# in TS syntax.
  Model error outcomes with discriminated unions, absence with `T | null` / `T |
  undefined` chosen on purpose, polymorphism with interfaces and structural typing, and
  configuration with plain objects typed at one place. Class hierarchies that only fake
  inheritance, `Service`/`Manager` types, and getters that just forward fields are smells.
- **Make invalid states unrepresentable.** Push invariants into types: discriminated
  unions instead of boolean fields and "mode is set when X" comments, branded newtypes
  for ids and units (`type UserId = string & { __brand: "UserId" }`), Zod parsing at the
  edge that validates once and types forever. Then `tsc` enforces what a comment only
  requests.
- **Application code is not library code.** Library code (anything exported to other
  packages) follows the API-design rules below strictly: explicit return types, no
  default exports, `unknown` at the boundary. Application code favors directness:
  concrete types, plain objects, the stack's framework types.
- **Let the tools do the work.** Prettier owns formatting, ESLint owns idiom and
  architecture checks, `tsc` + `noUncheckedIndexedAccess` own most of "did I check
  that". Spend your attention on design.

## 2. Before you hand back code

Run these and fix everything they report:

```bash
npx tsc --noEmit
npx eslint .
npx vitest run
```

- Fix a lint rather than silencing it. When one is genuinely wrong for one line, put
  `@ts-expect-error` (for a type error) on the narrowest line with a reason:
  `// @ts-expect-error the vendor's types omit the field they added in 3.4`. Never write
  `@ts-ignore`, `@ts-nocheck`, or a blanket `eslint-disable` — an expect-error that stops
  being needed turns into a compile error, a stale suppression cleans itself up.
- Lint config lives once, in `eslint.config.mjs`, and type config in `tsconfig.json` —
  not with per-line suppressions. If a project has none, suggest the BeautifulNodeJS
  drop-in at `lints/eslint.config.mjs` of
  https://github.com/Facta-Dev/beautifulnodejs; it carries the architecture rules
  from §10 as `no-restricted-imports` groups.
- Group the three commands in CI so a regression fails the build, not code review.

## 3. Types and API design

Turn the strict set on once in `tsconfig.json` and never revisit it:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

- **`unknown` over `any`.** `any` disables checking for everything it touches; `unknown`
  forces one narrowing at the edge. `as any` and `as unknown as X` are lint-level
  findings, not fixes.
- **Discriminated unions instead of booleans and option bags.** A `status: "draft" | "sent" | "failed"` cannot hold two things at once; a pair of booleans can. Give every
  variant a literal `kind`/`status` field and narrow with `switch`. Make switches
  exhaustive: add `satisfies never` (or a `default: const _x: never = rest` arm) so a
  new variant is a compile error, not a silent no-op.
- **Branded ids.** `UserId`, `OrderId` are not interchangeable strings. Declare `type
  UserId = string & { readonly __brand: "UserId" }` and construct them in one place.
  Don't brand objects that must round-trip JSON without a parse step.
- **`readonly` where the type cooperates.** `readonly` fields, `ReadonlyArray<T>` for
  data a callee must not mutate, and `as const` for literal tables.
- **Accept interfaces, return concrete types** for consumer-facing functions. Callers
  shouldn't be pinned to your implementation's parameter shape; they should get back a
  type they can use.

```ts
// A result shape whose failure is a value, not a thrown string.
type ParseResult<T> = { ok: true; value: T } | { ok: false; kind: ParseErrorKind };

type ParseErrorKind = "Empty" | "OutOfRange" | "Malformed";

function parseCount(input: string): ParseResult<number> {
  const n = Number(input);
  if (input.trim() === "") return { ok: false, kind: "Empty" };
  if (!Number.isInteger(n) || n < 0) return { ok: false, kind: "OutOfRange" };
  return { ok: true, value: n };
}
```

- **Explicit return types on every export.** Inference is great inside a function body
  and a liability at a module boundary: an accidental `async` or a refactor silently
  changes your public types. `function parseCount(input: string): ParseResult<number>`,
  not an inferred shape.
- **Narrow with type guards**, not casts: `typeof x === "string"`, `in` checks on
  discriminated unions, custom `x is Foo` guards over `x as Foo`.
- **No default exports in library code.** Named exports keep grep working and make the
  refactoring story honest. (An entrypoint like `src/bin/api.ts` may default-export.)
- Naming: types `PascalCase`, functions and locals `camelCase`, constants
  `SCREAMING_SNAKE_CASE`, files `kebab-case` or the slice names below. No weasel
  suffixes `Service`, `Manager`, `Util`, `Helper`, `Handler` — name what it is
  (`Signup`, `NotificationDispatcher`, `OutboxPoller`).
- **No boolean parameters.** `sendMail(true)` is unreadable at the call site and cannot
  grow a third mode: use a two-variant union (`{ mode: "Draft" }`), an options object
  with a named field, or two functions (`sendMail()`, `sendMailVerified()`).
- Don't pollute the domain with single-implementation interfaces for the sake of it;
  interfaces exist where a port or an adapter swap is real (§10), not as a ceremony.

## 4. Async and the event loop

- **Never block the loop.** On any request path: no `fs.readFileSync`/`*
Sync`, no crypto or zlib sync forms, no `JSON.parse` of a giant payload, no heavy math
  loops. Sync calls block every concurrent request. Move CPU-bound work to a BullMQ
  queue (§6) or `worker_threads`, and read files with the promise APIs.
- **`@typescript-eslint/no-floating-promises` and `no-misused-promises` are hard
  rules**; the drop-in config carries them. Every promise is `await`ed, `void`ed with a
  stated reason, or `.catch`ed. A thrown error inside a floating promise is an
  `unhandledRejection`, which by default kills the process in modern runtimes.
- **Every external call gets a timeout or an `AbortSignal`** — HTTP client requests, DB
  queries (via pool `statement_timeout`), queue `.waitUntil`s. A missing timeout turns
  one slow dependency into a wedged server.
- **Bounded `Promise.all`**, not unbounded fan-out over a user-sized array: chunk with
  a helper or use `p-limit` style bounded maps. Unbounded fan-out exhausts sockets,
  pools, and remote rate limits at once.
- An async Fastify handler either returns a value or awaits everything; never both on
  one path. Fastify awaits the returned promise, so a handler that starts work but
  returns early loses errors.

```ts
// Bounded concurrency: map 500 ids with 20 in flight, errors carry the id.
async function warm(ids: readonly string[], limit: number): Promise<void> {
  const queue = [...ids];
  const workers = Array.from({ length: limit }, async () => {
    for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
      await warmOne(id);
    }
  });
  await Promise.all(workers);
}

async function warmOne(id: string): Promise<void> { /* fetch + cache write */ }
```

## 5. Errors and failure modes

One error envelope, decided once, per the backend-node template (read
`references/backend-node-stack.md` for the full shape):

- **The handler's error path writes the envelope once.** One `app.setErrorHandler` (plus
  `setNotFoundHandler`) at the composition root renders every non-2xx body as
  `{"detail": string, "code": STABLE_CODE}`. A route that writes its own error JSON is a
  second envelope — a Must-fix, not a style difference.
- **Domain errors are typed values, never bare strings.** Thrown strings have no type
  for `catch` to narrow on. Use a discriminated `AppError` carrying a stable `code`,
  or a `Result`-style union per §3. `catch` blocks match on `error.code`, never on
  `error.message.includes(...)`.
- **Adapters map foreign errors once, inward.** pg/Drizzle errors become domain errors
  inside the adapter (pg's `23505` unique_violation → `EMAIL_TAKEN`); the use case
  throws and the handler renders. Mapping in two places, or string-matching messages in
  a use case, means the envelope's contracts live in nobody's file.
- **No try/catch that swallows.** `catch {}`, `catch (e) {}`, and `catch (e) { return
  null; }` without logging/re-throwing hide real failures. If ignoring is correct, say
  so with a comment or log it.
- **Never leak internals**: stack traces, SQL, pool URLs, or `err.message` for 5xx go to
  the logs, not the response — 5xx answers the generic `INTERNAL_ERROR` envelope.
- **Process-level handlers log and shut down.** `unhandledRejection` and
  `uncaughtException` (via `process.on`) log with the full error and then exit
  non-zero/gracefully — they are never left as no-ops to "keep the server up" while the
  process is in an unknown state.

```ts
// The one error-shape contract: every boundary carries a stable code, and the
// handler's error path renders the envelope exactly once.
export interface AppError {
  code: string; // stable, API contract — e.g. "AUTH_EMAIL_TAKEN"
  detail: string;
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === "object" && value !== null && "code" in value &&
    typeof (value as { code: unknown }).code === "string" && "detail" in value
  );
}

export function envelope(err: AppError): { detail: string; code: string } {
  return { detail: err.detail, code: err.code };
}
```

## 6. Concurrency, queues, and durable work

- **Durable side effects go through BullMQ + Redis, never an in-process timer.** A
  `setTimeout`, an in-memory array, or a spawned child process dies with the process and
  loses the work; a BullMQ job survives restarts and retries. The difference is stated
  at the call site: if the effect must survive a crash (email, billing, webhooks), it is
  a queue job; a `setTimeout` is allowed only for effects that are allowed to vanish.
- **Outbox-worker pattern** for "state change + side effect must both happen": write the
  state change and an outbox row in the same DB transaction; a BullMQ (or polling)
  worker relays outbox rows into the queue. Never enqueue a job whose DB write failed,
  and never commit a DB change whose job enqueue failed.
- **Consumers are idempotent, keyed on a job id.** BullMQ retries by default; a job
  that runs twice must not double-send. Keep the idempotency key in the job data and
  check-before-act (or upsert) inside the processor.
- Retries use capped exponential backoff (`attempts` + `backoff: { type: "exponential" }`
  with a ceiling), and poison jobs (failures that can never succeed) move to a
  dead-letter queue after N attempts — visible in metrics, never silently dropped.
- **Redis is a dependency to degrade without, not a datastore of record.** The database
  owns the truth (outbox rows); Redis holds the queue. If Redis is down, enqueueing
  degrades but committed data is safe — which is exactly why the outbox row, not the
  BullMQ job, is the durability boundary.
- Prefer the platform's native concurrency before adding libraries: Promises and
  built-in `AbortController`/`AsyncLocalStorage` cover most "coroutine" wants.

```ts
// Outbox shapes — the DB row, not the queue job, is what must not be lost.
interface OutboxRow {
  readonly id: string;
  readonly topic: "email.verification" | "billing.invoice";
  readonly payload: unknown;
  readonly attempts: number;
  readonly deadLettered: boolean;
}
```

## 7. Persistence

- **Drizzle ORM**, with schema and migrations paired per slice: a slice owns its tables
  and its migration files, named and ordered so code review can pair them. A schema
  change without its migration (or vice versa) never ships.
- **pg + pg-pool behind PgBouncer.** Size the app's pool for PgBouncer, not Postgres —
  total connections across replicas must stay under PgBouncer's pool; a per-process
  pool of 50 × 8 replicas is an outage waiting for a deploy.
- **Transactions scope inside the use case** and never hold across I/O outside the DB:
  open a transaction, do the reads/writes, commit. A transaction held across an HTTP
  call or queue wait starves the pool.
- **Parameterized queries only.** Drizzle builds them; hand-written SQL uses `sql`
  templates with placeholders, never string concatenation. "It's an internal id, not
  user input" is not a justification — inputs rotate.
- One pool instance per process, created in the composition root; adapters receive it.
  Pools, Redis clients, and HTTP connections are opened once and closed on shutdown
  (`pool.end()` in the SIGTERM path).

## 8. Logging and observability

- **Structured logging only via Pino; `console.log` is forbidden** everywhere except a
  CLI's own stdout output. JSON lines keep log aggregation queryable; `console.log` of
  template strings loses fields at exactly the moment you need them.
- **Child loggers carry request context**: one `requestId` (and `trace_id`) on every
  line of a request. Create a child logger (`logger.child({ requestId })`) at the edge
  and pass it down — or keep trace context in `AsyncLocalStorage` and let the transport
  add it per line.
- **OpenTelemetry spans at the edges**: Fastify instrumentation, queue processors, DB
  drivers. One `trace_id` propagated across HTTP → queue → DB, so a slow request follows
  end to end. Spans wrap the edges; the domain never opens spans.
- **Prometheus metrics at the boundary** (a route/queue/DB hook), not sprinkled inside
  the domain. Domain code returns values and throws typed errors; it does not observe
  itself.
- Log at the boundary where context exists; throw rather than log-and-rethrow (double
  logging the same failure is worse than none). Secrets never enter logs — scrub once,
  at the env/config parse.

## 9. Dependency injection and modules

- **tsyringe tokens** for anything a slice receives rather than constructs. Use
  injection tokens (`const STORE = Symbol("Store")`, or typed `InjectionKey<number>`
  styled tokens) as the registration keys, so a rename is type-checked instead of a
  string hunt.
- **`register*()` per slice**, in each slice's `module.ts` — the slice's whole wiring
  contract is one function the root calls with `Deps`.
- **One composition root** (`src/bin/api.ts`, `src/bin/worker.ts`) resolves everything:
  it builds the concrete adapters, registers them, validates config once, and starts.
  No `resolve()` or `container.register` inside slices — a second wiring site means
  nobody knows what's live.
- **Dependencies point inward**: the root names the slices; a slice names its ports and
  domain. Nothing names the root (§10).

## 10. Architecture contract (the backend-node stack)

Backend repos on the Fastify/TypeScript/Postgres stack follow the facta backend-node
layout: hexagonal ports-and-adapters plus vertical slices, with TS strict and
eslint `no-restricted-imports` as the enforcement.

The contracts below are **unbreakable and non-waivable**: developers cannot opt out, and neither can you. When a gate fires, the fix is to re-cut the layout — never to weaken or delete the lints, and never to silence it with `eslint-disable` or `@ts-expect-error`.
Review treats a broken contract as an automatic Must fix (see `nodejs-review`).

- **Dependencies point inward, only**: composition root (`src/bin/api.ts`,
  `src/bin/worker.ts`) -> slices (`src/features/<slice>` use cases and adapters) ->
  `ports.ts` (interfaces) -> `domain.ts`. Never the reverse. Nothing imports `src/bin/*`.
- **The domain is zero-I/O.** `domain.ts` MUST NOT import `fastify`, `zod`, `tsyringe`,
  `reflect-metadata`, `drizzle-orm`, `pg`, `bullmq`, `ioredis`, `pino`, `prom-client`,
  or `@opentelemetry/*` — not even for one helper. It imports Node's own modules and
  `#shared/*` and nothing else.
- **Slices don't import each other.** A new feature is a new slice; shared behavior
  moves down into `#shared` (or `src/platform/`) or sideways into a port the consumer
  defines — never sideways between sibling slice files. `src/features/*` files never
  import `#features/*`.
- **Ports are interfaces defined where they're consumed.** The use case writes the
  interface in its own `ports.ts`, shaped to its needs; it stores the port as its field
  type and never constructs or imports a concrete adapter. Adapters implement the port
  structurally and are the only place `pg`/`drizzle-orm`/queue clients appear.
- **One error envelope** (§5): written once by the root's error path; adapters map
  driver errors inward once.
- **Structured logging via Pino only** (§8); durable work only via the BullMQ outbox
  pattern (§6); config is read and validated once at startup by the composition root —
  no env reads after boot.
- Every feature change starts by naming its slice; if you can't say which slice a file
  belongs to, stop and re-cut the layout.

The machine-checkable half lives in `no-restricted-imports` groups (the BeautifulNodeJS
drop-in at `lints/eslint.config.mjs`; the project's own `eslint.config.mjs` carries the
same groups):

```js
// Group 1: the domain is I/O-free.
"no-restricted-imports": ["error", { paths: [
  "fastify", "zod", "tsyringe", "reflect-metadata", "drizzle-orm", "pg",
  "bullmq", "ioredis", "pino", "prom-client",
], patterns: [
  { group: ["@opentelemetry/*", "drizzle-orm/*", "pg/*", "bullmq/*", "ioredis/*", "pino/*"],
    message: "The domain is I/O-free: it never imports fastify, zod, tsyringe, drizzle-orm, pg, bullmq, ioredis, pino, prom-client, or @opentelemetry/*. Define a port instead — see the nodejs-best-practices skill." },
]}]
// Group 2: slices don't import each other (same rule, files: ["src/features/**/*.ts"],
// patterns: [{ group: ["#features/*"], message: "Slices do not import each other." }])
// Group 3: use cases depend on ports and the domain, not adapters/HTTP/queue/DI.
```

```ts
// src/features/notifications/ports.ts — the interface the USE CASE needs, written by it
import type { Notification } from "./domain.js";

export interface NotificationStore {
  save(n: Notification): Promise<void>;
  listForUser(userId: string): Promise<readonly Notification[]>;
}

// src/features/notifications/usecase.ts — the port is the field type, never an adapter
export class Notifications {
  constructor(private readonly store: NotificationStore) {}

  async queue(userId: string, subject: string): Promise<void> {
    await this.store.save({ kind: "Pending", userId, subject });
  }
}

// src/features/notifications/postgres.ts — the adapter satisfies it structurally and
// is the only file in the slice that touches pg/Drizzle; errors map inward here.

// FORBIDDEN shape — this compiles, because TS only rejects cycles, never direction:
//   constructor(private readonly store: PgNotificationStore) {}
// Nothing here can machine-check it: the usecase override bans mechanism
// packages (pg, drizzle-orm, bullmq, pino, tsyringe), and a same-slice
// adapter import must come through the port type — a shape only review (and
// tests) can see. The port stays the field type.

// src/features/notifications/module.ts — wired once, by the composition root only
// export const registerNotifications = (app: FastifyInstance, d: Deps): void => {
//   const uc = new Notifications(d.store);
//   app.get("/api/v1/notifications", h.list(uc));
// };
```

When the code imports `fastify`/`drizzle-orm`/`pg`, or runs on the Node.js event loop,
read `references/backend-node-stack.md` first: some general rules above do not apply to
what the framework already handles (schema-to-type inference, `setErrorHandler`,
request ids), and the stack has its own set of quiet failure modes that pass every lint
in this config.

## 11. Tests

- **Table-driven tests with Vitest**: one behavior per test, its inputs as case rows
  (`it.each([...])`), so adding a case is adding a row, not a copy-pasted `it`.
- **Tests beside the code they cover** (`usecase.test.ts` next to `usecase.ts`), like
  the slice's other files. A separate `test/acceptance` lane wires fakes through the
  real `register*` for the whole app.
- **Fake adapters implement ports** — roughly ten lines each — in place of in-memory
  reimplementations, never a real `pg`/`bullmq`/Redis.
- **No wall-clock dependence**: inject dates, clocks, and intervals as values
  (`Date.now()` behind an injectable `Clock`). Tests that sleep are flaky; tests that
  read the real clock are non-deterministic.
- **Tests never touch real Redis/Postgres.** Unit tests fake the ports; integration
  lanes (if any) spin Postgres up themselves (e.g. testcontainers) and are flagged.
- Write a failing test before fixing a bug; assert with context
  (`expect(got).toStrictEqual(want)` is the fixture contract, not `toBe` on object
  identity).

## 12. Documentation and comments

- Docs (`README`, digest, reference — any prose file you produce) open with a first
  sentence that says what the thing *is*, not what it will do for you.
- JSDoc on exported items: a one-line summary first (it becomes hover text and docs),
  then parameters/failure modes only where the signature can't say them.
- `//` comments explain why, not what. `// parse once at boot, safeParse throws with the
  field path` says something; `// parse config` restates the line.
- Document failure modes: a throw list on exported functions whose errors callers must
  handle, the retry/dead-letter policy on exported queue workers.

## 13. Final checklist

Before returning Node.js/TypeScript code, confirm:

- `npx tsc --noEmit` and `npx eslint .` are clean; no `console.log` on a request path.
- No floating promises; every external call has a timeout or `AbortSignal`.
- Every exported function has an explicit return type; no `any` in shipped types.
- No boolean parameters; modes are discriminated unions.
- The domain imports nothing (no fastify/zod/tsyringe/drizzle-orm/pg/bullmq/pino/
  @opentelemetry); ports are stored as field types, not adapters.
- Errors are typed, mapped once in adapters, and rendered once by the error envelope.
- Durable work rides BullMQ (outbox where a DB write must match); consumers idempotent.
- Schema and migrations are paired; queries are parameterized; the transaction doesn't
  span non-DB I/O.
- Logs are Pino JSON with request context; metrics and spans sit at the edges.
- Tests are table-driven where the behavior repeats, fake ports instead of real
  backends, and depend on no real clock.

## References

Read these when you need the reasoning behind a rule or a complete checklist for a task.
Each is a condensed digest of one source.

- `references/google-typescript-style-guide.md`
  (https://google.github.io/styleguide/tsguide.html): naming, formatting, which
  language features to prefer and avoid; application-vs-library posture.
- `references/effective-typescript.md` (https://effectivetypescript.com): choosing
  between alternatives — `interface` vs `type`, narrowing tactics, `any` management,
  declaring types that don't allow invalid states, dependency policy.
- `references/nodejs-best-practices.md`
  (https://github.com/goldbergyoni/nodebestpractices): project structure, error
  handling postures, testing and production readiness checklists.
- `references/typescript-deep-dive.md` (https://basarat.gitbook.io/typescript): the
  type-system mechanics — narrowing, literals, discriminants, generics, ambient
  declarations.
- `references/backend-node-stack.md` (the facta `templates/backend-node` stack): read
  first if the repo is hexagonal + vertical-slicing Fastify/Drizzle — the slice file
  set, the allowed/forbidden import edges, the error envelope, what the framework
  already handles, and the quiet failure modes.