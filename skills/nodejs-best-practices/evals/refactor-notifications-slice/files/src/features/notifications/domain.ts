import { z } from "zod";

// The domain models notifications for the notifications slice. It should be
// pure, but the contractor pulled the wire schema in for "one helper".

// BUG: a wire/validation concern (zod) does not belong in the domain; the
// schema moves to http.ts, and the status becomes a closed union here.
export const NotificationStatusSchema = z.enum(["pending", "sent", "failed"]);

export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

export interface Notification {
  id: string;
  userId: string;
  subject: string;
  // BUG: typed as string, so "sent" and "Send" and "" are all valid; the
  // closed union above is the intended model.
  status: string;
  createdAtMs: number;
}

// BUG: a bare Error with a message forces callers to string-match; stable
// error codes belong on the AppError shape.
export function assertResendable(status: string): void {
  if (status === "sent") {
    throw new Error(`notification already sent: ${status}`);
  }
}

export function parseStatus(raw: string): NotificationStatus {
  const parsed = NotificationStatusSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return "pending";
}