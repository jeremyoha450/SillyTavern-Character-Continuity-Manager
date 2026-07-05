import { test } from "node:test";
import assert from "node:assert/strict";

import { readFile } from "node:fs/promises";

import {
    postProcessState,
    enforceConsistency
} from "../scripts/extraction/post-process.js";

function field(value, confidence = 80) {
    return { value, confidence };
}

// --- Garment reroute: upper -> underwearTop ---

for (
    const garment of
    ["sports bra", "singlet", "camisole"]
) {

    test(
        `moves "${garment}" from upper to underwearTop`,
        () => {

            const result = postProcessState({
                upper: field(garment, 90),
                underwearTop: field("")
            });

            assert.equal(
                result.underwearTop.value,
                garment
            );
            assert.equal(
                result.underwearTop.confidence,
                90
            );
            assert.equal(
                result.upper.value,
                "no shirt"
            );
            assert.equal(
                result.upper.confidence,
                75
            );

        }
    );

}

test(
    "overwrites a 'no bra'-style underwearTop value",
    () => {

        const result = postProcessState({
            upper: field("black lace bra", 85),
            underwearTop: field("no bra", 60)
        });

        assert.equal(
            result.underwearTop.value,
            "black lace bra"
        );
        assert.equal(
            result.underwearTop.confidence,
            85
        );
        assert.equal(
            result.upper.value,
            "no shirt"
        );

    }
);

test(
    "does not treat 'braided' as a bra (word match)",
    () => {

        const result = postProcessState({
            upper: field("braided leather harness"),
            underwearTop: field("")
        });

        assert.equal(
            result.upper.value,
            "braided leather harness"
        );
        assert.equal(
            result.underwearTop.value,
            ""
        );

    }
);

test(
    "leaves layered upper untouched when an outer garment is named",
    () => {

        const result = postProcessState({
            upper: field("shirt over a sports bra"),
            underwearTop: field("no bra", 70)
        });

        assert.equal(
            result.upper.value,
            "shirt over a sports bra"
        );
        assert.equal(
            result.underwearTop.value,
            "no bra"
        );

    }
);

// --- Garment reroute: lower -> underwearBottom ---

test(
    "moves boxers from lower to underwearBottom",
    () => {

        const result = postProcessState({
            lower: field("boxers", 88),
            underwearBottom: field("")
        });

        assert.equal(
            result.underwearBottom.value,
            "boxers"
        );
        assert.equal(
            result.underwearBottom.confidence,
            88
        );
        assert.equal(
            result.lower.value,
            "no pants"
        );
        assert.equal(
            result.lower.confidence,
            75
        );

    }
);

test(
    "leaves 'boxer shorts' in lower (no plural word match, outer garment named)",
    () => {

        const result = postProcessState({
            lower: field("boxer shorts"),
            underwearBottom: field("")
        });

        assert.equal(
            result.lower.value,
            "boxer shorts"
        );
        assert.equal(
            result.underwearBottom.value,
            ""
        );

    }
);

test(
    "leaves plain jeans in lower untouched",
    () => {

        const result = postProcessState({
            lower: field("blue jeans"),
            underwearBottom: field("")
        });

        assert.equal(
            result.lower.value,
            "blue jeans"
        );
        assert.equal(
            result.underwearBottom.value,
            ""
        );

    }
);

// --- Hand prefixes ---

test(
    "prepends the hand prefix and lowercases the first letter",
    () => {

        const result = postProcessState({
            leftHand: field("Holding a mug", 90),
            rightHand: field("clenched into a fist", 85)
        });

        assert.equal(
            result.leftHand.value,
            "Left hand holding a mug"
        );
        assert.equal(
            result.leftHand.confidence,
            90
        );
        assert.equal(
            result.rightHand.value,
            "Right hand clenched into a fist"
        );

    }
);

