// Violations of the usecase hygiene override (usecase.ts): every mechanism
// import the usecase override forbids, plus the slice-alias pattern.

// expect:no-restricted-imports
import fastify from "fastify";
// expect:no-restricted-imports
import pg from "pg";
// expect:no-restricted-imports
import { drizzle } from "drizzle-orm/node-postgres";
// expect:no-restricted-imports
import { Queue } from "bullmq";
// expect:no-restricted-imports
import Redis from "ioredis";
// expect:no-restricted-imports
import { pino } from "pino";
// expect:no-restricted-imports
import { injectable } from "tsyringe";
// expect:no-restricted-imports
import { Registry } from "prom-client";
// expect:no-restricted-imports
import { metrics } from "@opentelemetry/api";

export const wired = {
  fastify,
  pg,
  drizzle,
  Queue,
  Redis,
  pino,
  injectable,
  Registry,
  metrics,
} as Record<string, unknown>;