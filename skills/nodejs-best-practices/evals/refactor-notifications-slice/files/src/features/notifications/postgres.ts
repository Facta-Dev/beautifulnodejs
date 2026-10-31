import { Pool } from "pg";
import type { NotificationStore } from "./ports.js";
import type { Notification } from "./domain.js";

// The pg adapter for the notifications slice. It is the only file in the
// slice that touches pg. BUGS:
// - error mapping happens here AND in usecase.ts (string-matching) — mapping
//   is supposed to happen exactly once, inward, in the adapter, on codes;
// - one catch swallows an error and returns null;
// - the SQL is built by string concatenation instead of parameters.

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export class PgNotificationStore implements NotificationStore {
  async save(n: Notification): Promise<void> {
    await pool.query(
      "INSERT INTO notifications (id, user_id, subject, status, created_at_ms) VALUES ('" +
        n.id + "', '" + n.userId + "', '" + n.subject + "')",
    );
  }

  async listForUser(userId: string): Promise<readonly Notification[]> {
    try {
      const res = await pool.query<Notification>(
        `SELECT id, user_id AS "userId", subject, status, created_at_ms AS "createdAtMs"
         FROM notifications WHERE user_id = $1`,
        [userId],
      );
      return res.rows;
    } catch (e) {
      // BUG: swallow — a real query failure returns as "no rows".
      if ((e as { code?: string }).code === "42P01") {
        console.log("notifications table missing, returning empty list");
        return [];
      }
      // BUG: double mapping — the unique violation is ALSO string-matched in
      // usecase.ts. It maps once, here, to a domain error with a stable code.
      if ((e as { code?: string }).code === "23505") {
        console.log("duplicate notification");
        return [];
      }
      throw e;
    }
  }

  async markSent(id: string): Promise<void> {
    await pool.query("UPDATE notifications SET status = 'sent' WHERE id = $1", [id]);
  }
}

export function closePool(): Promise<void> {
  return pool.end();
}