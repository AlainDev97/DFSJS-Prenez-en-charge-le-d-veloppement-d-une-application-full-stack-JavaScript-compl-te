import { defineConfig, devices } from "@playwright/test";
import { e2eDatabaseUrl } from "./scripts/e2e-env.mjs";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,
  workers: 1,

  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      name: "Express E2E",
      command: "npm --prefix backend run dev",
      url: "http://localhost:4100/api/health/db",
      reuseExistingServer: false,
      timeout: 120_000,

      env: {
        DATABASE_URL: e2eDatabaseUrl,
        PORT: "4100",
        FRONTEND_URL: "http://localhost:3100",
        SESSION_SECRET: process.env.E2E_SESSION_SECRET!,
        NODE_ENV: "test",
      },
    },
    {
      name: "Next.js E2E",
      command: "npm --prefix frontend run dev -- --port 3100",
      url: "http://localhost:3100/login",
      reuseExistingServer: false,
      timeout: 120_000,

      env: {
        NEXT_PUBLIC_API_URL: "http://localhost:4100",
        API_INTERNAL_URL: "http://localhost:4100",
      },
    },
  ],
});
