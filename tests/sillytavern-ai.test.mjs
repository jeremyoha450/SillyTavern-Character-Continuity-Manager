import test from "node:test";
import assert from "node:assert/strict";

import {
    executeWithSillyTavern,
    getSillyTavernModelInfo
} from "../scripts/ai/sillytavern.js";
import { migrateAISettings } from "../scripts/migrations.js";
import {
    getCharacterEnrollmentMode,
    setCharacterEnrollmentMode
} from "../scripts/ai/settings.js";

test("AI settings migration defaults and preserves the global AI source", () => {
    assert.equal(migrateAISettings({}).aiSource, "ccm");
    assert.equal(migrateAISettings({ aiSource: "sillytavern" }).aiSource, "sillytavern");
    assert.equal(migrateAISettings({ aiSource: "unknown" }).aiSource, "ccm");
    assert.equal(migrateAISettings({}).characterEnrollment, "ask");
    assert.equal(migrateAISettings({ characterEnrollment: "automatic" }).characterEnrollment, "automatic");
    assert.equal(migrateAISettings({ characterEnrollment: "unknown" }).characterEnrollment, "ask");
});

test("new character enrollment defaults to asking and accepts automatic mode", () => {
    assert.equal(getCharacterEnrollmentMode(), "ask");

    setCharacterEnrollmentMode("automatic");
    assert.equal(getCharacterEnrollmentMode(), "automatic");

    setCharacterEnrollmentMode("unsupported");
    assert.equal(getCharacterEnrollmentMode(), "ask");
});

test("SillyTavern AI source uses the active model and the task parser", async () => {
    let request;
    let parserInput;
    globalThis.SillyTavern = {
        getContext: () => ({
            mainApi: "openai",
            getChatCompletionModel: () => "qwen-32b",
            generateRaw: async value => {
                request = value;
                return '{"answer":"ready"}';
            }
        })
    };

    const task = {
        maxTokens: 8192,
        buildMessages: () => [
            { role: "system", content: "Return JSON." },
            { role: "user", content: "Create a character." }
        ],
        parse: (text, input) => {
            parserInput = input;
            return JSON.parse(text);
        }
    };
    const input = { authoritative: "original user input" };
    const response = await executeWithSillyTavern(task, input);

    assert.deepEqual(response, {
        result: { answer: "ready" },
        model: "qwen-32b"
    });
    assert.equal(request.systemPrompt, "Return JSON.");
    assert.equal(request.responseLength, 8192);
    assert.equal(parserInput, input);
    assert.deepEqual(request.prompt, [
        { role: "user", content: "Create a character." }
    ]);
    assert.deepEqual(getSillyTavernModelInfo(), {
        provider: "openai",
        model: "qwen-32b",
        contextTokens: null
    });

    delete globalThis.SillyTavern;
});
