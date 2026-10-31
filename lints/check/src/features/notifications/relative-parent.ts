// Violation of the slice-decoupling rule (relative parent path): the sibling
// slice reached by walking up one directory. The alias group and the nested
// path group cannot see this form; the ../* groups seal it.
// expect:no-restricted-imports
import { invoiceTotal } from "../billing/domain.js";

export const renderInvoicePlain = (cents: number): string =>
  `#${String(invoiceTotal(cents))}`;