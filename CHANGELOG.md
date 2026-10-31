# Changelog

All notable changes to this project are listed here. Versions follow
[Semantic Versioning](https://semver.org/), and the version lives in
`.claude-plugin/plugin.json`.

## [Unreleased]

### Added

- **Three skills for Node.js + TypeScript.** `nodejs-best-practices` steers new code
  toward the strict tsconfig set, discriminated unions and branded ids, async
  discipline, the one-error-envelope error path, BullMQ outbox for durable work,
  Drizzle with paired schema and migrations, and Pino logging — under the unbreakable
  hexagonal + vertical-slicing architecture contract. `nodejs-review` reviews a file, a
  slice, or a diff, ranks a broken architecture contract above everything, and shows a
  concrete fix for every finding. `nodejs-port` ports Python, Go, Rust, C, or legacy
  JavaScript to idiomatic TypeScript with the same behavior, porting the original tests
  first and writing a `PORTING.md`.
- **A drop-in ESLint config.** `lints/eslint.config.mjs` (ESLint 9 flat config + 
  typescript-eslint 8, strictTypeChecked) turns the architecture contract into
  red-on-save output: `no-restricted-imports` walls the domain off from fastify, zod,
  tsyringe, drizzle-orm, pg, bullmq, ioredis, pino, prom-client, and
  `@opentelemetry/*`, keeps slices from importing each other, and keeps use cases off
  adapters. `no-console`, `no-floating-promises`, `ban-ts-comment` (reason required on
  `@ts-expect-error`; `ts-ignore` and `ts-nocheck` are errors) and
  `@eslint-community/eslint-comments` reason requirements make silencing attempts
  themselves into findings.
- **Proof that every rule fires.** `lints/check/` holds one deliberate violation per
  rule plus a clean file, and `scripts/check-lints.sh` runs eslint over both, bounded
  by a timeout with stderr always surfaced. It fails if a rule goes quiet, if
  something unexpected fires, or if the check copy of the config drifts from
  `lints/eslint.config.mjs`.
- **Every TypeScript example is compiled.** `scripts/check-examples.py` compiles each
  `ts` code block in the skills, the reference digests, the README, and `examples/`
  with `tsc --noEmit`, reporting errors at the markdown line. `scripts/examples.json`
  holds the surrounding code that fragments need, or the reason a block is skipped.
  CI runs it with `--require-toolchain` so the checker can never silently downgrade to
  bracket-sanity-only.
- **A skill and manifest checker.** `scripts/check-skill.py` validates every skill's
  frontmatter, links, eval cases, graders, and both plugin manifests, using only
  Python's standard library. `scripts/package-openai-plugin.py` builds the ChatGPT /
  Codex directory ZIP without the eval cases.
- **A unittest suite with its own gates.** `tests/` runs unit tests on the checkers,
  contract tests that pin the canonical phrases, the manifest parity, the lints
  pairing, and the CI gates, integration tests that mutate copies of the repo to prove
  the checkers fail loudly, and e2e tests that parse the workflow file. CI runs it all
  on every push and pull request.
- Distillation into five reference digests — the Google TypeScript Style Guide,
  Effective TypeScript, Node.js Best Practices, TypeScript Deep Dive, and the facta
  backend-node handbook — one per source, bundled with the writing skill.
- Plugin packaging: a portable `plugin.json` for the ChatGPT / Codex Plugins
  Directory, `.claude-plugin/` manifests that make this repo its own marketplace, and
  `PRIVACY.md`.
[Unreleased]: https://github.com/Facta-Dev/beautifulnodejs/compare/v0.1.0...HEAD
