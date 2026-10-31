# Backend Node stack (digest)

Source: the facta `package_builder/templates/backend-node` handbook
(`README.md` + `docs/00`–`14` at
`/Users/carolinafogliato/Github/facta/package_builder/templates/backend-node`),
read as architecture conventions; the enforced stack is Fastify + TypeScript
strict + Zod + tsyringe + pg/pg-pool + Drizzle ORM + PgBouncer + BullMQ +
Pino + OpenTelemetry/Prometheus + PM2/Kubernetes. Read this *first* whenever the
repo is hexagonal + vertical-slicing Fastify/Drizzle — it lists the slice file
set, the import law the lints encode, the error envelope, what the framework
already handles, and the quiet failure modes that pass every general lint.

## The slice, file by file

A slice is a capability, not a table. Same file set per slice, always — "where
does X live?" is answerable by file kind, never by grep:

```
src/features/<slice>/
├── domain.ts       pure types + rules + errors (imports #shared/* only)
├── ports.ts        the interfaces this slice consumes (consumer-defined)
├── usecase.ts      orchestration: rules first, I/O last
├── http.ts         Fastify adapter: decode (zod), call the use case, encode
├── postgres.ts     Pool/Drizzle-backed adapter over this slice's queries
├── queries.ts      per-slice typed queries (the sqlc analog)
├── usecase.test.ts unit tests beside the code they cover
└── module.ts       register*(app, Deps) — the wiring contract
8 files, one capability, zero sideways imports.
```

## The dependency law (doc 04)

**Source-code dependencies only point toward more-stable code.** Outer names
inner, inner never names outer. ES modules tolerate cycles; the linter — not
the module system — is the enforcement point for the interesting edges
(file-level within one tree, invisible to package tooling):

