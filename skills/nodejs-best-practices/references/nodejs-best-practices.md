# Node.js Best Practices (digest)

Source: *Node.js Best Practices* by Yoni Goldberg et al., maintained live at
https://github.com/goldbergyoni/nodebestpractices . The most-starred Node.js
repository of practice advice, organized as click-to-expand bullet lists under
six sections. Read this when you need the production-readiness logic behind a
rule: error postures, queue patterns, release/ops gates, security hardening.

## Project structure practices

1. **Structure your solution by components, not layers.** The template's slice
   (`src/features/<slice>/`) is the component: domain → ports → use case →
   adapters in one directory, zero horizontal `helpers`/`utils` god-dirs. A
   feature change touching five trees is a structure smell.
2. **One file-set per component, always** — "where does X live?" answerable by
   file kind, never by grep.
3. **Wrap common utilities into npm packages** only when two or more slices
   keep reaching for them; otherwise promote into `#shared`.

## Error handling practices

4. **Use four error handling mechanisms, each in its lane**: errors thrown (sync
   paths), async callbacks, promises rejected, `EventEmitter` error events —
   and know which lane each API is in.
5. **Operational vs programmer errors.** Operational (DB down, bad input,
   timeout) get a typed error, retry policy, and a rendered status; programmer
   errors (bug) mean stop-the-process — crash and restart, don't try to
   continue in an unknown state.
 distinguish errors by class/kind, not by message string.
7. **Distinguish errors by class/code, not message string.** `error.code`
   matching, never `message.includes(...)` in conditional logic.
8. **No `try/catch` that swallows; no empty catch.** If ignoring is correct,
   say why in a comment, and/or log once.
9. **Log minimal, structured, contextual errors** — one log per error with the
   structured fields a responder needs, then throw/render once.
10. **Fail fast on unhandledRejection/uncaughtException: log and exit.** A
    process that continues in an unknown state is worse than a restarted one
    (orchestrator restarts it). `process.on(...)` no-op handlers "to keep the
    server up" are a Must-fix.
11. **Wrap handlers with the framework's recovery point** — Fastify's error
    handler is the recovery point; a 5xx answers the generic `INTERNAL_ERROR`
    envelope; internals leak into neither.
12. **Operational errors say what failed and what to do**; messages carry path,
    id, and value context so a responder starts from data, not re-guessing.

## Code style practices (the subset relevant to services)

13. **Use `===`; `var` banned, `const` by default.**
14. **Getters without `get` prefix** — name the value.
15. **No template-string building of SQL or commands; parameterize.**
16. **Use ESLint as the style + architecture lane** — static analysis catches
    the interesting classes (floating promises, domain imports) that review
    can't scale to.

## Testing practices

17. **The test pyramid: unit > integration > e2e, mostly unit.** The template's
    unit lanes run with fakes, no DB; integration lanes flag themselves.
18. **Include blue-green/contract checks in CI: three-tier gates.** CI runs
    fmt-check, tsc, eslint, tests as separate lanes that can fail separately.
19. nodebestpractices' "test with a real DB" advice maps here: integration
    lanes spin Postgres themselves (testcontainers), never the dev's machine.
20. **Include the ported/legacy tests' behavior in the porting notes** when a
    migration happens; keep behavior parity, flag quirks.

## Going to production

21. **Graceful shutdown: on SIGTERM, stop accepting, finish work, close pools
    and stop loops.** A dangling `listen` after SIGTERM loses in-flight
    requests on deploy.
22. **Graceful shutdown is explicit — `app.close()`, `pool.end()` in the
    signal path.**
23. **Dependency injection via the factory function pattern** — construct
    dependencies once at the root (the composition root), pass into slices; the
    DI container is the only wiring site, so wiring is reviewable in one file.
24. **Stateless services, scale horizontally, `cluster`/PM2/Kubernetes.**
    No in-process state that a redeploy would lose (beyond the outbox row /
    queue job) — durable state lives in Postgres + Redis, not RAM.
25. production process manager (PM2/Kubernetes) restarts; **statelessness is
    the precondition.**
26. **Fail fast on config: validate once at boot.** A mistyped env key fails in
    200ms at boot, not at first use on a busy Friday.
27. **Be structured: log JSON, not template strings** — Pino for services;
    `console.log` only in a CLI's stdout.
28. production logging guidance: **log at the boundary where context exists;
    throw rather than log-and-rethrow.**
29. **Measure everything at the boundary: readiness/liveness endpoints**
    (`/healthz` no external calls; `/readyz` checks the pool with a 2s timeout)
    and boundary metrics.
30. `console.log` of huge objects (`console.log(bigObject)` of a request body)
    blocks and floods; structured fields instead. Also: don't forward Pino's
    `logger.info(bigObject)` — pick fields.
31. Goldbergyoni's queue guidance: **queues for durable side effects, backoff
    and retries capped, dead-letter visible in metrics** — matches the skill's
    §6.
32. **Cron/timer work is scheduled work with the process's lifetime** — long
    durable effects via the queue, not a `setTimeout` chain.
33. **Be stateless, use Postgres as the source of truth** — the outbox row, not
    the queue job, is the durability boundary.

## Security practices (the subset relevant to services)

34. **Validate at the trust boundary** (Zod at the edge), never trust wire data
    — the domain re-checks invariants because adapters and tests call it
    directly.
35. **Protect against brute-force/rate-limit auth-relevant routes**; envelope
    codes like `AUTH_RATE_LIMITED` (429).
36. **Secrets never in code or logs; env parsing is where scrubbing happens
    (once).** Known placeholder values refused at boot.
37. item 10 of the repo's prod section: **run as non-root, cap body size
    (`bodyLimit`), security headers, CORS allowlist of exact origins.**
37. **Run as non-root, cap body size (`bodyLimit`), security headers, CORS
    exact-origin allowlist (wildcard dev-only).**
38. `pnpm audit --audit-level=high` as a separate CI lane.

## Performance practices

39. **CPU-bound work off the request path** — queues or worker_threads; sync
    APIs block the loop.
40. **Serialize work with queues rather than in-process `setTimeout` chains**
    for anything that must survive a restart.
41. **Native concurrency first: Promises with bounded fan-out** before adding a
    concurrency library; `p-limit`-style bounded maps when the fan-out is
    user-sized.
42. **Measure before optimizing** — boundary metrics first, then micro-tune.

## Why these condensed items

Each condensed item compresses one or a few bullets from the repo's sections
(Project Structure, Error Handling, Code Style, Testing, Going to Production,
Security, Performance). None fabricates a closing quote; facts only, no filler.
When the repo and the skill disagree (e.g. the repo's callback-era advice),
the skill text says which to follow: the enforced stack is the modern lane
(promise APIs, typed errors, Fastify), and the repo's structural advice is
carried by the template's vertical slices.