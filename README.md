# Beautiful Node.js

Three standard [Agent Skills](https://agentskills.io) and a lint configuration that
teach coding agents to write, review, port, and enforce idiomatic Node.js + TypeScript:

- **`nodejs-best-practices`** loads whenever an agent writes or changes TypeScript, and
  steers it toward idiomatic, strict, maintainable code on the enforced stack.
- **`nodejs-review`** reviews existing Node.js or TypeScript code — a file, a slice, a
  module, or a diff — and writes a prioritized report where every finding cites the rule
  it breaks and shows the fix.
- **`nodejs-port`** ports Python, Go, Rust, C, or legacy JavaScript to idiomatic
  Node.js + TypeScript with the same behavior, porting the original tests first so you
  can prove the two match.
- **`lints/`** is a drop-in ESLint configuration that enforces the machine-checkable
  rules in CI.

They work with Claude Code, OpenAI Codex, GitHub Copilot, Cursor, Gemini CLI, and any
other agent that reads the Agent Skills format. Every TypeScript example in the skills
compiles under strict `tsc`, and every rule in the lint config is proven to fire.

The skills target the **enforced stack** — Fastify, TypeScript strict, Zod, tsyringe,
pg + pg-pool behind PgBouncer, Drizzle ORM, BullMQ + Redis, Pino, OpenTelemetry +
Prometheus, hosted as stateless services on PM2 or Kubernetes — under **hexagonal
architecture + vertical slicing**. The contracts that follow from that layout are
**unbreakable and non-waivable** (see [The architecture
contract](#10-architecture-contract-the-backend-node-stack)).

The guidance is distilled from five sources, with a condensed digest of each bundled in
the skill so the agent can consult the original reasoning when it needs to:

- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Effective TypeScript](https://effectivetypescript.com) by Dan Vanderkam
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) by Yoni
  Goldberg and contributors
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript) by Basarat Ali Syed
- The facta backend-node handbook
  ([Facta-Dev/facta](https://github.com/Facta-Dev/facta), `templates/backend-node`)

Where the sources disagree, the skill picks a side and says why.

## What it changes

Asked for a small semver-parsing library, an agent without the skill produced working
code with `any` in its exported types, a boolean parameter callers pass blind,
`console.log` on the request path, and errors swallowed in an untyped catch. With the
skill, the same agent kept ids branded, exported discriminated error unions, wrote an
explicit return type on every export, and made invalid states unrepresentable. Condensed
from those two runs:

```ts
// Without the skill
export function notify(user: any, text: string, forcePush: boolean) {
  if (forcePush) {
    console.log("force-pushing to", user.email);
  }
  try {
    return deliver(user, text);
  } catch (e: any) {
    return null; // swallow; the caller will figure it out
  }
}

function deliver(user: any, text: string) {
  return user.email;
}
```

```ts
// With the skill
export type UserId = number & { readonly brand: "user-id" };

export type NotifyError =
  | { readonly kind: "unknown-user"; readonly userId: UserId }
  | { readonly kind: "empty-text" };

export type NotifyResult =
  | { readonly ok: true; readonly queuedAt: Date }
  | { readonly ok: false; readonly error: NotifyError };

export type DeliveryChannel = "push" | "email" | "sms";

export function notify(
  userId: UserId,
  text: string,
  channels: readonly DeliveryChannel[],
): NotifyResult {
  if (text.length === 0) {
    return { ok: false, error: { kind: "empty-text" } };
  }
  // durable send goes through the slice's BullMQ outbox worker, not setTimeout
  return { ok: true, queuedAt: new Date() };
}
```

On the enforced stack, the same skill also routes logging through a Pino child logger
keyed by `requestId` and `trace_id`, puts durable side effects in the BullMQ outbox
worker, and types the Fastify error handler so the response envelope is written exactly
once. The eval cases measure the difference with and without the skills; see
[Testing the skills](#testing-the-skills).

## The enforced stack

The skills assume one stack and say so everywhere, because most package-level advice
(import edges, config, queues, deploy) is stack-specific. When your project uses a
different one, the architecture still transfers; these rules do not.

| Concern | The stack |
|---|---|
| Language | TypeScript, strict (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`) |
| HTTP | Fastify — never Express, NestJS, or Koa |
| Validation | Zod, at the edges where untrusted input enters |
| DI | tsyringe, wired only at the composition root |
| Database | pg + pg-pool behind PgBouncer, Drizzle ORM for schema, queries, and migrations |
| Queues | BullMQ + Redis — durable side effects only, via the outbox worker |
| Logging | Pino, structured, with child loggers per request |
| Tracing and metrics | OpenTelemetry spans at the edges, Prometheus at the boundary |
| Runtime | Stateless services on PM2 or Kubernetes |
| Layout | Hexagonal (ports and adapters) + vertical slicing, dependencies pointing inward |

Code that imports fastify, drizzle, or pg — or anything that runs on the Node.js event
loop — is application code on this stack. Read
`skills/nodejs-best-practices/references/backend-node-stack.md` first; it holds the
slice layout, the framework-managed behaviors to leave alone, and the failure modes the
lints catch.

## The architecture contract

The best-practices skill encodes the backend-node architecture as a contract, and that
section opens with:

> The contracts below are **unbreakable and non-waivable**: developers cannot opt out,
> and neither can you.

In short: dependencies point inward (`src/bin/api.ts` and `src/bin/worker.ts` → slices →
ports → domain), the domain is I/O-free — it never imports fastify, zod, tsyringe,
drizzle-orm, pg, bullmq, ioredis, pino, prom-client, or `@opentelemetry/*`, not even for
one helper — slices never import each other, and a port is an interface defined where it
is consumed, implemented structurally by an adapter that is the only place the driver or
queue client appears. Durable side effects go through the BullMQ outbox worker, the HTTP
layer writes one error envelope through one error path, and logging flows through Pino
child loggers only.

When a rule fires because the layout is wrong, the fix is to re-cut the layout — never
to weaken or delete the lints, and never to silence it with `eslint-disable` or
`@ts-expect-error`. Review treats a broken contract as an automatic Must fix (see
`nodejs-review`).

## What the lints catch

Copy [`lints/eslint.config.mjs`](lints/eslint.config.mjs) into your repo root and run:

```bash
npx eslint .
```

It turns the import edges of the architecture contract into red-on-save output and bans
the mechanical failures the skill names. A run over a sloppy slice looks like:

```text
src/features/notifications/domain.ts
  1:1  error  no-restricted-imports  The domain is I/O-free: it never imports fastify,
                                     zod, tsyringe, drizzle-orm, pg, bullmq, ioredis,
                                     pino, prom-client, or @opentelemetry/*. Define a
                                     port instead — see the nodejs-best-practices skill,
                                     'Architecture contract'.

src/features/notifications/usecase.ts
  3:1   error  no-restricted-imports  Use cases depend on ports and the domain;
                                     adapters, HTTP, queues, logging and DI are wired by
                                     the composition root (module.ts / src/bin/*).
  21:3  error  no-floating-promises  Promises must be awaited, end with .catch, or end
                                     with .then
  34:5  error  no-console            Unexpected console statement

src/features/billing/usecase.ts
  9:1  error  no-restricted-imports  Slices do not import each other. Move shared
                                     behavior down into #shared or into a port (see the
                                     'Architecture contract' in nodejs-best-practices).
```

Muting is not silence either: `@ts-expect-error` needs a written reason, `ts-ignore` and
`ts-nocheck` are errors outright, an unlimited blanket `eslint-disable` is an error, and
a deleted rule entry from the config shows up in the lint job, not silently.

Every rule in the config is proven to fire. [`lints/check/`](lints/README.md) is a small
project with one deliberate violation per rule plus a clean file, and this script runs
eslint over it from the repo root:

```bash
bash scripts/check-lints.sh
```

It fails if a rule stops firing, if something unexpected fires, or if the check copy of
the config drifts from `lints/eslint.config.mjs`.

## Install

Each skill is a folder under `skills/`: `nodejs-best-practices/`, `nodejs-review/`, and
`nodejs-port/`. Every option below puts those folders where your agent looks for skills.
Install all three; the review and port skills lean on the best-practices skill for
style.

### Any agent, one command

The [`skills`](https://github.com/vercel-labs/skills) installer supports most agents
(Node 22.20 or later):

```bash
npx skills add Facta-Dev/beautifulnodejs
```

Add `-g` to install for your user instead of the current project, or `-a <agent>` to
pick an agent, such as `-a codex` or `-a cursor`.

### Claude Code

Install it as a plugin so updates arrive with one command:

```bash
claude plugin install beautiful-nodejs --marketplace Facta-Dev/beautifulnodejs
```

Inside a session, the same thing is:

```
/plugin marketplace add Facta-Dev/beautifulnodejs
/plugin install beautiful-nodejs@beautiful-nodejs
```

This installs all three skills. They appear as
`/beautiful-nodejs:nodejs-best-practices`, `/beautiful-nodejs:nodejs-review`, and
`/beautiful-nodejs:nodejs-port`, though you rarely need to call them, since they trigger
on their own. To try it for one session without installing, clone the repo and run
`claude --plugin-dir ./beautifulnodejs`.

### OpenAI Codex

Install it as a plugin:

```bash
codex plugin marketplace add Facta-Dev/beautifulnodejs
codex plugin add beautiful-nodejs@beautiful-nodejs
```

This installs all three skills as `beautiful-nodejs:nodejs-best-practices`,
`beautiful-nodejs:nodejs-review`, and `beautiful-nodejs:nodejs-port`. The same package
works in the ChatGPT desktop app.

### GitHub Copilot

With GitHub CLI 2.90 or later:

```bash
gh skill install Facta-Dev/beautifulnodejs nodejs-best-practices
gh skill install Facta-Dev/beautifulnodejs nodejs-review
gh skill install Facta-Dev/beautifulnodejs nodejs-port
```

This installs into the current project by default. Add `--scope user` to install for
your user, or `--agent <name>` to install for a different agent.

### Gemini CLI

```bash
gemini skills install https://github.com/Facta-Dev/beautifulnodejs --path skills/nodejs-best-practices
gemini skills install https://github.com/Facta-Dev/beautifulnodejs --path skills/nodejs-review
gemini skills install https://github.com/Facta-Dev/beautifulnodejs --path skills/nodejs-port
```

### Cursor or anything else: copy the folder

Clone the repo and copy the three skill folders into your agent's skills directory.
Most agents now read the shared `.agents/skills/` location:

```bash
git clone https://github.com/Facta-Dev/beautifulnodejs
mkdir -p ~/.agents/skills
cp -R beautifulnodejs/skills/nodejs-* ~/.agents/skills/
```

| Agent | User directory | Project directory |
|---|---|---|
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| OpenAI Codex | `~/.agents/skills/` | `.agents/skills/` |
| GitHub Copilot | `~/.copilot/skills/` or `~/.agents/skills/` | `.github/skills/` or `.agents/skills/` |
| Cursor | `~/.cursor/skills/` or `~/.agents/skills/` | `.cursor/skills/` or `.agents/skills/` |
| Gemini CLI | `~/.gemini/skills/` or `~/.agents/skills/` | `.gemini/skills/` or `.agents/skills/` |

Claude Code does not read `.agents/skills/`, so use its own directory or the plugin.
Restart the agent if the skill doesn't show up right away.

### claude.ai

claude.ai takes one zip per skill, with the skill folder as the zip root:

```bash
cd skills
zip -r ../nodejs-best-practices.zip nodejs-best-practices -x '*.DS_Store' -x '*/evals/*'
zip -r ../nodejs-review.zip nodejs-review -x '*.DS_Store' -x '*/evals/*'
zip -r ../nodejs-port.zip nodejs-port -x '*.DS_Store' -x '*/evals/*'
```

Upload each under **Customize > Skills**. Code execution must be enabled first.

## Reviewing existing code

Ask your agent to review a file, a slice, or a diff, for example "review
src/features/notifications" or "what would you change in this PR". The `nodejs-review`
skill runs `npx tsc --noEmit`, `npx eslint .`, and the tests when a toolchain is
available, then writes a report with three tiers: must fix, should fix, and consider. A
broken architecture contract ranks above everything. Every finding gives a `file:line`
location, the rule it breaks with its source (a typescript-eslint rule, an Effective
TypeScript item, the Google TypeScript Style Guide, or the architecture contract), and
the smallest code change that fixes it. Each report ends with what the code already does
well.

[`examples/review-inventory.md`](examples/review-inventory.md) is a real review the skill
produced for the deliberately messy notification slice in the eval cases.

## Porting code to TypeScript

Ask your agent to port a module, for example "port inventory.py to TypeScript" or
"rewrite this Go service in Node.js". The `nodejs-port` skill reads the original and its
tests, ports the tests first, designs a typed API instead of transliterating the
original, and verifies with `npx tsc --noEmit`, `npx eslint .`, and `npx vitest run`. It
maps each language's habits to their TypeScript equivalents: exception hierarchies and
error codes to discriminated error unions, `None` and `nil` to an explicit
null-and-undefined choice made on purpose, Go's `(value, error)` pairs to typed result
unions, duck typing and C out-parameters to interfaces and return values, goroutine
fan-out to `Promise.all` (worker_threads or a BullMQ queue when true concurrency is
needed), and Python's `sorted(key=)` to a comparator passed to `Array.prototype.sort`.
Each port comes with a `PORTING.md` that maps the old API and tests to the new ones and
lists every deliberate difference.

## What the writing skill covers

`skills/nodejs-best-practices/SKILL.md` is about 500 lines, organized so an agent can
scan it while coding:

1. Mindset: TypeScript-shaped code, invalid states unrepresentable, application vs
   library code, let the tools do the work
2. Before you hand back code: `tsc`, `eslint`, tests; fix rules instead of silencing
   them; `@ts-expect-error` only with a reason, on the narrowest line
3. Types and API design: the strict tsconfig set, `unknown` over `any`, discriminated
   unions, branded ids, explicit return types, naming, no boolean parameters
4. Async and the event loop: never block the loop, no floating promises, timeouts and
   `AbortSignal` on every external call, bounded `Promise.all`
5. Errors and failure modes: one error envelope, typed domain errors, adapters map
   foreign errors once, log-and-shutdown on `unhandledRejection`
6. Concurrency, queues, and durable work: BullMQ only, the outbox-worker pattern,
   idempotent consumers, capped retries, dead-lettering
7. Persistence: Drizzle with schema and migrations paired per slice, PgBouncer-sized
   pools, transactions scoped inside the use case, parameterized queries only
8. Logging and observability: Pino everywhere, child loggers carry `requestId` +
   `trace_id`, OpenTelemetry spans at the edges, Prometheus at the boundary
9. Dependency injection and modules: tsyringe tokens, `register*()` per slice, one
   composition root
10. The architecture contract (the restrictive section)
11. Tests: table-driven with vitest, fakes over real Redis and Postgres, no wall clock
12. Documentation and comments
13. Final checklist

`skills/nodejs-best-practices/references/` holds one digest per source for deeper
lookups.

## Layout

```
beautifulnodejs/
├── .claude-plugin/
│   ├── plugin.json         Claude Code plugin manifest
│   └── marketplace.json    lets this repo act as its own marketplace
├── .agents/plugins/
│   └── marketplace.json    the same, for Codex
├── plugin.json             Codex and ChatGPT plugin manifest
├── assets/icon.png         plugin icon for Codex and ChatGPT
├── skills/
│   ├── nodejs-best-practices/   writing skill
│   │   ├── SKILL.md
│   │   ├── references/        one digest per source, plus backend-node-stack.md
│   │   └── evals/
│   ├── nodejs-review/         review skill
│   │   ├── SKILL.md
│   │   └── evals/
│   └── nodejs-port/           porting skill
│       ├── SKILL.md
│       └── evals/             a Python module to port, with its test suite
├── lints/
│   ├── eslint.config.mjs      drop-in flat config for ESLint 9
│   ├── README.md
│   └── check/                 one deliberate violation per rule, plus clean.ts
├── scripts/
│   ├── check-skill.py         validates skills, evals, and manifests
│   ├── check-lints.sh         proves every rule in the config fires
│   ├── check-examples.py      compiles every TypeScript example in the docs
│   ├── examples.json          context that lets fragment examples compile
│   └── package-openai-plugin.py   builds the ChatGPT / Codex directory ZIP
├── examples/
│   └── review-inventory.md    a real review report
├── tests/                     unit, contract, integration, and e2e checks
├── CHANGELOG.md
├── CONTRIBUTING.md
├── PRIVACY.md
└── README.md
```

## Testing the skills

`skills/nodejs-best-practices/evals/` holds two test cases in the layout `claude plugin
eval` reads: a refactor-this-slice task with an input scaffold (a notification slice
with the architecture violations planted) and a library API design task. Each case has
the prompt, a description of a good result, and one assertion per file under
`graders/`. Run them with and without the skill from the skill directory:

```bash
claude plugin eval . --allow-tools Write,Edit,Bash --scaffold
```

`skills/nodejs-review/evals/` holds a review case for the same messy notification
slice, and `skills/nodejs-port/evals/` holds a Python module to port with its original
test suite. Run them the same way from each skill's directory.

These are real model runs and are billed.

## Updating

Edit the skill, bump `version` in both `.claude-plugin/plugin.json` and `plugin.json`
(the checker fails if they differ), commit, and push. Claude Code plugin users pick up
the new version with:

```bash
claude plugin update beautiful-nodejs
```

Codex users refresh the marketplace with:

```bash
codex plugin marketplace upgrade beautiful-nodejs
```

Anyone who copied the folder or used an installer re-runs the install command. Record
each release in [CHANGELOG.md](CHANGELOG.md).

Validate before pushing. `python3 scripts/check-skill.py` checks skill frontmatter,
links, eval cases, and plugin manifests. Pass `--json` for machine-readable output.
`python3 scripts/check-examples.py` compiles every TypeScript block in the skills, the
reference digests, README, and examples with `tsc --noEmit`; pass
`--require-toolchain` to make a missing toolchain an error, which is what CI does.

```bash
python3 scripts/check-skill.py
python3 scripts/check-examples.py
claude plugin validate .
```

To publish a release to the ChatGPT / Codex Plugins Directory, update `release_notes`
in `plugin.json`, then build the upload:

```bash
python3 scripts/package-openai-plugin.py
```

This writes `dist/beautiful-nodejs-<version>.zip` with the manifest, the skills and
their references, the icon, the license, and the privacy policy, but not the eval
cases. Upload it at
[platform.openai.com/plugins](https://platform.openai.com/plugins).

## Contributing

Issues and pull requests are welcome. Every rule needs a published source; see
[CONTRIBUTING.md](CONTRIBUTING.md) for how to propose a rule, report a review false
positive, or add an eval case.

## Sources and attribution

The guidance in these skills is a synthesis. The five digests in
`skills/nodejs-best-practices/references/` are paraphrased summaries written for this
project; they restate each source's advice in condensed form and link back to the
original. Read the originals for the full reasoning.

| Source | Author | License |
|---|---|---|
| [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) | Google | CC BY 3.0 |
| [Effective TypeScript](https://effectivetypescript.com) | Dan Vanderkam, published by O'Reilly | free online edition |
| [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) | Yoni Goldberg and contributors | CC BY 4.0 |
| [TypeScript Deep Dive](https://basarat.gitbook.io/typescript) | Basarat Ali Syed | free online edition |
| facta backend-node handbook | Facta-Dev | internal handbook (`templates/backend-node`) |

The skill text, the digests, and the checkers in this repository are MIT licensed (see
[LICENSE](LICENSE)).

## License

MIT. See [LICENSE](LICENSE).