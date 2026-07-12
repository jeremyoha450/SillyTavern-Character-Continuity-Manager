import test from "node:test";
import assert from "node:assert/strict";

import {
    clearDebugEntries,
    debugAIContent,
    debugLog,
    getDebugEntries,
    getDebugSettings,
    isDeveloperMode,
    setDebugSettings
} from "../scripts/debug-logger.js";

test("debug logging is disabled by default and respects category selection", () => {
    clearDebugEntries();
    setDebugSettings({ enabled: false, categories: ["images"] });
    assert.equal(debugLog("images", "started", { task: "image-prompt" }), null);

    setDebugSettings({ enabled: true, categories: ["images"] });
    assert.equal(debugLog("facts", "started", { task: "facts" }), null);
    assert.ok(debugLog("images", "started", { task: "image-prompt" }));
    assert.equal(getDebugEntries().length, 1);
});

test("AI content capture requires explicit opt-in and redacts credentials", () => {
    clearDebugEntries();
    setDebugSettings({
        enabled: true,
        categories: ["ai"],
        includeAIContent: false
    });
    assert.equal(debugAIContent("ai", "ai.input", { input: "private prompt" }), null);

    setDebugSettings({
        enabled: true,
        categories: ["ai"],
        includeAIContent: true
    });
    debugAIContent("ai", "ai.input", {
        input: {
            prompt: "private prompt",
            apiKey: "sk-abcdefghijklmnopqrstuvwxyz"
        }
    });

    const text = JSON.stringify(getDebugEntries());
    assert.match(text, /private prompt/);
    assert.doesNotMatch(text, /sk-abcdefghijklmnopqrstuvwxyz/);
    assert.match(text, /REDACTED/);
});

test("debug logging discards private and unapproved detail fields", () => {
    clearDebugEntries();
    setDebugSettings({ enabled: true, allCategories: true });
    debugLog("ai", "request", {
        task: "state",
        apiKey: "secret",
        endpoint: "https://private.example",
        prompt: "private roleplay",
        characterName: "Private Name"
    });

    const text = JSON.stringify(getDebugEntries());
    assert.match(text, /state/);
    assert.doesNotMatch(text, /secret|private\.example|private roleplay|Private Name/);
});

test("developer mode defaults off and persists through debug settings", () => {
    setDebugSettings({});
    assert.equal(getDebugSettings().developerMode, false);
    assert.equal(isDeveloperMode(), false);

    setDebugSettings({
        enabled: true,
        allCategories: true,
        developerMode: true
    });

    assert.equal(getDebugSettings().developerMode, true);
    assert.equal(isDeveloperMode(), true);

    setDebugSettings({
        enabled: true,
        allCategories: true,
        developerMode: false
    });

    assert.equal(getDebugSettings().developerMode, false);
    assert.equal(isDeveloperMode(), false);
});
