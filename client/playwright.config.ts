import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1280, height: 720 }, // primary play surface: ordinary laptop landscape
  },
  webServer: [
    {
      command: "pnpm --filter @treasure-trap/server dev",
      url: "http://localhost:3001/health",
      reuseExistingServer: true,
      cwd: "..",
      timeout: 30_000,
    },
    {
      command: "pnpm --filter @treasure-trap/client dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      cwd: "..",
      timeout: 30_000,
    },
  ],
});
