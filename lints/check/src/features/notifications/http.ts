// Violation of the slice-decoupling rule (http.ts): a slice may not import
// another slice's files, by alias or by nested path.
// expect:no-restricted-imports
import { invoiceLabel, invoiceTotal } from "#features/billing/domain.js";

export const renderInvoice = (cents: number): string =>
  `${invoiceLabel()} #${String(invoiceTotal(cents))}`;