import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: ".",
    testMatch: "**/*.spec.mjs",
    timeout: 45_000,
    expect: { timeout: 8_000 },
    use: {
        baseURL: process.env.CCM_SILLYTAVERN_URL || "http://127.0.0.1:8000",
        headless: process.env.CCM_E2E_HEADLESS !== "false",
        trace: "retain-on-failure",
        screenshot: "only-on-failure"
    },
    reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]]
});
