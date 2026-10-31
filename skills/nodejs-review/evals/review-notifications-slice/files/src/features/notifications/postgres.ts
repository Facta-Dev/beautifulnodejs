import type { Pool } from "pg";
import type { Notification } from "./domain.js";
import type { NotificationStore } from "./ports.js";

// The adapter. Clean by design: it implements NotificationStore structurally, owns the
// only pg import in the slice, and its queries are parameterized. Reviewers should
// credit it in "What's already good".
export class PgNotificationStore implements NotificationStore {
  constructor(private readonly pool: Pool) {}

  async save(notification: Notification): Promise<void> {
    await this.pool.query(
      `insert into notifications (id, user_id, channel, body, created_at)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do update set body = excluded.body`,
      [
        notification.id,
        notification.userId,
        notification.channel,
        notification.body,
        notification.createdAt,
      ],
    );
  }

  async countSince(userId: string, sinceIso: string): Promise<number> {
    const result = await this.pool.query(
      "select count(*)::int as n from notifications where user_id = $1 and created_at >= $2",
      [userId, sinceIso],
    );
    const row = result.rows[0];
    return row === undefined ? 0 : Number(row["n"]);
  }
}
