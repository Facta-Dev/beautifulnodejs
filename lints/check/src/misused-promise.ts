// Violations of the misused-promise rule (checksVoidReturn): an async
// callback given to a void-returning API.

const rows: number[] = [1, 2, 3];

// expect:@typescript-eslint/no-misused-promises
rows.forEach(async (row) => {
  await Promise.resolve(row);
});