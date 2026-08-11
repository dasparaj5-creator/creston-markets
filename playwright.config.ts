import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Creston Markets end-to-end scenario testing.
 *
 * By default this targets the LIVE site (crestonmarkets.com), since that's
 * where you've chosen to test. To run against localhost instead, set:
 *   TEST_BASE_URL=http://localhost:3000 npm test
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // scenarios often depend on shared state (seeded users) -- run sequentially
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.TEST_BASE_URL || "https://www.crestonmarkets.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
