// Beautiful Node.js drop-in lints
//
// Paste this into your repo root (read the overrides below first, then add
// your project-specific ignores on the first entry). It makes eslint enforce
// the rules from the nodejs-best-practices skill that a linter can check: the
// I/O wall, slice decoupling, promise discipline, and the silencing
// requirements. Silence a rule locally with a reason, which the config
// requires.
//
// Everything beyond the pinned rules rides the typescript-eslint
// strictTypeChecked + stylisticTypeChecked presets. Make CI strict with:
//
//     npx eslint .
//
// The lints/check project proves every pinned rule fires: see
// scripts/check-lints.sh and tests/contracts/test_lints_contract.py.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import n from "eslint-plugin-n";

// Slices are sealed: shared behavior moves down into #shared or into a port,
// never sideways. The second group also catches the literal nested path form
// (../../src/features/other/domain.js) that bypasses the subpath-import law;
// the third and fourth catch the relative parent form (../billing/domain.js)
// that the first two cannot see. Patterns match the import text, so a file
// nested one level inside its own slice also trips on ../domain.js — keep
// slice files at the slice root or go through #features.
const SLICE_PATTERN = {
  group: ["\\#features/*", "**/src/features/*/*", "../*", "../*/*"],
  message:
    "Slices do not import each other; shared behavior moves down into #shared or into a port — see the 'Architecture contract' in nodejs-best-practices.",
};

// The domain is I/O-free: it never imports the transport, validation,
// persistence, queueing, logging, or tracing stack. Not even for one helper.
const DOMAIN_PATTERNS = [
  SLICE_PATTERN,
  {
    group: ["@opentelemetry/*", "drizzle-orm/*", "pg/*", "bullmq/*", "ioredis/*", "pino/*"],
    message:
      "The domain is I/O-free: it never imports fastify, zod, tsyringe, drizzle-orm, pg, bullmq, ioredis, pino, prom-client, or @opentelemetry/*. Define a port instead — see the nodejs-best-practices skill, 'Architecture contract'.",
  },
];

// Use cases depend on ports and the domain. The mechanism names below are
// wired by adapters and the composition root, never by the use case itself.
const USECASE_PATTERNS = [
  SLICE_PATTERN,
  {
    group: ["@opentelemetry/*", "drizzle-orm/*"],
    message:
      "Use cases depend on ports and the domain; adapters, HTTP, queues, logging and DI are wired by the composition root (module.ts / src/bin/*).",
  },
];

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "coverage/", "src/gen/"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      n,
      "@eslint-community/eslint-comments": eslintComments,
    },
    rules: {
      // Structured logging only: pino, never console.* (a CLI's stdout is the
      // one sanctioned exception).
      "no-console": "error",
      // Silencing must be narrow, explained, and rare: @ts-expect-error with a
      // reason on the narrowest line; ts-ignore and ts-nocheck are flat out.
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          // `true` = the directive is banned outright; "allow-with-description"
          // lets @ts-expect-error through only with a reason.
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          minimumDescriptionLength: 10,
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksConditionals: true, checksVoidReturn: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      // Explicit return types on every export: consumers get the shape, and
      // the declaration output stays stable.
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      // Muting attempts are themselves findings.
      "@eslint-community/eslint-comments/no-unlimited-disable": "error",
      "@eslint-community/eslint-comments/require-description": ["error", { ignore: [] }],
      // Node plugin subset: the two rules worth pinning as warnings.
      "n/handle-callback-err": "warn",
      "n/no-process-exit": "warn",
    },
  },
  {
    // Slice decoupling: the features tree is sealed across slices.
    files: ["src/features/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [SLICE_PATTERN] }],
    },
  },
  {
    // Usecase hygiene: mechanism imports are adapter and composition-root
    // concerns. (After the slice object so its union carries down to
    // usecase.ts; before the domain object so domain.ts keeps its own wall.)
    files: ["src/features/*/usecase.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "fastify",
            "pg",
            "drizzle-orm",
            "bullmq",
            "ioredis",
            "pino",
            "tsyringe",
            "prom-client",
          ],
          patterns: USECASE_PATTERNS,
        },
      ],
    },
  },
  {
    // The I/O wall, THE architecture rule. Most-specific match, so it carries
    // the union (see the facta backend-node skeleton eslint.config.mjs).
    files: ["src/features/*/domain.ts", "src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "fastify",
            "zod",
            "tsyringe",
            "reflect-metadata",
            "drizzle-orm",
            "pg",
            "bullmq",
            "ioredis",
            "pino",
            "prom-client",
          ],
          patterns: DOMAIN_PATTERNS,
        },
      ],
    },
  },
);