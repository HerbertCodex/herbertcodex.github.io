import { defineConfig, devices } from "@playwright/test";

/**
 * The browser suite, run against the built site.
 *
 * It serves `.output/public` rather than the dev server: the dev server
 * proves that Vite compiles, which `build` already answers for. What is
 * worth a browser is the artefact that will actually be deployed.
 *
 * The accessibility gate lives in this suite under the `@a11y` tag rather
 * than in a runner of its own, because contrast, focus order and what a
 * screen reader announces are only measurable in a real browser.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:41732",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/serve-static.mjs 41732",
    url: "http://127.0.0.1:41732",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
