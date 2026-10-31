// Violations of the boundary-types rule: exports without explicit return
// types, and the unnecessary-assertion probe (explicitly pinned rule that the
// preset also carries).

// expect:@typescript-eslint/explicit-module-boundary-types
export function labelOf(value: string) {
  return value.toUpperCase();
}

// expect:@typescript-eslint/explicit-module-boundary-types
export const shout = (value: string) => value.toUpperCase();

export function assertedCopy(value: string): string {
  // expect:@typescript-eslint/no-unnecessary-type-assertion
  return value as string;
}