test(
    "leaves an already-prefixed hand value untouched (case-insensitive)",
    () => {

        const result = postProcessState({
            leftHand: field("left hand raised"),
            rightHand: field("RIGHT HAND on hip")
        });

        assert.equal(
            result.leftHand.value,
            "left hand raised"
        );
        assert.equal(
            result.rightHand.value,
            "RIGHT HAND on hip"
        );

    }
);

test(
    "empty hand fields still receive the stock default",
    () => {

        const result = postProcessState({
            leftHand: field("", 0)
        });

        assert.equal(
            result.leftHand.value,
            "Left hand by side"
        );
        assert.equal(
            result.leftHand.confidence,
            25
        );

    }
);

// --- Expression flush ---

test(
    "blanks a flush-only expression and routes Blushing to condition",
    () => {

        const result = postProcessState({
            expression: field("flushed", 80),
            condition: field("", 0)
        });

        assert.equal(
            result.expression.value,
            ""
        );
        assert.equal(
            result.expression.confidence,
            0
        );
        assert.equal(
            result.condition.value,
            "Blushing"
        );
        assert.equal(
            result.condition.confidence,
            25
        );

    }
);

test(
    "removes flush words but keeps the rest of the expression",
    () => {

        const result = postProcessState({
            expression: field("Flushed and smiling", 85),
            condition: field("Tired", 70)
        });

        assert.equal(
            result.expression.value,
            "smiling"
        );
        assert.equal(
            result.expression.confidence,
            85
        );
        assert.equal(
            result.condition.value,
            "Tired, Blushing"
        );

    }
);

test(
    "does not duplicate Blushing when condition already mentions it",
    () => {

        const result = postProcessState({
            expression: field("pink cheeks", 75),
            condition: field("blushing hard", 60)
        });

        assert.equal(
            result.expression.value,
            "cheeks"
        );
        assert.equal(
            result.condition.value,
            "blushing hard"
        );

    }
);

test(
    "collapses separators left behind by multiple flush words",
    () => {

        const result = postProcessState({
            expression: field("pale, red, trembling", 80),
            condition: field("", 0)
        });

        assert.equal(
            result.expression.value,
            "trembling"
        );
        assert.equal(
            result.condition.value,
            "Blushing"
        );

    }
);

test(
    "flush words only match on word boundaries",
    () => {

        const result = postProcessState({
            expression: field("bored and tired", 80),
            condition: field("", 0)
        });

        assert.equal(
            result.expression.value,
            "bored and tired"
        );
        assert.equal(
            result.condition.value,
            ""
        );

    }
);

// --- Consistency on merged creation data ---

test(
    "enforceConsistency bumps non-empty values stuck at confidence 0",
    () => {

        const result = enforceConsistency({
            leftHand: {
                value: "Left hand by side",
                confidence: 0
            },
            species: {
                value: "Human",
                confidence: 0
            },
            upper: {
                value: "",
                confidence: 40
            },
            eyeColor: {
                value: "Brown eyes",
                confidence: 80
            }
        });

        assert.equal(
            result.leftHand.confidence,
            25
        );
        assert.equal(
            result.species.confidence,
            25
        );
        assert.equal(
            result.upper.confidence,
            0
        );
        assert.equal(
            result.eyeColor.confidence,
            80
        );

    }
);

test(
    "enforceConsistency clones its input",
    () => {

        const input = {
            species: {
                value: "Human",
                confidence: 0
            }
        };

        enforceConsistency(input);

        assert.equal(
            input.species.confidence,
            0
        );

    }
);

test(
    "character creation runs enforceConsistency on the merged facts",
    async () => {

        // continuity-manager.js imports SillyTavern core and
        // cannot be loaded under node, so the wiring is
        // asserted at the source level.
        const source = await readFile(
            new URL(
                "../scripts/continuity-manager.js",
                import.meta.url
            ),
            "utf8"
        );

        assert.match(
            source,
            /enforceConsistency\(\s*mergedInitialState\.data\s*\)/
        );

    }
);
