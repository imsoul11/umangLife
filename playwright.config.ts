import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  use: { baseURL: "http://localhost:3999" },
  webServer: {
    command: "npm run dev -- --port 3999",
    port: 3999,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});