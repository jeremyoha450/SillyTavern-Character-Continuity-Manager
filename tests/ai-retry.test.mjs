import test from "node:test";
import assert from "node:assert/strict";

const storageValues = new Map();
globalThis.localStorage = {
    getItem: key => storageValues.get(key) ?? null,
    setItem: (key, value) => storageValues.set(key, value),
    removeItem: key => storageValues.delete(key)
};
globalThis.document = {
    addEventListener: () => {},
    dispatchEvent: () => {}
};

const {
    buildCorrectiveRetryTask,
    executeTask,
    isRetryableAIOutputError
} = await import("../scripts/ai/execute-task.js");

function retryTask(parse = JSON.parse) {
    return {
        id: "state",
        name: "Character State",
        temperature: 0.5,
        maxTokens: 100,
        buildMessages: () => [
            { role: "system", content: "Return state JSON." },
            { role: "user", content: "Current scene." }
        ],
        parse
    };
}

test("corrective retry task preserves the original prompt and adds strict JSON correction", () => {
    const corrected = buildCorrectiveRetryTask(retryTask(), '{"broken":');
    const messages = corrected.buildMessages({});

    assert.equal(corrected.temperature, 0);
    assert.equal(messages.at(-2).role, "assistant");
    assert.equal(messages.at(-2).content, '{"broken":');
    assert.match(messages.at(-1).content, /Return ONLY valid JSON/);
    assert.match(messages.at(-1).content, /Do not use markdown/);
});

test("AI execution retries malformed output once and succeeds", async () => {
    const requests = [];
    const responses = ['{"broken":', '{"ready":true}'];
    globalThis.SillyTavern = {
        getContext: () => ({
            mainApi: "openai",
            extensionSettings: {},
            saveSettingsDebounced: () => {},
            getChatCompletionModel: () => "test-model",
            generateRaw: async request => {
                requests.push(request);
                return responses.shift();
            }
        })
    };

    const result = await executeTask(
        retryTask(),
        {},
        {},
        { source: "sillytavern" }
    );

    assert.deepEqual(result, { ready: true });
    assert.equal(requests.length, 2);
    assert.match(requests[1].prompt.at(-1).content, /previous response was invalid/i);
    delete globalThis.SillyTavern;
});

test("AI execution stops after one failed corrective retry", async () => {
    let attempts = 0;
    globalThis.SillyTavern = {
        getContext: () => ({
            mainApi: "openai",
            extensionSettings: {},
            saveSettingsDebounced: () => {},
            getChatCompletionModel: () => "test-model",
            generateRaw: async () => {
                attempts++;
                return '{"still":';
            }
        })
    };

    await assert.rejects(
        executeTask(retryTask(), {}, {}, { source: "sillytavern" }),
        error => error.name === "AIRetryError" && /after one corrective retry/i.test(error.message)
    );
    assert.equal(attempts, 2);
    delete globalThis.SillyTavern;
});

test("retry classification excludes ordinary provider failures", () => {
    assert.equal(
        isRetryableAIOutputError(retryTask(), new Error("Authentication failed")),
        false
    );
    assert.equal(
        isRetryableAIOutputError(retryTask(), new Error("State response was not valid JSON")),
        true
    );
});
