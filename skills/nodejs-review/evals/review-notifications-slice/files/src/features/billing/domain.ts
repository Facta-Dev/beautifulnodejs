// The billing slice's domain. Clean file: the notifications slice must not import it —
// slices do not import each other; the fix is a port or a promotion into #shared.
export type Cents = number & { readonly __brand: "Cents" };

export const cents = (n: number): Cents => n as Cents;

const SMS_SURCHARGE = 4;

export const surchargeFor = (channel: "email" | "sms"): Cents =>
  channel === "sms" ? cents(SMS_SURCHARGE) : cents(0);
