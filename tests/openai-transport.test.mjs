import test from "node:test";
import assert from "node:assert/strict";

import { sendOpenAIChat } from "../scripts/drivers/openai-transport.js";

const task = {
    temperature: 0,
    buildMessages: () => [{ role: "user", content: "test" }],
    parse: JSON.parse
};

test("OpenAI-compatible requests allow enough output for the state schema", async () => {
    let requestBody;
    globalThis.fetch = async (url, options) => {
        requestBody = JSON.parse(options.body);
        return {
            ok: true,
            json: async () => ({
                choices: [{
                    message: { content: "{}" },
                    finish_reason: "stop"
                }]
            })
        };
    };

    await sendOpenAIChat({
        task,
        settings: { model: "local-model" },
        input: "test",
        endpoint: "http://localhost/v1"
    });

    assert.equal(requestBody.max_tokens, 4096);
});

test("OpenAI-compatible truncation reports the output-limit cause", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({
            choices: [{
                message: { content: '{"unfinished":' },
                finish_reason: "length"
            }]
        })
    });

    await assert.rejects(
        sendOpenAIChat({
            task,
            settings: { model: "local-model" },
            input: "test",
            endpoint: "http://localhost/v1",
            providerName: "Local provider"
        }),
        /reached its output limit/
    );
});

test("OpenRouter-style HTTP 200 choice errors preserve the provider cause", async () => {
    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
            choices: [{
                message: { content: "" },
                finish_reason: "error",
                error: {
                    code: 503,
                    message: "Provider overloaded",
                    metadata: { error_type: "provider_overloaded" }
                }
            }]
        })
    });

    await assert.rejects(
        sendOpenAIChat({
            task,
            settings: { model: "remote-model" },
            input: "test",
            endpoint: "https://example.invalid/v1",
            providerName: "OpenRouter"
        }),
        error => error.category === "provider_overloaded" && error.retryable === true
    );
});
