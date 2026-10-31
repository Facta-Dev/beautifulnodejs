// Clean counterweight: another slice's domain, which the wall must leave
// alone. Its exports are imported by the notifications violations, and the
// file itself proves the config stays quiet on the allowed edges.

export function invoiceLabel(): string {
  return "invoice-total";
}

export function invoiceTotal(cents: number): number {
  return Math.max(0, cents);
}