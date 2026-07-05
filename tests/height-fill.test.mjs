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

import {
    isUnderage
} from "../scripts/extraction/age-guard.js";

function makeFacts({
    age = "25",
    gender = "female",
    species = "Human",
    height = ""
} = {}) {
    return {
        age: { value: age, confidence: 80 },
        gender: { value: gender, confidence: 80 },
        species: { value: species, confidence: 80 },
        height: { value: height, confidence: 0 }
    };
}

function makeConfig(overrides = {}) {
    return {
        defaults: {
            female: { short: 152, average: 163, tall: 172 },
            male: { short: 165, average: 176, tall: 188 }
        },
        speciesOverrides: {},
        varietyCm: 0,
        format: "{cm} cm",
        keywords: {
            short: ["short", "petite", "small", "tiny"],
            tall: ["tall", "towering", "lanky", "statuesque"]
        },
        ...overrides
    };
}

// --- Blank height: average band ---

test("fills a blank height for an adult from the average default", () => {

    const result = postProcessFacts(
        makeFacts(),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
    );

    assert.equal(result.height.value, "163 cm");
    assert.equal(result.height.confidence, 25);

});

test("respects a custom defaults config", () => {

    const result = postProcessFacts(
        makeFacts({ gender: "male" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig({
                defaults: {
                    female: { short: 150, average: 170, tall: 180 },
                    male: { short: 170, average: 190, tall: 200 }
                }
            })
        }
    );

    assert.equal(result.height.value, "190 cm");

});

// --- Descriptor words ---

test("'short' maps to the short band and keeps the word", () => {

    const result = postProcessFacts(
        makeFacts({ height: "short" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
    );

    assert.equal(
        result.height.value,
        "short (152 cm)"
    );
    assert.equal(result.height.confidence, 50);

});

test("'tall' maps to the tall band for the character's gender", () => {

    const result = postProcessFacts(
        makeFacts({ gender: "male", height: "tall" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
    );

    assert.equal(
        result.height.value,
        "tall (188 cm)"
    );
    assert.equal(result.height.confidence, 50);

});

test("'petite' resolves through the keyword list", () => {

    const result = postProcessFacts(
        makeFacts({ height: "petite" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
    );

    assert.equal(
        result.height.value,
        "petite (152 cm)"
    );

});

test("descriptor keywords match as whole words inside phrases", () => {

    const result = postProcessFacts(
        makeFacts({ height: "Towering and broad" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
    );

    assert.equal(
        result.height.value,
        "Towering and broad (172 cm)"
    );

});

test("an unmatched descriptor is left unchanged", () => {

    const result = postProcessFacts(
        makeFacts({ height: "medium build" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
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

        const result = postProcessFacts(
            facts,
            {
                characterId: "char_1",
                heightConfig: makeConfig()
            }
        );

        assert.equal(result.height.value, numeric);
        assert.equal(result.height.confidence, 90);

    });

}

// --- Species overrides ---

test("species override wins over defaults (case-insensitive)", () => {

    const result = postProcessFacts(
        makeFacts({ species: "Elf" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig({
                speciesOverrides: {
                    "ELF": {
                        female: { short: 170, average: 180, tall: 195 }
                    }
                }
            })
        }
    );

    assert.equal(result.height.value, "180 cm");

});

test("species override short/tall bands are respected", () => {

    const config = makeConfig({
        speciesOverrides: {
            "elf": {
                female: { short: 170, average: 180, tall: 195 }
            }
        }
    });

    const short = postProcessFacts(
        makeFacts({ species: "Elf", height: "short" }),
        { characterId: "char_1", heightConfig: config }
    );

    const tall = postProcessFacts(
        makeFacts({ species: "Elf", height: "tall" }),
        { characterId: "char_1", heightConfig: config }
    );

    assert.equal(short.height.value, "short (170 cm)");
    assert.equal(tall.height.value, "tall (195 cm)");

});

test("zero-valued species override bands fall through to defaults", () => {

    const result = postProcessFacts(
        makeFacts({ species: "example-species" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig({
                speciesOverrides: {
                    "example-species": {
                        female: { short: 0, average: 0, tall: 0 },
                        male: { short: 0, average: 0, tall: 0 }
                    }
                }
            })
        }
    );

    assert.equal(result.height.value, "163 cm");

});

// --- Guards ---

test("under-18 characters never get a height fill", () => {

    const blank = postProcessFacts(
        makeFacts({ age: "16" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
    );

    assert.equal(blank.height.value, "");
    assert.equal(blank.height.confidence, 0);

    const descriptor = postProcessFacts(
        makeFacts({ age: "16", height: "short" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
    );

    assert.equal(
        descriptor.height.value,
        "short"
    );

});

test("unknown gender leaves height unchanged", () => {

    const blank = postProcessFacts(
        makeFacts({ gender: "" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
    );

    assert.equal(blank.height.value, "");

    const descriptor = postProcessFacts(
        makeFacts({ gender: "", height: "tall" }),
        {
            characterId: "char_1",
            heightConfig: makeConfig()
        }
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

    const first = postProcessFacts(makeFacts(), options);
    const second = postProcessFacts(makeFacts(), options);

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

    const result = postProcessFacts(
        makeFacts({ height: "short" }),
        {
            characterId: "char_stable_id",
            heightConfig: makeConfig({ varietyCm: 5 })
        }
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

    const result = postProcessFacts(
        makeFacts(),
        {
            characterId: "char_1",
            heightConfig: makeConfig({
                format: "about {cm} centimeters"
            })
        }
    );

    assert.equal(
        result.height.value,
        "about 163 centimeters"
    );

});

// --- Config validation ---

test("a well-formed config validates", () => {

    const validated = validateHeightConfig(makeConfig({
        speciesOverrides: {
            "example-species": {
                female: { short: 0, average: 0, tall: 0 }
            }
        }
    }));

    assert.ok(validated);
    assert.equal(
        validated.defaults.female.average,
        163
    );
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
            "missing defaults",
            makeConfig({ defaults: undefined })
        ],
        [
            "old flat defaults shape",
            makeConfig({
                defaults: { female: 163, male: 176 }
            })
        ],
        [
            "defaults missing a band",
            makeConfig({
                defaults: {
                    female: { short: 152, average: 163, tall: 172 },
                    male: { short: 165, average: 176 }
                }
            })
        ],
        [
            "non-numeric band value",
            makeConfig({
                defaults: {
                    female: { short: 152, average: "163", tall: 172 },
                    male: { short: 165, average: 176, tall: 188 }
                }
            })
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
        ],
        [
            "negative species override band",
            makeConfig({
                speciesOverrides: {
                    elf: { female: { short: -1 } }
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

// --- Age guard ---

test("isUnderage flags numeric ages below 18 only", () => {

    const facts = age => ({
        age: { value: age, confidence: 80 }
    });

    assert.equal(isUnderage(facts("16")), true);
    assert.equal(isUnderage(facts("17")), true);
    assert.equal(isUnderage(facts("18")), false);
    assert.equal(isUnderage(facts("25")), false);
    assert.equal(isUnderage(facts("")), false);
    assert.equal(isUnderage(facts("unknown")), false);
    assert.equal(isUnderage({}), false);
    assert.equal(isUnderage(null), false);

});
