# Beautiful Node.js lints

The two-file unit that turns the nodejs-best-practices skill into red-on-save
output:

- `eslint.config.mjs` — the drop-in. Paste it next to your `package.json`; it
  makes eslint enforce the machine-checkable rules from the skill: the I/O
  wall around the domain (fastify/zod/tsyringe/drizzle/pg/bullmq/ioredis/pino/
  prom-client/@opentelemetry), slice decoupling (`#features/*`), usecase
  hygiene, `no-console`, the silencing requirements (`ban-ts-comment`,
  eslint-comments), promise discipline, and the typescript-eslint
  strictTypeChecked + stylisticTypeChecked presets. The `#*` subpath-import
  names follow the facta backend-node skeleton (`#features/*`, `#shared/*`,
  `#platform/*`, `#gen/*`); adjust them when your project renames, never the
  rule.
- `check/` — the violation harness that proves every pinned rule fires:
  `src/` holds one file per rule family, each violating line carrying a
  `// expect:<rule>` comment on the line above it. `clean.ts` (and the billing
  slice) carries no markers and must stay fully quiet, proving the config
  does not over-fire.

The harness files are slice-shaped on purpose (src/features/notifications/
domain.ts and usecase.ts, src/features/billing/domain.ts): the architecture
overrides key on those file globs, so the violations must sit in files the
drop-in actually targets. `scripts/check-lints.sh` fails if a marked rule
stays quiet, if anything unmarked fires, or if `tsc --noEmit` fails on the
same files — every eslint/tsc invocation is bounded by a timeout, stderr is
always surfaced, and a non-JSON eslint report is an explicit error, never a
guess.

To wire it in CI:

```bash
npx eslint .
bash scripts/check-lints.sh   # only in the BeautifulNodeJS repo itself
```

Add the repo as a dependency of nothing — it is a copy-in config. Keep the
check project's `eslint.config.mjs` byte-identical to the drop-in; the lints
gate, scripts/check-lints.sh and tests/contracts/test_lints_contract.py all
enforce it.