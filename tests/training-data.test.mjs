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
    clearTrainingData,
    createTrainingDataExport,
    getTrainingDataRecords,
    getTrainingDataSettings,
    maybeRecordTrainingExample,
    setTrainingDataSettings
} = await import("../scripts/training-data.js");

const { executeTask } = await import("../scripts/ai/execute-task.js");

function resetTraining() {
    clearTrainingData();
    setTrainingDataSettings({
        enabled: false,
        maxRecords: 100
    });
}

function sampleTask() {
    return {
        id: "state",
        name: "Character State",
        buildMessages: () => [
            { role: "system", content: "Return JSON." },
            { role: "user", content: "Scene text." }
        ],
        parse: JSON.parse
    };
}

test("training data logging is off by default", () => {
    resetTraining();
    assert.equal(getTrainingDataSettings().enabled, false);
});

test("training data records are not collected when disabled", () => {
    resetTraining();
    maybeRecordTrainingExample({
        taskId: "state",
        inputMessages: [{ role: "user", content: "private scene" }],
        rawAIResponse: '{"ok":true}',
        parsedOutput: { ok: true },
        parseSuccess: true
    });
    assert.equal(getTrainingDataRecords().length, 0);
});

test("training data records are collected when enabled", () => {
    resetTraining();
    setTrainingDataSettings({ enabled: true, maxRecords: 10 });

    maybeRecordTrainingExample({
        taskId: "state",
        source: "ccm",
        provider: "test-provider",
        model: "test-model",
        characterId: "char-1",
        scope: { type: "solo" },
        inputMessages: [{ role: "user", content: "private scene" }],
        rawAIResponse: '{"ok":true}',
        parsedOutput: { ok: true },
        parseSuccess: true,
        retryCount: 1
    });

    const records = getTrainingDataRecords();
    assert.equal(records.length, 1);
    assert.equal(records[0].taskId, "state");
    assert.equal(records[0].characterId, "char-1");
    assert.equal(records[0].parseSuccess, true);
    assert.equal(records[0].retryCount, 1);
});

test("training data redacts recognizable secrets and omits secret fields", () => {
    resetTraining();
    setTrainingDataSettings({ enabled: true, maxRecords: 10 });

    maybeRecordTrainingExample({
        taskId: "facts",
        inputMessages: [
            {
                role: "user",
                content: "apiKey: sk-secretsecretsecret and Bearer abc.def.ghi"
            }
        ],
        rawAIResponse: '{"authorization":"Bearer abc.def.ghi","safe":true}',
        parsedOutput: {
            safe: true,
            headers: { authorization: "Bearer abc.def.ghi" }
        },
        parseSuccess: true
    });

    const serialized = JSON.stringify(getTrainingDataRecords());
    assert.doesNotMatch(serialized, /sk-secretsecretsecret/);
    assert.doesNotMatch(serialized, /abc\.def\.ghi/);
    assert.doesNotMatch(serialized, /headers/i);
    assert.match(serialized, /REDACTED/);
});

test("training data export format is valid JSON", () => {
    resetTraining();
    setTrainingDataSettings({ enabled: true, maxRecords: 10 });
    maybeRecordTrainingExample({
        taskId: "knowledge",
        inputMessages: [{ role: "user", content: "chat text" }],
        rawAIResponse: '{"items":[]}',
        parsedOutput: { items: [] },
        parseSuccess: true
    });

    const exported = JSON.parse(createTrainingDataExport());
    assert.equal(exported.format, "ccm-training-data-v1");
    assert.equal(exported.count, 1);
    assert.equal(exported.records.length, 1);
});

test("training data clear removes all records", () => {
    resetTraining();
    setTrainingDataSettings({ enabled: true, maxRecords: 10 });
    maybeRecordTrainingExample({
        taskId: "image-prompt",
        inputMessages: [{ role: "user", content: "visual state" }],
        rawAIResponse: '{"prompt":"solo"}',
        parsedOutput: { prompt: "solo" },
        parseSuccess: true
    });
    assert.equal(getTrainingDataRecords().length, 1);

    clearTrainingData();
    assert.equal(getTrainingDataRecords().length, 0);
});

test("AI execution hook stores successful structured task examples when enabled", async () => {
    resetTraining();
    setTrainingDataSettings({ enabled: true, maxRecords: 10 });
    const extensionSettings = {};
    globalThis.SillyTavern = {
        getContext: () => ({
            mainApi: "openai",
            extensionSettings,
            saveSettingsDebounced: () => {},
            getChatCompletionModel: () => "test-model",
            generateRaw: async () => '{"ready":true}'
        })
    };

    const result = await executeTask(
        sampleTask(),
        {},
        { characterId: "char-2", scope: "solo" },
        { source: "sillytavern", maxRetries: 0 }
    );

    assert.deepEqual(result, { ready: true });
    const records = getTrainingDataRecords();
    assert.equal(records.length, 1);
    assert.equal(records[0].source, "sillytavern");
    assert.equal(records[0].model, "test-model");
    assert.equal(records[0].characterId, "char-2");
    assert.equal(records[0].rawAIResponse, '{"ready":true}');
    assert.deepEqual(records[0].parsedOutput, { ready: true });
    delete globalThis.SillyTavern;
});
