// Violation of the floating-promise rule: an async call whose promise nobody
// awaits, catches, or returns.

async function persist(token: string): Promise<void> {
  await Promise.resolve(token);
}

// expect:@typescript-eslint/no-floating-promises
persist("dispatch");