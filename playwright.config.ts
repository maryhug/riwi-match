import { defineConfig, devices } from "@playwright/test";

const e2ePort = Number(process.env.PLAYWRIGHT_PORT ?? "8080");
const baseURL = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "tests/.auth/admin.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "node tests/fixtures/mock-api.mjs",
      url: "http://127.0.0.1:9090/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${e2ePort}`,
      url: baseURL,
      env: {
        API_BASE_URL: "http://127.0.0.1:9090",
        APP_ENV: "test",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
