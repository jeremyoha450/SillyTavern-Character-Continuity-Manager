import test from "node:test";
import assert from "node:assert/strict";

import {
    postProcessFacts
} from "../scripts/extraction/post-process.js";

import {
    validateHeightConfig,
    loadHeightDefaults,
    BUILT_IN_HEIGHT_CONFIG
} from "../scripts/config/height-defaults.js";

function makeFacts({
    age = "25",
    gender = "female",
    height = ""
} = {}) {
    return {
        age: { value: age, confidence: 80 },
        gender: { value: gender, confidence: 80 },
        height: { value: height, confidence: 0 }
    };
}

// Distinct numbers per age so tests can tell which entry
// was used. The 20 -> 23 gap exercises nearest/floor.
function makeConfig(overrides = {}) {
    return {
        byAge: {
            "18": {
                female: { short: 152, average: 163, tall: 172 },
                male: { short: 165, average: 176, tall: 188 }
            },
            "20": {
                female: { short: 154, average: 165, tall: 174 },
                male: { short: 167, average: 178, tall: 190 }
            },
            "23": {
                female: { short: 155, average: 166, tall: 175 },
                male: { short: 168, average: 180, tall: 192 }
            }
        },
        fallback: "nearest",
        unknownAge: "youngest",
        varietyCm: 0,
        format: "{cm} cm",
        keywords: {
            short: ["short", "petite", "small", "tiny"],
            tall: ["tall", "towering", "lanky", "statuesque"]
        },
        ...overrides
    };
}

function fill(facts, config = makeConfig()) {
    return postProcessFacts(facts, {
        characterId: "char_1",
        heightConfig: config
    });
}

// --- Age resolution ---

test("exact age match uses that entry", () => {

    const result = fill(
        makeFacts({ age: "20" })
    );

    assert.equal(result.height.value, "165 cm");
    assert.equal(result.height.confidence, 25);

});

test("ages above the highest entry clamp to it", () => {

    const result = fill(
        makeFacts({ age: "40" })
    );

    assert.equal(result.height.value, "166 cm");

});

test("nearest fallback picks the closest defined age", () => {

    // 22 sits in the 20..23 gap: |22-23| = 1 beats |22-20| = 2.
    const result = fill(
        makeFacts({ age: "22" })
    );

    assert.equal(result.height.value, "166 cm");

});

test("floor fallback picks the highest defined age at or below", () => {

    const result = fill(
        makeFacts({ age: "22" }),
        makeConfig({ fallback: "floor" })
    );

    assert.equal(result.height.value, "165 cm");

});

test("nearest ties round down to the lower age", () => {

    const config = makeConfig({
        byAge: {
            "20": {
                female: { short: 154, average: 165, tall: 174 },
                male: { short: 167, average: 178, tall: 190 }
            },
            "24": {
                female: { short: 156, average: 167, tall: 176 },
                male: { short: 169, average: 181, tall: 193 }
            }
        }
    });

    // 22 is equidistant from 20 and 24.
    const result = fill(
        makeFacts({ age: "22" }),
        config
    );

    assert.equal(result.height.value, "165 cm");

});

test("floor with no entry at or below uses the lowest entry", () => {

    const config = makeConfig({
        fallback: "floor",
        byAge: {
            "20": {
                female: { short: 154, average: 165, tall: 174 },
                male: { short: 167, average: 178, tall: 190 }
            },
            "23": {
                female: { short: 155, average: 166, tall: 175 },
                male: { short: 168, average: 180, tall: 192 }
            }
        }
    });

    const result = fill(
        makeFacts({ age: "18" }),
        config
    );

    assert.equal(result.height.value, "165 cm");

});

test("unknownAge 'youngest' fills from the lowest entry", () => {

    const result = fill(
        makeFacts({ age: "unknown" })
    );

    assert.equal(result.height.value, "163 cm");

});

test("unknownAge 'blank' skips the fill", () => {

    const result = fill(
        makeFacts({ age: "unknown" }),
        makeConfig({ unknownAge: "blank" })
    );

    assert.equal(result.height.value, "");
    assert.equal(result.height.confidence, 0);

});

// --- Descriptor words ---

test("'petite' resolves via the resolved age's short band", () => {

    const result = fill(
        makeFacts({ age: "23", height: "petite" })
    );

    assert.equal(
        result.height.value,
        "petite (155 cm)"
    );
    assert.equal(result.height.confidence, 50);

});

test("'tall' maps to the tall band for the character's gender", () => {

    const result = fill(
        makeFacts({
            age: "18",
            gender: "male",
            height: "tall"
        })
    );

    assert.equal(
        result.height.value,
        "tall (188 cm)"
    );
    assert.equal(result.height.confidence, 50);

});

test("descriptor keywords match as whole words inside phrases", () => {

    const result = fill(
        makeFacts({
            age: "18",
            height: "Towering and broad"
        })
    );

    assert.equal(
        result.height.value,
        "Towering and broad (172 cm)"
    );

});

test("an unmatched descriptor is left unchanged", () => {

    const result = fill(
        makeFacts({ height: "medium build" })
    );

    assert.equal(
        result.height.value,
        "medium build"
    );

});

// --- Numeric heights are never touched ---

