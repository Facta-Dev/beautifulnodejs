// Violation of the type-imports rule: a type-only use of a value import that
// should be `import type`.

// expect:@typescript-eslint/consistent-type-imports
import { URLSearchParams } from "node:url";

export const makeQuery = (params: URLSearchParams): string =>
  params.toString();