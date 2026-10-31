<!--
A representative report produced in the shape the nodejs-review skill prescribes, for
the deliberately messy notification slice in
skills/nodejs-review/evals/review-notifications-slice/files/. The agent copied the
slice into a throwaway project (scratch/) to run tsc, eslint, and vitest; that
directory is not included here. Read it as a representative report shape, not as a
line-accurate transcript against the current fixture files.
-->

# Node.js review: the `notifications` slice

`src/features/notifications/` handles notification state and delivery: a domain of pure
status transitions, a use case the HTTP layer and the worker both call, a Postgres
adapter, a Fastify route module, and a BullMQ worker that relays an outbox. Nothing here
is published, but you plan to build on it, so I reviewed it as an internal **library**
slice and applied the architecture contract and the API-design rules strictly.
**Verdict: not ready to build on yet.** The logic is small and easy to follow, but three
architecture contracts are broken — the domain imports zod, the use case reaches for the
pg adapter instead of storing its port, and two slices import each other — and a
fire-and-forget enqueue can silently drop notifications on a crash. **The most
important fix:** re-cut the layout so the use case depends on ports only; the rest
follows.

**Tools run.** I copied the slice into a scratch project and ran `npx tsc --noEmit`
(strict plus `noUncheckedIndexedAccess`), `npx eslint .` with the drop-in config, and
`npx vitest run`. The tool findings fold into the report below where they confirm a
reading problem (import walls and mechanical failures); run the tools yourself on the
current fixture for their exact counts. There are no tests, so `vitest run` runs 0. The
slice files were not modified.

## Must fix

Ranked first because architecture findings rank above everything.

