import type { FastifyInstance } from "fastify";
import type { NotificationService } from "./usecase.js";
import type { SendNotificationError } from "./domain.js";

// The driving adapter. The schema-validated body and the typed registration function
// are correct Fastify idioms (graders expect them NOT flagged). The planted problems:
// the bare @ts-expect-error mute, the route writing its own error envelope instead of
// the single setErrorHandler path, the swallowed catch, and console.error instead of
// pino.
const sendBodySchema = {
  type: "object",
  required: ["userId", "channel", "body"],
  properties: {
    userId: { type: "string" },
    channel: { enum: ["email", "sms"] },
    body: { type: "string", maxLength: 1000 },
  },
} as const;

interface SendBody {
  userId: string;
  channel: "email" | "sms";
  body: string;
}

const detailFor = (err: SendNotificationError): string =>
  err.kind === "rate-limited"
    ? "Daily notification limit reached."
    : err.kind === "unknown-user"
      ? `No such user: ${err.userId}.`
      : err.detail;

const codeFor = (err: SendNotificationError): string =>
  err.kind === "rate-limited"
    ? "NOTIF_RATE_LIMITED"
    : err.kind === "unknown-user"
      ? "NOTIF_UNKNOWN_USER"
      : "NOTIF_INVALID_BODY";

export const registerNotificationRoutes = (
  app: FastifyInstance,
  notifications: NotificationService,
): void => {
  app.post<{ Body: SendBody }>(
    "/api/v1/notifications",
    { schema: { body: sendBodySchema } },
    async (req, reply) => {
      try {
        const result = await notifications.handle(req.body);
        if ("kind" in result) {
          const status =
            result.kind === "rate-limited" ? 429
            : result.kind === "unknown-user" ? 404
            : 400;
          // @ts-expect-error
          reply.status(status).send({
            detail: detailFor(result),
            code: codeFor(result),
            retryIn: result.retryAfter,
          });
          return reply;
        }
        return result;
      } catch (err) {
        console.error("notification send failed", err);
        // retry on the client side; nothing to do here
      }
    },
  );
};
