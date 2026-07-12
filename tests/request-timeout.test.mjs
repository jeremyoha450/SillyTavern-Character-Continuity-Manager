import test from "node:test";
import assert from "node:assert/strict";
import { sendOpenAIChat } from "../scripts/drivers/openai-transport.js";

test("OpenAI-compatible transport forwards an abort signal", async () => {
    const previous = globalThis.fetch;
    let signal;
    globalThis.fetch = async (_url, options) => {
        signal = options.signal;
        return {
            ok: true,
            json: async () => ({ choices: [{ message: { content: "{}" }, finish_reason: "stop" }] })
        };
    };
    await sendOpenAIChat({
        task: { temperature: 0, buildMessages: () => [], parse: JSON.parse },
        settings: { model: "test" }, input: {}, endpoint: "http://localhost/v1"
    });
    assert.equal(signal instanceof AbortSignal, true);
    globalThis.fetch = previous;
});
