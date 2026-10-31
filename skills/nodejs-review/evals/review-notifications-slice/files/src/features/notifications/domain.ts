// The notifications domain: types, invariants, errors. Pure TypeScript.
// The zod import below is the planted violation the reviewer must catch: validation
// belongs at the edge (http.ts), the domain owns plain interfaces.
import { z } from "zod";

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  channel: z.enum(["email", "sms"]),
  body: z.string().min(1).max(1000),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export type SendNotificationError =
  | { kind: "rate-limited"; retryAfterSeconds: number }
  | { kind: "unknown-user"; userId: string }
  | { kind: "invalid-body"; detail: string };

export type SendNotificationCommand = {
  userId: string;
  channel: "email" | "sms";
  body: string;
};

export const DAILY_PER_USER_LIMIT = 5;
