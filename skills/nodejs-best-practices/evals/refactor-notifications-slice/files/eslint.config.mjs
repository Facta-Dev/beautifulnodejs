import js from "@eslint/js";
import tseslint from "typescript-eslint";

// The project's architecture lints. The contractor muted findings with
// eslint-disable comments in code instead of fixing them; the config itself
// is the source of truth and stays.
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: true }],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": "error", "ts-nocheck": "error", "ts-expect-error": "allow-with-description" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["#features/*"],
              message:
                "Slices do not import each other. Move shared behavior down into #shared or into a port (see the 'Architecture contract' in nodejs-best-practices).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/domain.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            "fastify", "zod", "tsyringe", "reflect-metadata", "drizzle-orm", "pg",
            "bullmq", "ioredis", "pino", "prom-client",
          ],
          patterns: [
            {
              group: ["@opentelemetry/*", "drizzle-orm/*", "pg/*", "bullmq/*", "ioredis/*", "pino/*"],
              message:
                "The domain is I/O-free: it never imports fastify, zod, tsyringe, drizzle-orm, pg, bullmq, ioredis, pino, prom-client, or @opentelemetry/*. Define a port instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/usecase.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["fastify", "pg", "drizzle-orm", "bullmq", "ioredis", "pino", "tsyringe", "prom-client"],
          patterns: [{ group: ["@opentelemetry/*"], message: "Use cases depend on ports and the domain; adapters, HTTP, queues, logging and DI are wired by the composition root." }],
        },
      ],
    },
  },
);