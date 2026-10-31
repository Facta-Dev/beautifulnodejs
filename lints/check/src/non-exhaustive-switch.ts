// Violation of the exhaustive-switch rule: a discriminated union switch that
// misses a member. The tail return keeps `tsc --noEmit` clean without a
// default case, which would hide the gap.

type DispatchMode = "email" | "sms";

export function describeMode(mode: DispatchMode): string {
  // expect:@typescript-eslint/switch-exhaustiveness-check
  switch (mode) {
    case "email":
      return "email dispatch";
  }
  return "sms dispatch";
}