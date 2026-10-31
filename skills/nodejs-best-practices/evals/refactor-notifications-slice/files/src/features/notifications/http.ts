import type { FastifyInstance } from "fastify";
import type { NotificationsUseCase } from "./usecase.js";
import { assertResendable, NotificationStatusSchema } from "./domain.js";

// The HTTP adapter for the notifications slice. BUG: each route writes its own
// error JSON — a second error envelope. The envelope is written exactly once
// by the composition root's setErrorHandler; routes throw AppError (or map
// through apperr.from()) and let it render. Also: err.message leaks internals
// into the 500 body.

interface CreateNotificationBody {
  subject: string;
}

export const registerNotifications = (app: FastifyInstance, uc: NotificationsUseCase): void => {
  app.post("/api/v1/notifications", async (req, reply) => {
    const body = NotificationStatusSchema.parse(req.body); // wrong schema for this route; placeholder validation
    const { subject } = body as unknown as CreateNotificationBody;
    await uc.enqueue(req.headers["x-user-id"] as string, subject, true);
    void reply;
    return { id: "queued" };
  });

  app.post("/api/v1/notifications/:id/resend", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    try {
      assertResendable("pending");
      await uc.enqueue(id, "resend", true);
      return { ok: true };
    } catch (e) {
      // BUG: second envelope writer + internals leak.
      const message = e instanceof Error ? e.message : "unknown";
      if (message.includes("already sent")) {
        void reply.status(409);
        return { error: message };
      }
      void reply.status(500);
      return { error: e instanceof Error ? e.stack : "unknown" };
    }
  });
};