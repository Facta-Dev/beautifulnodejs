// The clean counterweight: not a single rule fires here. This is the shape
// the config expects everywhere: pino would log (never console), types are
// explicit, the port is defined where it is consumed, and no rule is muted.

import type { Queue } from "bullmq";

export interface DispatchPort {
  enqueue(payload: string): Promise<void>;
}

export function makePort(queue: Queue): DispatchPort {
  return {
    enqueue: async (payload: string): Promise<void> => {
      await queue.add("dispatch", { payload });
    },
  };
}

export const PORT_TOKEN = "ports.dispatch" as const;
export type PortToken = typeof PORT_TOKEN;

export function double(value: number): number {
  return value * 2;
}