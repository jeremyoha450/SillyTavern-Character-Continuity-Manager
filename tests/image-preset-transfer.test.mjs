import test from "node:test";
import assert from "node:assert/strict";

import {
    createCustomPreset,
    createPresetExport,
    uniquePresetId,
    validateImportedPreset
} from "../scripts/image-preset-transfer.js";

const valid = {
    id: "my-preset",
    label: "My Preset",
    mode: "tags",
    systemPrompt: "Return JSON tags.",
    prefix: "safe",
    suffix: "",
    qualityTags: ["high quality"],
    scoreTags: [],
    styleTags: ["anime"],
    requiredTags: [],
    negativePrompt: "bad anatomy"
};

test("preset export round-trips through validation", () => {
    const exported = createPresetExport(valid);
    const imported = validateImportedPreset(JSON.parse(JSON.stringify(exported)));

    assert.equal(exported.type, "ccm-image-prompt-preset");
    assert.equal(imported.label, "My Preset");
    assert.deepEqual(imported.qualityTags, ["high quality"]);
});

test("preset import rejects missing prompts and invalid tag fields", () => {
    assert.throws(
        () => validateImportedPreset({ label: "Broken", mode: "tags" }),
        /system prompt/i
    );
    assert.throws(
        () => validateImportedPreset({ ...valid, qualityTags: "high" }),
        /must be a list/i
    );
});

test("custom preset names receive stable unique IDs", () => {
    assert.equal(uniquePresetId("My Preset", ["my-preset"]), "my-preset-2");
    const custom = createCustomPreset(valid, "Shared Style", ["shared-style"]);
    assert.equal(custom.id, "shared-style-2");
    assert.equal(custom.label, "Shared Style");
    assert.equal(custom.custom, true);
});
