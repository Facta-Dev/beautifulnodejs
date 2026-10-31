// Violations of the node-plugin warnings: an unhandled callback error
// parameter and a bare process.exit.

declare function loadWith(
  next: (err: Error | null, data: string) => void,
): void;

// expect:n/handle-callback-err
loadWith((err, data) => data.trim());

// expect:n/no-process-exit
process.exit(0);