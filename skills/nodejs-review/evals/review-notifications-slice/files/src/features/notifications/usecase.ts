import { Pool } from "pg";
import { surchargeFor } from "../billing/domain.js";
import type {
  Notification,
  SendNotificationCommand,
  SendNotificationError,
} from "./domain.js";
import { DAILY_PER_USER_LIMIT } from "./domain.js";
import { PgNotificationStore } from "./postgres.js";

// Planted violations in this file: imports pg's Pool and the concrete PgNotificationStore
// adapter instead of the NotificationStore port, imports the billing slice sideways,
// fires an unawaited store.save() (floating promise), logs via console.log, names itself
// Service, and reads the wall clock instead of an injected Clock.
export class NotificationService {
  private readonly store: PgNotificationStore;
  private readonly pool: Pool;

  constructor(store: PgNotificationStore, pool: Pool) {
    this.store = store;
    this.pool = pool;
  }

  async handle(
    cmd: SendNotificationCommand,
  ): Promise<Notification | SendNotificationError> {
    const userRows = await this.pool.query(
      "select id from users where id = $1",
      [cmd.userId],
    );
    if (userRows.rowCount === 0) {
      return { kind: "unknown-user", userId: cmd.userId };
    }
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const recent = await this.store.countSince(cmd.userId, since);
    if (recent >= DAILY_PER_USER_LIMIT) {
      return { kind: "rate-limited", retryAfterSeconds: 3600 };
    }

    const notification: Notification = {
      id: await this.nextNotificationId(),
      userId: cmd.userId,
      channel: cmd.channel,
      body: cmd.body,
      createdAt: new Date().toISOString(),
    };
    void this.store.save(notification);
    console.log(
      `notification ${notification.id} sent, surcharge ${surchargeFor(cmd.channel)} cents`,
    );
    return notification;
  }

  private async nextNotificationId(): Promise<string> {
    const row = await this.pool.query("select gen_random_uuid() v");
    const value = row.rows[0];
    return value === undefined ? "" : String(value["v"]);
  }
}
