// Violations of the I/O wall (domain.ts): every path and pattern the domain
// override forbids, one marker each. scripts/check-lints.sh proves each one
// fires; billing (another slice) proves the shared rules stay quiet elsewhere.

// expect:no-restricted-imports
import fastify from "fastify";
// expect:no-restricted-imports
import { z } from "zod";
// expect:no-restricted-imports
import { injectable } from "tsyringe";
// expect:no-restricted-imports
import "reflect-metadata";
// expect:no-restricted-imports
import { drizzle } from "drizzle-orm/node-postgres";
// expect:no-restricted-imports
import pg from "pg";
// expect:no-restricted-imports
import { Queue } from "bullmq";
// expect:no-restricted-imports
import Redis from "ioredis";
// expect:no-restricted-imports
import { pino } from "pino";
// expect:no-restricted-imports
import { Registry } from "prom-client";

// expect:no-restricted-imports
import { trace } from "@opentelemetry/api";

// expect:no-restricted-imports
import { invoiceTotal } from "#features/billing/domain.js";

export const dependencies = {
  fastify,
  z,
  injectable,
  drizzle,
  pg,
  Queue,
  Redis,
  pino,
  Registry,
  trace,
  invoiceTotal,
} as Record<string, unknown>;