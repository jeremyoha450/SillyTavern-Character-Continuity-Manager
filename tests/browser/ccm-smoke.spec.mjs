import { test, expect } from "@playwright/test";

const liveAI = process.env.CCM_E2E_LIVE_AI === "true";

async function openCCM(page) {
    await page.goto("/");
    await expect(page.locator("#ccm-launcher")).toBeVisible();
    await page.locator("#ccm-launcher").click();
    await expect(page.locator("#ccm-panel")).toBeVisible();
}

async function openFirstCharacter(page) {
    const row = page.locator(".ccm-character-row").first();
    test.skip(await row.count() === 0, "Create or load at least one CCM character first.");
    await row.click();
    await expect(page.locator("#ccm-dashboard-edit")).toBeVisible();
}

test("CCM launcher and character dashboard open", async ({ page }) => {
    await openCCM(page);
    await openFirstCharacter(page);
});

test("settings tabs open", async ({ page }) => {
    await openCCM(page);
    await page.locator("#ccm-open-settings").click();
    await expect(page.locator("#ccm-settings-dialog")).toBeVisible();

    await expect(page.locator("#ccm-settings-character-enrollment")).toHaveValue("ask");

    for (const tab of ["general", "provider", "image", "debug", "training", "health"]) {
        await page.locator(`[data-tab="${tab}"]`).click();
        await expect(page.locator(`[data-panel="${tab}"]`)).toBeVisible();
    }

    await page.locator('[data-tab="debug"]').click();
    await expect(page.locator("#ccm-debug-enabled")).toBeVisible();
    await expect(page.locator("#ccm-debug-log-viewer")).toBeVisible();
    const developerMode = page.locator("#ccm-debug-developer-mode");
    await developerMode.setChecked(false);
    await expect(page.locator("#ccm-developer-tools")).toBeHidden();
    await developerMode.setChecked(true);
    await expect(page.locator("#ccm-developer-tools")).toBeVisible();
    await expect(page.locator("#ccm-developer-tools button")).toHaveCount(0);
    await expect(page.locator("#ccm-developer-tools")).toContainText("Database Inspector");
    await expect(page.locator("#ccm-developer-tools")).toContainText("Deferred");
    await developerMode.setChecked(false);
    await expect(page.locator("#ccm-developer-tools")).toBeHidden();

    await page.locator('[data-tab="training"]').click();
    await expect(page.locator("#ccm-training-enabled")).toBeVisible();
    await expect(page.locator("#ccm-training-export")).toBeVisible();

    await page.locator('[data-tab="health"]').click();
    await expect(page.locator("#ccm-health-refresh")).toBeVisible();
});

test("statistics dialog opens", async ({ page }) => {
    await openCCM(page);
    await page.locator("#ccm-open-usage").click();
    await expect(page.locator("#ccm-usage-dialog")).toBeVisible();
    await expect(page.locator("#ccm-usage-clear")).toBeVisible();
});

test("character creator modal and wait layer states are correct", async ({ page }) => {
    await openCCM(page);
    await page.locator("#ccm-create-character").click();
    await expect(page.locator("#ccm-character-creator-dialog")).toBeVisible();
    await expect(page.locator("[data-creator-wait]")).toBeHidden();
    await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
    await page.locator("#ccm-character-creator-dialog").click({ position: { x: 5, y: 5 } });
    await expect(page.locator("#ccm-character-creator-dialog")).toBeVisible();
});

test("responsive dashboard switches between floating and popup modes", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await openCCM(page);
    await expect(page.locator("#ccm-panel")).toBeVisible();

    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(page.locator("#ccm-panel")).toBeVisible();
});

test("hostile toast content is rendered literally", async ({ page }) => {
    await page.goto("/");
    const hostile = '<img src=x onerror="globalThis.__ccmInjected=true">';
    const result = await page.evaluate(async text => {
        globalThis.__ccmInjected = false;
        const module = await import(
            "/scripts/extensions/third-party/SillyTavern-Character-Continuity-Manager/scripts/ui/status.js"
        );
        module.showCCMToast(text);
        const toast = document.querySelector("#ccm-toast");
        return {
            text: toast?.textContent || "",
            imageCount: toast?.querySelectorAll("img").length || 0,
            injected: globalThis.__ccmInjected
        };
    }, hostile);
    expect(result.text).toContain(hostile);
    expect(result.imageCount).toBe(0);
    expect(result.injected).toBe(false);
});

test("manual state update flow", async ({ page }) => {
    test.skip(!liveAI, "Set CCM_E2E_LIVE_AI=true to run provider-backed flows.");
    await openCCM(page);
    await openFirstCharacter(page);
    await page.locator("#ccm-dashboard-update-state").click();
    await expect(page.locator("#ccm-status-popup")).toBeVisible();
});

test("manual knowledge update flow", async ({ page }) => {
    test.skip(!liveAI, "Set CCM_E2E_LIVE_AI=true to run provider-backed flows.");
    await openCCM(page);
    await openFirstCharacter(page);
    await page.locator("#ccm-dashboard-update-knowledge").click();
    await expect(page.locator("#ccm-status-popup")).toBeVisible();
});

test("image prompt preview flow", async ({ page }) => {
    test.skip(!liveAI, "Set CCM_E2E_LIVE_AI=true to run provider-backed flows.");
    await openCCM(page);
    await openFirstCharacter(page);
    await page.locator("#ccm-dashboard-image-prompt").click();
    await expect(page.locator("#ccm-image-prompt-dialog")).toBeVisible({ timeout: 45_000 });
});
