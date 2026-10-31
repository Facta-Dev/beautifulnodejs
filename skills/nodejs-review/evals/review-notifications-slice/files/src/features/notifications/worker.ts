import { Worker, type RedisOptions } from "bullmq";

// Planted violations: console logging instead of pino (with an eslint-disable mute),
// an in-process setTimeout doing durable retry work instead of BullMQ's capped
// exponential backoff with a dead-letter queue, and a swallowed failure.
const RETRY_MS = 60_000;

export const startNotificationWorker = (connection: RedisOptions): Worker => {
  const worker = new Worker(
    "notifications",
    async (job) => {
      console.log(`processing job ${job.id}`);
      await deliverNotification(job.data);
      setTimeout(() => {
        deliverNotification(job.data).catch(() => {
          // the next poll will pick it up
        });
      }, RETRY_MS);
    },
    { connection, concurrency: 4 },
  );
  worker.on("failed", (job, err) => {
    console.error(`job ${job?.id} failed: ${err.message}`);
  });
  return worker;
};

const deliverNotification = async (
  data: { userId: string; channel: string; body: string },
): Promise<void> => {
  await fetch("https://delivery.internal/send", {
    method: "post",
    body: JSON.stringify(data),
  });
};
