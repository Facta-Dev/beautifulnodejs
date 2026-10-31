import type { Notification } from "./domain.js";

// Consumer-defined ports: the use case needs exactly these, the adapter satisfies
// them structurally. This file is clean and stays that way.
export interface NotificationStore {
  save(notification: Notification): Promise<void>;
  countSince(userId: string, sinceIso: string): Promise<number>;
}

export interface Clock {
  nowIso(): string;
}
