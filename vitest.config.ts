import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "clarinet",
    environmentOptions: {
      clarinet: {
        coverage: false,
        costs: false,
        coverageFilename: "lcov.info",
        costsFilename: "costs-reports.json",
      },
    },
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*_test.ts", "tests/**/*.test.ts", "tests/**/*.spec.ts"],
  },
});
