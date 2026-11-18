import { defineConfig } from "vitest/config";
import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    // DOM-heavy suites need headroom for transforms and the supervising process.
    // Preserve the default single worker on one/two-CPU runners; cap larger hosts at two.
    maxWorkers: Math.max(1, Math.min(2, availableParallelism() - 1)),
    projects: [
      {
        extends: true,
        test: {
          name: "service",
          include: ["src/**/*.test.ts"],
          environment: "node",
          retry: 0,
          allowOnly: false,
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          include: ["src/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./tests/component-setup.ts"],
          retry: 0,
          allowOnly: false,
        },
      },
    ],
    retry: 0,
    allowOnly: false,
    reporters: ["verbose", "json"],
    outputFile: { json: "test-results/unit.json" },
  },
});
