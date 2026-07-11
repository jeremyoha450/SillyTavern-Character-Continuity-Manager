import { test } from "node:test";
import assert from "node:assert/strict";

import {
    deriveNudityTag,
    applyNudityBackstop
} from "../scripts/tasks/image/nudity.js";

const tagPreset = { mode: "tags" };
const nlPreset = { mode: "natural-language" };

test("all garments removed derives completely nude", () => {
    assert.equal(
        deriveNudityTag({
            upper: "no shirt",
            lower: "no shorts",
            underwearTop: "no bra",
            underwearBottom: "no panties",
            footwear: "barefoot"
        }),
        "completely nude"
    );
});

test("outer clothing removed with underwear worn derives underwear only", () => {
    assert.equal(
        deriveNudityTag({
            upper: "no shirt",
            lower: "no skirt",
            underwearTop: "black lace bra",
            underwearBottom: "black lace panties"
        }),
        "underwear only"
    );
});

test("bare upper half with lower clothing derives topless", () => {
    assert.equal(
        deriveNudityTag({
            upper: "no shirt",
            lower: "blue jeans",
            underwearTop: "no bra",
            underwearBottom: "white cotton panties"
        }),
        "topless"
    );
});

test("bare lower half with upper clothing derives bottomless", () => {
    assert.equal(
        deriveNudityTag({
            upper: "white shirt",
            lower: "no shorts",
            underwearTop: "no bra",
            underwearBottom: "no panties"
        }),
        "bottomless"
    );
});

test("a worn outerwear layer prevents a topless reading", () => {
    assert.equal(
        deriveNudityTag({
            upper: "no shirt",
            outerwear: "grey hoodie",
            lower: "blue jeans",
            underwearTop: "no bra",
            underwearBottom: "white cotton panties"
        }),
        ""
    );
});

test("a clothed character derives no nudity tag", () => {
    assert.equal(
        deriveNudityTag({
            upper: "white shirt",
            lower: "blue skirt",
            underwearTop: "white bra",
            underwearBottom: "white panties"
        }),
        ""
    );
});

test("blank clothing fields stay covered by default", () => {
    assert.equal(deriveNudityTag({}), "");
    assert.equal(
        deriveNudityTag({
            underwearTop: "no bra",
            underwearBottom: "no panties"
        }),
        ""
    );
});

test("the backstop prepends the missing tag in tags mode", () => {
    const result = applyNudityBackstop(
        { positive: "1girl, solo, standing", negative: "" },
        {
            upper: "no shirt",
            lower: "no shorts",
            underwearTop: "no bra",
            underwearBottom: "no panties"
        },
        tagPreset
    );

    assert.equal(
        result.positive,
        "completely nude, 1girl, solo, standing"
    );
});

test("the backstop leaves a prompt alone when nudity is already tagged", () => {
    const parsed = {
        positive: "1girl, solo, completely nude, standing",
        negative: ""
    };

    const result = applyNudityBackstop(
        parsed,
        {
            upper: "no shirt",
            lower: "no shorts",
            underwearTop: "no bra",
            underwearBottom: "no panties"
        },
        tagPreset
    );

    assert.equal(result.positive, parsed.positive);
});

test("the backstop leaves a clothed prompt alone", () => {
    const parsed = { positive: "1girl, solo, white shirt", negative: "" };

    const result = applyNudityBackstop(
        parsed,
        { upper: "white shirt", lower: "blue skirt" },
        tagPreset
    );

    assert.equal(result.positive, parsed.positive);
});

test("the backstop appends a sentence in natural-language mode", () => {
    const result = applyNudityBackstop(
        {
            positive:
                "an anime-style digital illustration of a young woman standing on a rug.",
            negative: ""
        },
        {
            upper: "no shirt",
            lower: "no shorts",
            underwearTop: "no bra",
            underwearBottom: "no panties"
        },
        nlPreset
    );

    assert.equal(
        result.positive,
        "an anime-style digital illustration of a young woman standing on a rug. The character is completely nude."
    );
});
