import { browserEvidenceDirectory } from "./scripts/browser-batch-path.mjs";
import { sitePath } from "./src/content/site-path";
import { defineConfig, devices } from "@playwright/test";
const liveEmail = process.env.RELEASE_PROFILE === "live-email";
export default defineConfig({
  testDir: "./tests",
  testMatch: liveEmail
    ? "live-email.spec.ts"
    : ["customer.spec.ts", "experiment.spec.ts"],
  outputDir: `${browserEvidenceDirectory()}/browser-artifacts`,
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  // Keep browser cases from competing for the private runner's CPU and memory.
  // Concurrency scenarios still issue competing requests within their case.
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: `${browserEvidenceDirectory()}/browser.json` }],
    ["./scripts/browser-evidence.mjs"],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" },
    },
    {
      name: "phone-webkit",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
    {
      name: "tablet-webkit",
      use: { ...devices["iPad (gen 7)"], browserName: "webkit" },
    },
  ],
  webServer: {
    command: "node scripts/serve-export.mjs --experiment",
    url: `http://127.0.0.1:4173${sitePath("/")}`,
    reuseExistingServer: false,
  },
});
