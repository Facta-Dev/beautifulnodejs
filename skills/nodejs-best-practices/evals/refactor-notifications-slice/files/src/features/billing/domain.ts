// The billing slice's domain — a sibling slice the notifications slice must
// not import. If notifications needs quota data, it declares a port and the
// composition root wires an adapter.

export const OUTBOX_TOPIC = {
  name: "billing.invoice",
  limit: 100,
} as const;

export const QUOTAS: Record<string, number> = {
  "user-1": 3,
  "user-2": 120,
};