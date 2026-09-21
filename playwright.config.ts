import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright does not read .env.local the way Next does, so the Supabase
 * credentials the fixtures need have to be loaded explicitly. Existing
 * environment values win, so CI can override without editing a file.
 */
function loadEnvLocal() {
  try {
    const contents = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // No .env.local — CI is expected to supply the variables directly.
  }
}

loadEnvLocal();

/**
 * E2E configuration (requirements §70.3).
 *
 * Runs against a real dev server with the real Supabase project and the mock
 * AI provider, so the whole customer journey is exercised without spending
 * anything. `AI_MOCK_DELAY_MS=0` removes the simulated latency that exists to
 * make development feel realistic.
 */
export default defineConfig({
  testDir: "./e2e",
  // The journey is inherently sequential (a design must exist before it can be
  // composed), and parallel workers would race the same Supabase rows.
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3210",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx next dev --port 3210",
        port: 3210,
        reuseExistingServer: true,
        timeout: 180_000,
        env: { AI_MODE: "MOCK", AI_MOCK_DELAY_MS: "0" },
      },
});
