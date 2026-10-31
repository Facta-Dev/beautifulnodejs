// Drop-in flat config for the review-notifications-slice scaffold. It makes the
// machine-checkable rules from the nodejs-best-practices skill fail loudly, so the
// reviewed code shows its violations to eslint as well as to the reviewer.
// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/"] },
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
    rules: {
      "no-console": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": "error",
          "ts-nocheck": "error",
          "minimumDescriptionLength": 10,
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
      "@typescript-eslint/explicit-module-boundary-types": "error",
    },
  },
  {
    files: ["src/features/*/domain.ts", "src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "fastify", "zod", "tsyringe", "reflect-metadata", "drizzle-orm",
            "pg", "bullmq", "ioredis", "pino", "prom-client",
          ],
          patterns: [
            {
              group: ["@opentelemetry/*", "drizzle-orm/*", "pg/*", "bullmq/*", "ioredis/*", "pino/*", "@fastify/*"],
              message: "The domain is I/O-free: it never imports fastify, zod, tsyringe, drizzle-orm, pg, bullmq, ioredis, pino, prom-client, or @opentelemetry/*. Define a port instead — see the nodejs-best-practices skill, 'Architecture contract'.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["#features/*"],
              message: "Slices do not import each other. Move shared behavior down into #shared or into a port (see the 'Architecture contract' in nodejs-best-practices).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/*/usecase.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "fastify", "pg", "drizzle-orm", "bullmq", "ioredis", "pino",
            "tsyringe", "prom-client",
          ],
          patterns: [
            {
              group: ["@opentelemetry/*"],
              message: "Use cases depend on ports and the domain; adapters, HTTP, queues, logging and DI are wired by the composition root (module.ts / src/bin/*).",
            },
          ],
        },
      ],
    },
  },
);
