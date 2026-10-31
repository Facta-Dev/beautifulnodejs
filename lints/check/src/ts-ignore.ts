// Violations of the silencing rule: ts-ignore and a reason-less
// ts-expect-error are errors, ts-nocheck is file-wide and flat out.
// Each directive suppresses a real type error so `tsc --noEmit` stays green.

// expect:@typescript-eslint/ban-ts-comment
// @ts-ignore
const muted: number = "not a number";

// expect:@typescript-eslint/ban-ts-comment
// @ts-expect-error
const narrowed: number = "not a number";

export const silenceProbe: number = muted - narrowed;