| From | To | OK? |
|---|---|---|
| src/bin/* (composition roots) | any internal module | yes — the roots know everything |
| feature http/postgres/module | own slice's files, `#platform/*`, `#shared/*` | yes |
| usecase.ts | ports.ts, domain.ts | yes |
| ports.ts | domain.ts | yes |
| domain.ts | node stdlib, `#shared/*` | yes |
| feature postgres.ts | pg, own `queries.ts` | yes |
| anything internal | `#gen/*` | only http adapters to `#gen/api` |
| src/platform/* | `#shared/*`, stdlib, pg | yes (never features) |

Forbidden edges: `domain.ts` → fastify/pg/kysely/any adapter (zero-I/O wall);
`usecase.ts` → fastify/pg (mechanism names belong to adapters); any
`src/features/*` file → another slice's files; `src/platform/**` → `#features/*`
(platform serves, never consumes); anything → `src/bin/**` (nothing depends on
the root); adapters → `#gen/api` models outside `http.ts` (wire types stop at
the edge). Note on stack: this repo's stack mandates *Drizzle* where the
template text says Kysely — same role (typed queries per slice), same law.

Stacked enforcement, in order:
1. eslint file-level law: the project's `eslint.config.mjs` carries the
   `no-restricted-imports` groups (the BeautifulNodeJS drop-in at
   `lints/eslint.config.mjs` of the repo is a drop-in copy);
   `make ci` fails red on a violating edge.
2. tsc (`make vet`, `tsc --noEmit`) — a wrong-shaped edge that still type-checks
   is eslint's catch.
3. Generated-code hygiene (`make generate`/`gen-check` committed code).
4. Review — the "depends on the interface but reaches for the adapter" smell,
   which is a constructor argument, not an import: eslint can't see it.
5. Migrations never run at startup: `make migrate` is a deploy step you control.

## Hexagonal parts (doc 01)

- **Domain** (`domain.ts`): types, invariants, errors — pure TS, `#shared/*`
  only, imports nothing else.
- **Ports**: interfaces **defined by the consumer** (the use case) in
  `ports.ts`, a few methods, shaped to the consumer's needs — not "the
  repository interface next to the adapter". No consumer, no port (TS YAGNI).
- **Adapters**: implement a port structurally; slice-local ones live in the
  slice (`postgres.ts`), platform-wide ones in `src/platform/`. Wired nowhere
  but the composition root, via each slice's `register*(app, Deps)`.
- **Driving vs driven**: HTTP handlers and the WS handler are driving adapters
  (the world calls us — `http.ts`); Postgres, mail queue, hub, clock are driven
  adapters (`postgres.ts`, platform packages). Unit tests fake the driven side.

## Vertical slicing (doc 02)

- One slice ≈ one bounded feature (a group of use cases over one aggregation).
  When a slice's `domain.ts` passes ~200 lines, that's two features sharing a
  directory — split by behavior, not file count.
- Slices never import each other: shared capability is *duplicated through a
  port* or *promoted into `#shared`/`platform/`*, never an import.
- Adding a slice = mkdir + the eight files + paired migration + wire in
  `src/bin/api.ts` + `make ci`. If adding a slice edits three files outside
  `src/features/` and `src/bin/`, the template regressed.

## Request lifecycle (doc 07)

- Routes are declared in each slice's `module.ts` (`register*`); the
  composition root owns the hook chain: request-id → security headers → CORS →
  auth (`preHandler` arrays for route guards).
- `http.ts` validates at the trust boundary (zod) because the domain must not
  trust wire data; `domain.ts` re-checks invariants because adapters and tests
  call it directly.
- Identity travels as typed module augmentation (`req.identity`); use cases
  never re-parse tokens and never see `FastifyRequest` — the handler passes the
  parsed input struct.
- WS/SSE aside: streaming endpoints unbind hub subscriptions on disconnect (the
  disconnect is the cancellation) and never hold DB rows while streaming.
- The worker's lifecycle: `src/bin/worker.ts` runs the outbox loop + janitor
  loops on one `AbortController`, stopping on SIGTERM/SIGINT through one
  signal; the outbox worker's claim → send → retry/dead-letter progression is
  the worker's structured line at each status change.

## Error envelope (doc 10)

- Every non-2xx body is `{"detail": string, "code": STABLE_CODE}`; stable codes
  are constants in `#shared/apperr`; the error handler at the root
  (`app.setErrorHandler` + not-found) is the only writer. Grep `"detail"` and
  you find one definition (`platform/httpx.ts`), one writer.
- Adapters map mechanism errors inward once (pg `23505` → `EMAIL_TAKEN` in
  `postgres.ts`); use cases throw `AppError` or map thrown values through
  `apperr.from()`; use cases match on `code`, never on messages.
- 5xx answers the generic `INTERNAL_ERROR` envelope; the stack is logged once,
  there; a 413 body becomes a 400 Validation envelope. Client code keys on the
  code, not the message.
- Config: zod-parsed once at boot at each root, fails closed (unknown shapes,
  bad durations, weak secrets throw at boot with the field path); secrets never
  in files; placeholder-guarded.

## Observability (doc 10)

- The fastify logger (pino, JSON) is the only logging dependency; the
  request-id hook mints/propagates `x-request-id` and echoes it on responses;
  each request's lines carry the request id. Log at the boundary where context
  exists; throw rather than log-and-rethrow.
- Ship-time gates: `/healthz` (no external calls), `/readyz` (`SELECT 1` via
  the pool, 2s timeout, 503 `{degraded}` on failure — the deploy-signal
  surface, since schema drift shows up here loudly).
- The template deliberately cuts OpenTelemetry to keep the dependency surface
  minimal; the seams are documented (request-scoped context is real, fastify
  owns the chain head, platform owns the I/O wrappers). This repo's stack adds
  OTel at those seams: fastify instrumentation at the root, pg pool hook,
  queue processor spans — no slice code changes, no spans in the domain.

## Skeleton facts (doc 13)

- `package.json`: `"type": "module", engines >= 24`, pinned packageManager;
  the `"imports"` map (`#shared/*`, `#platform/*`, `#features/*`, `#gen/*`) is
  the import law's surface; own-slice files import relatively (`./x.js`).
- Composition roots are one function each: config → pool → platform → each
  slice's `register*` → outbox worker on its own `AbortController` → listen;
  SIGTERM/SIGINT run `stop()`: abort the worker, `app.close()`, `pool.end()`.
- Shipped slices are seven; delete the `widgets` example and the rename is
  done. `Specs/features/*.feature` ride beside slices.

## Quiet failure modes (pass every general lint)

- A pool sized for Postgres, not PgBouncer (total connections across replicas
  exceed PgBouncer's pool at deploy time). Size for PgBouncer.
- A transaction held across an HTTP call or queue wait starves the pool.
- Enqueue-only (job enqueued, DB write failed) or commit-only (DB written, job
  lost) — the outbox row in the same transaction is the fix (skill §6).
- Migration-vs-code drift: migrations never run at startup, so drift surfaces
  at `/readyz`, loudly.
- `pg` unique-violation mappings in two places, or message matching in a use
  case — the stable codes live in nobody's file.
- A second error-envelope writer (a route writing its own error JSON) — keying
  on messages instead of codes.
- Console.log on the request path; log-and-rethrow double-logging.
- Console.* in platform/ loops: bounded and structured only where the doc
  allows it (the worker entrypoint's own output).
- Streaming endpoints holding DB rows while streaming, or missing teardown on
  disconnect.

## See also

- The skill's §10 architecture contract: the restrictive half of this digest,
  with the lints.
- The eval `evals/refactor-notifications-slice/` — a scaffold where the
  contracts above are violated and the fix is to re-cut the layout.