for (
    const numeric of ["170cm", "5 feet", "5'4\"", "182 cm"]
) {

    test(`numeric height "${numeric}" is left as-is`, () => {

        const facts = makeFacts({ height: numeric });
        facts.height.confidence = 90;

        const result = fill(facts);

        assert.equal(result.height.value, numeric);
        assert.equal(result.height.confidence, 90);

    });

}

// --- Guards ---

test("under-18 characters use configured age defaults", () => {

    const config = makeConfig({
        byAge: {
            "16": {
                female: { short: 140, average: 160, tall: 180 },
                male: { short: 150, average: 170, tall: 190 }
            }
        }
    });

    const blank = fill(
        makeFacts({ age: "16" }),
        config
    );

    assert.equal(blank.height.value, "160 cm");
    assert.equal(blank.height.confidence, 25);

    const descriptor = fill(
        makeFacts({ age: "16", height: "short" }),
        config
    );

    assert.equal(
        descriptor.height.value,
        "short (140 cm)"
    );

});

test("unknown gender leaves height unchanged", () => {

    const blank = fill(
        makeFacts({ gender: "" })
    );

    assert.equal(blank.height.value, "");

    const descriptor = fill(
        makeFacts({ gender: "", height: "tall" })
    );

    assert.equal(descriptor.height.value, "tall");

});

// --- Variety ---

test("variety offset is deterministic per character and stays in range", () => {

    const config = makeConfig({ varietyCm: 5 });

    const options = {
        characterId: "char_stable_id",
        heightConfig: config
    };

    const first = postProcessFacts(
        makeFacts({ age: "18" }),
        options
    );
    const second = postProcessFacts(
        makeFacts({ age: "18" }),
        options
    );

    assert.equal(
        first.height.value,
        second.height.value
    );

    const cm = Number(
        first.height.value.replace(/\D+/g, "")
    );

    assert.ok(cm >= 158 && cm <= 168);

});

test("variety applies on top of a descriptor baseline", () => {

    const result = fill(
        makeFacts({ age: "18", height: "short" }),
        makeConfig({ varietyCm: 5 })
    );

    const cm = Number(
        result.height.value.replace(/\D+/g, "")
    );

    assert.ok(cm >= 147 && cm <= 157);
    assert.match(
        result.height.value,
        /^short \(\d+ cm\)$/
    );

});

test("custom format template is applied", () => {

    const result = fill(
        makeFacts({ age: "18" }),
        makeConfig({
            format: "about {cm} centimeters"
        })
    );

    assert.equal(
        result.height.value,
        "about 163 centimeters"
    );

});

// --- Config validation ---

test("a well-formed config validates", () => {

    const validated =
        validateHeightConfig(makeConfig());

    assert.ok(validated);
    assert.equal(
        validated.byAge["20"].female.average,
        165
    );
    assert.equal(validated.fallback, "nearest");
    assert.deepEqual(
        validated.keywords.short,
        ["short", "petite", "small", "tiny"]
    );

});

for (
    const [label, config] of [
        ["null", null],
        ["array", []],
        [
            "missing byAge",
            makeConfig({ byAge: undefined })
        ],
        [
            "empty byAge",
            makeConfig({ byAge: {} })
        ],
        [
            "non-positive byAge key",
            makeConfig({
                byAge: {
                    "0": {
                        female: { short: 150, average: 160, tall: 170 },
                        male: { short: 160, average: 170, tall: 180 }
                    }
                }
            })
        ],
        [
            "non-integer byAge key",
            makeConfig({
                byAge: {
                    "adult": {
                        female: { short: 150, average: 160, tall: 170 },
                        male: { short: 160, average: 170, tall: 180 }
                    }
                }
            })
        ],
        [
            "entry missing male",
            makeConfig({
                byAge: {
                    "18": {
                        female: { short: 150, average: 160, tall: 170 }
                    }
                }
            })
        ],
        [
            "zero band value",
            makeConfig({
                byAge: {
                    "18": {
                        female: { short: 0, average: 160, tall: 170 },
                        male: { short: 160, average: 170, tall: 180 }
                    }
                }
            })
        ],
        [
            "invalid fallback",
            makeConfig({ fallback: "ceiling" })
        ],
        [
            "invalid unknownAge",
            makeConfig({ unknownAge: "oldest" })
        ],
        [
            "negative varietyCm",
            makeConfig({ varietyCm: -2 })
        ],
        [
            "format without {cm}",
            makeConfig({ format: "cm" })
        ],
        [
            "missing keywords",
            makeConfig({ keywords: undefined })
        ],
        [
            "keywords.short not an array",
            makeConfig({
                keywords: {
                    short: "short",
                    tall: ["tall"]
                }
            })
        ]
    ]
) {

    test(`malformed config is rejected: ${label}`, () => {
        assert.equal(
            validateHeightConfig(config),
            null
        );
    });

}

test("loadHeightDefaults falls back to built-ins when the file cannot be fetched", async () => {

    // Under node the extension file is not served over HTTP,
    // so fetch fails — exactly the error path a broken
    // install would hit.
    const config = await loadHeightDefaults();

    assert.deepEqual(
        config,
        BUILT_IN_HEIGHT_CONFIG
    );

});

test("shipped config file is valid", async () => {

    const { readFile } = await import("node:fs/promises");

    const raw = JSON.parse(
        await readFile(
            new URL(
                "../config/heightDefaults.json",
                import.meta.url
            ),
            "utf8"
        )
    );

    assert.ok(validateHeightConfig(raw));

});
