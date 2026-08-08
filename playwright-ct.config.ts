import { defineConfig, devices } from "@playwright/experimental-ct-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./tests/components",
  timeout: 15_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  use: {
    ctViteConfig: {
      plugins: [tailwindcss(), tsconfigPaths()],
      resolve: {
        alias: [
          {
            find: "@/lib/api/candidates.functions",
            replacement: resolve("tests/components/api-stubs.ts"),
          },
          {
            find: "@/lib/api/profiling.functions",
            replacement: resolve("tests/components/api-stubs.ts"),
          },
        ],
      },
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
});
