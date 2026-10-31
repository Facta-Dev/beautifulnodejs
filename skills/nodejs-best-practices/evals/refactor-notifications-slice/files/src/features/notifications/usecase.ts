import { PgNotificationStore } from "./postgres.js";
import { OUTBOX_TOPIC, QUOTAS } from "#features/billing/domain.js";

// The notifications use case. BUGS, per the architecture contract:
// - it constructs/imports the concrete Pg adapter instead of storing the
//   consumer-defined NotificationStore port;
// - it imports the billing slice horizontally (cross-slice import);
// - a floating promise (the save below is not awaited, silenced instead of
//   fixed);
// - a boolean parameter (notify flag) that unreadably selects a mode;
// - it string-matches pg error messages to map errors (mapping belongs in the
//   adapter, once, on error codes);
// - exported functions miss explicit return types.

const STORE = new PgNotificationStore(process.env.DATABASE_URL ?? "");

export class NotificationsUseCase {
  constructor(private readonly store: PgNotificationStore = STORE) {}

  async enqueue(userId: string, subject: string, notify: boolean): Promise<void> {
    const quota = QUOTAS[userId] ?? 0;
    if (quota >= OUTBOX_TOPIC.limit) {
      throw new Error("notification quota exceeded");
    }
    const n = {
      id: crypto.randomUUID(),
      userId,
      subject,
      status: "pending",
      createdAtMs: Date.now(),
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.store.save(n);
    if (notify) {
      await this.store.markSent(n.id);
    }
  }

  // BUG: string-matching a foreign error message here is a second error
  // mapping — pg errors map to domain errors once, inside the adapter.
  async list(userId: string) {
    try {
      return await this.store.listForUser(userId);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("does not exist")) {
        return [];
      }
      throw e;
    }
  }
}

export function isBillingLocked(userId: string): boolean {
  return QUOTAS[userId] !== undefined && QUOTAS[userId] >= OUTBOX_TOPIC.limit;
}