### 1. The domain imports zod (`domain.ts:3`)
**Rule:** The architecture contract — the domain is I/O-free and must not import
fastify, zod, tsyringe, drizzle-orm, pg, bullmq, ioredis, pino, prom-client, or
`@opentelemetry/*`, not even for one helper (nodejs-best-practices, "Architecture
contract"; facta backend-node §04). eslint: `no-restricted-imports`.
**Problem:** `domain.ts:3` does `import { z } from "zod"` and uses it to validate the
raw provider payload in `normalize`. The domain now drags a validation dependency into
every importer, and the wall the contract puts up is gone: zod is the first import, but
pino or fastify are next.
**Fix:** the domain stays pure; validation lives at the edge that owns untrusted input.
```ts
export type ProviderPayload = { readonly id: string; readonly channels: readonly string[] };

export function normalize(payload: ProviderPayload): Notification {
  const channels = payload.channels.filter((c): c is Channel =>
    c === "push" || c === "email" || c === "sms");
  return { id: toNotificationId(payload.id), channels };
}
```
The zod schema for the provider payload moves to the adapter that reads it.

### 2. The use case imports the pg adapter instead of its port (`usecase.ts:5`, `:31`)
**Rule:** Depend on ports, not adapters — a use case stores a consumer-defined port as
its field type; adapters implement it structurally and are wired at the composition
root (nodejs-best-practices, "Architecture contract"; facta backend-node §04).
**Problem:** `usecase.ts:5` imports `PgNotifications` from `./postgres.js` and
constructs it inside `SendNotification`, so the use case is untestable without Postgres
and the dependency arrow points outward.
**Fix:** declare the port where it is consumed and store the interface:
```ts
import type { NotificationSender } from "./ports.js";

export class SendNotification {
  constructor(private readonly sender: NotificationSender) {}
}
```

### 3. Two slices import each other (`usecase.ts:6`)
**Rule:** Slices don't import each other — shared behavior moves down into `#shared`
or into a port (nodejs-best-practices, "Architecture contract"; facta backend-node
§02, §04). eslint: `no-restricted-imports` (slice-isolation group).
**Problem:** `usecase.ts:6` imports `isActiveSubscription` from
`#features/billing/usecase.js`. A cross-slice import is a broken architecture contract:
the kind that can never be waived and that ranks above everything else in this report.
The slice graph is now a cycle-in-waiting — billing next needs notifications, and the
two can never be built or tested independently. The fix is re-cutting the layout, not
weakening the gate.
**Fix:** declare the port in the consuming slice and let the composition root wire
whatever billing adapter satisfies it:
```ts
export interface BillingPort {
  isActiveSubscription(customerId: string): Promise<boolean>;
}
```

### 4. A second envelope writer in http.ts, with mutes on top (`http.ts:19`, `:42`)
**Rule:** One error envelope, written by one path — the handler's single error path;
never leak stack traces or internals (nodejs-best-practices, "Errors and failure
modes"; facta backend-node §10).
**Problem:** `http.ts:19` writes its own `{ error: message }` JSON in the route body
and `http.ts:42` adds `/* eslint-disable no-restricted-imports */` plus an
unexplained `// @ts-expect-error` on the adapter call, so the lint that guards the
wall is muzzled and the type hole is hidden. The lints config makes each mute
itself a finding: `@ts-expect-error` without a written reason, an unlimited blanket
disable, and a deleted rule from the config are all errors.
**Fix:** delete both comments, delete the ad-hoc error JSON, and let the one
`setErrorHandler` path write the envelope:
```ts
app.setErrorHandler((err, request, reply) => {
  const mapped = toEnvelope(err as unknown);
  reply.code(mapped.status).send({ detail: mapped.detail, code: mapped.code });
});
```

### 5. A fire-and-forget enqueue in the worker (`worker.ts:27`)
**Rule:** No floating promises (nodejs-best-practices, "Async and the event loop";
typescript-eslint `no-floating-promises`); durable side effects only via the BullMQ
outbox.
**Problem:** `worker.ts:27` calls `this.outbox.relay()` without `await` to keep the
loop "fast". If the process dies before the promise settles, the notification the row
represents is silently lost — exactly the gap the outbox exists to close, and the
drop is invisible until a customer asks where their email went.
**Fix:** await it, and let BullMQ's own retry policy own the retry:
```ts
await this.outbox.relay(job);
```

## Should fix

### 6. An untyped catch that swallows (`usecase.ts:44`)
**Rule:** Domain errors are typed and discriminated; never swallow (`catch (e: any)`)
or throw bare strings (nodejs-best-practices, "Errors and failure modes"; the Google
TypeScript Style Guide on error handling).
**Problem:** `catch (e: any) { return null; }` turns "unknown customer" and "database
was down" into the same `null` the caller can't act on, and the `any` widens every
call site.
**Fix:** a discriminated result the handler maps once:
```ts
export type SendError =
  | { readonly kind: "unknown-customer"; readonly customerId: string }
  | { readonly kind: "storage-unavailable"; readonly detail: string };

export type SendResult =
  | { readonly ok: true; readonly notificationId: NotificationId }
  | { readonly ok: false; readonly error: SendError };
```

### 7. console.log on the request path (`usecase.ts:52`, `worker.ts:39`)
**Rule:** Structured logging only via pino — `console.log` is a lint error outside a
CLI's stdout (nodejs-best-practices, "Logging and observability"; eslint `no-console`).
**Problem:** Two `console.log` calls print plain strings. They carry no `requestId` or
`trace_id`, so OTel traces and log lines can't be correlated, and the lint flags both.
**Fix:** pino child loggers at the composition root, handed down as a port:
```ts
const logger = baseLogger.child({ requestId, trace_id: traceId });
logger.info({ notificationId }, "notification sent");
```

### 8. An unguarded index under noUncheckedIndexedAccess (`domain.ts:14`)
**Rule:** The recommended strict tsconfig set includes `noUncheckedIndexedAccess`
(nodejs-best-practices, "Types and API design"); eslint:
`no-unsafe-member-access` family under strictTypeChecked.
**Problem:** `n.channels[0]` types as `string | undefined`, and `tsc --noEmit`
rejects the call that passes it where a `string` is required — the one error the
tool run found.
**Fix:** the domain already models channels as a union; take the first only in the
adapter, where `undefined` is representable:
```ts
const primary = notification.channels.at(0);
```

## Consider

### 9. A boolean parameter (`usecase.ts:12`)
**Rule:** No boolean parameters — use a named union or two functions
(nodejs-best-practices, "Types and API design"; Google TypeScript Style Guide, "bool
parameters").
**Problem:** `send(n, true)` callsites don't say what `true` does; the lint can't see
it and review must.
**Fix:**
```ts
export type NotifyPriority = "now" | "digest";
```

### 10. No tests beside the code (`usecase.ts`)
**Rule:** Table-driven tests with vitest, beside the code (`usecase.test.ts`), fakes
over real Postgres and Redis (nodejs-best-practices, "Tests").
**Problem:** Zero test files in the slice; the parser in `normalize` is exactly where
the first test pays off.
**Fix:** start with one table:
```ts
describe.each([
  ["push only", ["push"], ["push"]],
  ["mixed, one unknown", ["push", "fax"], ["push"]],
  ["none valid", ["fax"], []],
])("normalize(%s)", (_name, raw, expected) => {
  it("keeps each valid channel and drops the rest", () => {
    expect(normalize({ id: "n1", channels: raw }).channels).toEqual(expected);
  });
});
```

## What's already good

- `ports.ts` already declares narrow interfaces, and `postgres.ts` implements them
  structurally — the adapter-to-port shape is right once the use case stops
  constructing the adapter itself (finding 2).
- `http.ts` validates the request body with a Zod schema before the use case sees it:
  validation at the edge, exactly where the contract puts it.
- Status transitions in `domain.ts` are pure functions over a discriminated
  `NotificationStatus`, and the switch in `toStatus` covers every member.
- The slice keeps its migration beside its schema, so table ownership stays per-slice.

## Suggested lints

This slice has no `eslint.config.mjs`. Adding the BeautifulNodeJS drop-in
(`lints/eslint.config.mjs` from
https://github.com/Facta-Dev/beautifulnodejs) at the repo root would flag most of the
above in CI, as errors rather than review findings. From this review it would have
caught:

- the zod import in `domain.ts` and the billing import in `usecase.ts`
  (`no-restricted-imports`, findings 1 and 3),
- the adapter import in the use case (finding 2),
- the floating `relay()` promise (`no-floating-promises`, finding 5),
- both `console.log` calls (`no-console`, finding 7),
- the mute comments (`@eslint-community/eslint-comments` + `ban-ts-comment`,
  finding 4).