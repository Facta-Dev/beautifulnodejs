import type { Notification } from "./domain.js";

// The ports the notifications use case consumes. Consumer-defined: the use
// case wrote these interfaces shaped to its needs; adapters satisfy them
// structurally.

export interface NotificationStore {
  save(n: Notification): Promise<void>;
  listForUser(userId: string): Promise<readonly Notification[]>;
  markSent(id: string): Promise<void>;
}

export interface OutboxPublisher {
  append(topic: "email.verification" | "email.password_reset", payload: unknown): Promise<void>;
}