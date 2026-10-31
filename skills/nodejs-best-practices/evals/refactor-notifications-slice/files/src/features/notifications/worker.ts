// The notifications worker. BUGS:
// - durable side effects ride setTimeout/setInterval — an in-process timer
//   dies with the process and loses the work; durable work goes through the
//   BullMQ outbox worker;
// - console.log on a processor path — structured logging goes through Pino;
// - reads env after startup;
// - retries are unbounded and lack backoff/dead-lettering.

interface OutboxRow {
  id: string;
  topic: string;
  attempts: number;
}

let rows: OutboxRow[] = [];

export function startNotificationWorker(): void {
  if (process.env.WORKER_MODE !== "queue") {
    // BUG: falling back to an in-process queue with no durability.
    setInterval(() => {
      process.env.WORKER_POLL_MS = process.env.WORKER_POLL_MS ?? "5000";
      const batch = rows.splice(0, 10);
      Promise.all(
        batch.map(async (row) => {
          console.log(`delivering ${row.topic} attempt ${row.attempts}`);
          rows = rows.filter((r) => r.id !== row.id);
        }),
      );
    }, 5_000);
  }
}

export function enqueueRow(row: OutboxRow): void {
  console.log(`enqueued ${row.topic}`);
  rows.push(row);
}