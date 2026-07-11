import { test } from "node:test";
import assert from "node:assert/strict";

import { formatImagePrompt } from "../scripts/tasks/image/formatter.js";

const tagPreset = {
    id: "test-tags",
    label: "Test Tags",
    mode: "tags",
    prefix: "",
    suffix: "",
    scoreTags: [],
    qualityTags: [],
    styleTags: [],
    requiredTags: [],
    negativePrompt: ""
};

test("tag formatting removes a later conflicting primary posture", () => {
    const result = formatImagePrompt(
        { positive: "1girl, standing, kneeling, on the rug" },
        tagPreset.id,
        tagPreset
    );

    assert.equal(result.positive, "1girl, standing, on the rug");
});

test("standing removes incompatible pose details and preserves rug location", () => {
    const result = formatImagePrompt(
        {
            positive:
                "1girl, standing, knees drawn up, barefoot, lying on the rug"
        },
        tagPreset.id,
        tagPreset
    );

    assert.equal(
        result.positive,
        "1girl, standing, barefoot, on the rug"
    );
});

test("a pose detail preceding the primary posture is still removed", () => {
    const result = formatImagePrompt(
        { positive: "1girl, knees drawn up, standing, barefoot" },
        tagPreset.id,
        tagPreset
    );

    assert.equal(result.positive, "1girl, standing, barefoot");
});

test("standing removes hugging-knees and knees-to-chest variants", () => {
    const result = formatImagePrompt(
        {
            positive:
                "1girl, standing, hugging own knees, knees drawn up to chest"
        },
        tagPreset.id,
        tagPreset
    );

    assert.equal(result.positive, "1girl, standing");
});

test("tag formatting leaves compatible pose detail untouched", () => {
    const result = formatImagePrompt(
        { positive: "1girl, standing, contrapposto, leaning forward" },
        tagPreset.id,
        tagPreset
    );

    assert.equal(
        result.positive,
        "1girl, standing, contrapposto, leaning forward"
    );
});

test("tag formatting converts abstract downward gaze into visual tags", () => {
    const result = formatImagePrompt(
        {
            positive:
                "1girl, head tilted down, looking at user's shoes"
        },
        tagPreset.id,
        tagPreset
    );

    assert.equal(
        result.positive,
        "1girl, head down, front view, body facing viewer, looking down"
    );
});

for (const target of [
    "looking at viewer's shoes",
    "looking at the viewer's shoes",
    "looking at viewer’s shoes"
]) {
    test(`tag formatting keeps the body front-facing for ${target}`, () => {
        const result = formatImagePrompt(
            { positive: `1girl, standing, ${target}` },
            tagPreset.id,
            tagPreset
        );

        assert.equal(
            result.positive,
            "1girl, standing, front view, body facing viewer, looking down"
        );
    });
}

test("completely nude strips echoed no-garment tags", () => {
    const result = formatImagePrompt(
        {
            positive:
                "completely nude, 1girl, solo, no shirt, no bra, no panties, barefoot, standing"
        },
        tagPreset.id,
        tagPreset
    );

    assert.equal(
        result.positive,
        "completely nude, 1girl, solo, barefoot, standing"
    );
});

test("topless strips upper no-garment tags but keeps lower ones", () => {
    const result = formatImagePrompt(
        {
            positive:
                "topless, 1girl, no shirt, no bra, no panties, blue skirt"
        },
        tagPreset.id,
        tagPreset
    );

    assert.equal(
        result.positive,
        "topless, 1girl, no panties, blue skirt"
    );
});

test("no-garment tags survive when no nudity tag is present", () => {
    const result = formatImagePrompt(
        { positive: "1girl, white shirt, blue skirt, no panties" },
        tagPreset.id,
        tagPreset
    );

    assert.equal(
        result.positive,
        "1girl, white shirt, blue skirt, no panties"
    );
});

test("the full nude trace formats without contradictions", () => {
    const llmOutput =
        "1girl, solo, petite, 23 years old, straight long black hair, brown eyes, white skin, small breasts, small butt, no shirt, no bra, no panties, barefoot, standing, body facing viewer, on the rug, left hand by side, right hand by side, head tilted down, looking at user's shoes, biting lip, embarrassed, flushed, indoors, detailed background";

    const result = formatImagePrompt(
        { positive: `completely nude, ${llmOutput}` },
        tagPreset.id,
        tagPreset
    );

    assert.equal(
        result.positive,
        "completely nude, 1girl, solo, petite, adult woman, straight long black hair, brown eyes, white skin, small breasts, small butt, barefoot, standing, body facing viewer, on the rug, left hand by side, right hand by side, head down, front view, looking down, biting lip, embarrassed, flushed, indoors, detailed background"
    );
});

test("tag formatting reinforces an explicitly adult age", () => {
    const result = formatImagePrompt(
        { positive: "1girl, petite, 23 years old" },
        tagPreset.id,
        tagPreset
    );

    assert.equal(result.positive, "1girl, petite, adult woman");
});
