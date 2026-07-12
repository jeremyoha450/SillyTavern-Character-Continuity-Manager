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

// --- Default echo guard ---

test(
    "drops an echoed clothing default that would re-dress a naked character",
    () => {

        const result = postProcessState(
            {
                upper: field("white shirt", 25),
                lower: field("Blue short", 25)
            },
            {
                previousFacts: {
                    upper: field("no shirt", 100),
                    lower: field("no pants", 100)
                }
            }
        );

        assert.equal(result.upper.value, "");
        assert.equal(result.upper.confidence, 0);
        assert.equal(result.lower.value, "");
        assert.equal(result.lower.confidence, 0);

    }
);

test(
    "keeps a default-looking value when stated at real confidence",
    () => {

        const result = postProcessState(
            {
                upper: field("white shirt", 100)
            },
            {
                previousFacts: {
                    upper: field("no shirt", 100)
                }
            }
        );

        assert.equal(
            result.upper.value,
            "white shirt"
        );
        assert.equal(
            result.upper.confidence,
            100
        );

    }
);

test(
    "keeps the echoed default when the previous value was the same default",
    () => {

        const result = postProcessState(
            {
                area: field("Bedroom", 25)
            },
            {
                previousFacts: {
                    area: field("Bedroom", 25)
                }
            }
        );

        assert.equal(
            result.area.value,
            "Bedroom"
        );

    }
);

test(
    "still fills defaults on a first extraction with no previous value",
    () => {

        const result = postProcessState(
            {
                upper: field("", 0)
            },
            {
                previousFacts: {
                    upper: field("", 0)
                }
            }
        );

        assert.equal(
            result.upper.value,
            "white shirt"
        );
        assert.equal(
            result.upper.confidence,
            25
        );

    }
);

test(
    "guarded default does not overwrite a real stored location",
    () => {

        const result = postProcessState(
            {
                location: field("House", 25)
            },
            {
                previousFacts: {
                    location: field("Forest", 100)
                }
            }
        );

        assert.equal(result.location.value, "");
        assert.equal(result.location.confidence, 0);

    }
);

// --- Usual outfit defaults ---

test(
    "fills a blank clothing field from the usual outfit instead of the generic default",
    () => {

        const result = postProcessState(
            {
                upper: field("", 0),
                lower: field("", 0),
                footwear: field("", 0)
            },
            {
                previousFacts: {
                    upper: field("", 0),
                    lower: field("", 0),
                    footwear: field("", 0),
                    usualUpper: field("thin blue shirt", 100),
                    usualLower: field("denim shorts", 100)
                }
            }
        );

        assert.equal(
            result.upper.value,
            "thin blue shirt"
        );
        assert.equal(result.upper.confidence, 25);
        assert.equal(
            result.lower.value,
            "denim shorts"
        );

        // No usualFootwear on record: generic default.
        assert.equal(
            result.footwear.value,
            "barefoot"
        );

    }
);

test(
    "an echoed usual-outfit garment at guess confidence cannot re-dress a naked character",
    () => {

        const result = postProcessState(
            {
                upper: field("thin blue shirt", 25)
            },
            {
                previousFacts: {
                    upper: field("no shirt", 100),
                    usualUpper: field("thin blue shirt", 100)
                }
            }
        );

        assert.equal(result.upper.value, "");
        assert.equal(result.upper.confidence, 0);

    }
);

test(
    "a usual-outfit garment stated at real confidence is kept (she got dressed)",
    () => {

        const result = postProcessState(
            {
                upper: field("thin blue shirt", 50)
            },
            {
                previousFacts: {
                    upper: field("no shirt", 100),
                    usualUpper: field("thin blue shirt", 100)
                }
            }
        );

        assert.equal(
            result.upper.value,
            "thin blue shirt"
        );
        assert.equal(
            result.upper.confidence,
            50
        );

    }
);

// --- Override confidence guard ---

test(
    "drops a weak-guess override so it cannot rewrite a stored fact",
    () => {

        const result = postProcessState({
            pussy: field("Natural", 50),
            hairColor: field("blonde hair", 25)
        });

        assert.equal(result.pussy.value, "");
        assert.equal(result.pussy.confidence, 0);
        assert.equal(result.hairColor.value, "");
        assert.equal(result.hairColor.confidence, 0);

    }
);

test(
    "keeps an override stated at explicit or strongly implied confidence",
    () => {

        const result = postProcessState({
            hairColor: field("blonde hair", 100),
            relationship: field("Girlfriend", 75)
        });

        assert.equal(
            result.hairColor.value,
            "blonde hair"
        );
        assert.equal(
            result.relationship.value,
            "Girlfriend"
        );

    }
);

// --- Grooming corroboration guard ---

test("a pussy override without grooming evidence in the messages is dropped even at confidence 100", () => {

    const result = postProcessState(
        {
            pussy: field("Natural", 100)
        },
        {
            gender: "female",
            messages:
                "She melts into his embrace, aftershocks running through her."
        }
    );

    assert.equal(result.pussy.value, "");
    assert.equal(result.pussy.confidence, 0);

});

test("a pussy override with grooming evidence in the messages is kept", () => {

    const result = postProcessState(
        {
            pussy: field("Natural", 100)
        },
        {
            gender: "female",
            messages:
                "She decided to stop shaving weeks ago and let the hair grow back."
        }
    );

    assert.equal(result.pussy.value, "Natural");
    assert.equal(result.pussy.confidence, 100);

});

test("the grooming guard does not run when no messages are supplied", () => {

    const result = postProcessState(
        {
            pussy: field("Shaved", 100)
        },
        { gender: "female" }
    );

    assert.equal(result.pussy.value, "Shaved");

});

// --- Covering removal detection ---

test("a blank covering is forced to 'no covering' when the messages remove it", () => {

    const result = postProcessState(
        {
            covering: field("", 0)
        },
        {
            gender: "female",
            previousFacts: {
                covering: field(
                    "Blanket covering her up to the shoulders",
                    100
                )
            },
            messages:
                "As the blanket is pulled away, she shivers at the sudden cold."
        }
    );

    assert.equal(result.covering.value, "no covering");
    assert.equal(result.covering.confidence, 75);

});

test("active-voice removal is detected too", () => {

    const result = postProcessState(
        {
            covering: field("", 0)
        },
        {
            previousFacts: {
                covering: field("Blanket covering her body", 100)
            },
            messages:
                "He gently pulls the blanket away and sets it on the floor."
        }
    );

    assert.equal(result.covering.value, "no covering");

});

test("pulling the blanket up over her keeps the covering", () => {

    const result = postProcessState(
        {
            covering: field("", 0)
        },
        {
            previousFacts: {
                covering: field("Blanket covering her body", 100)
            },
            messages:
                "She pulls the blanket up over her shoulders to fend off the cold."
        }
    );

    assert.equal(result.covering.value, "");
    assert.equal(result.covering.confidence, 0);

});

test("a removal-event description in the covering value is normalized", () => {

    const result = postProcessState(
        {
            covering: field("Blanket thrown off", 100)
        },
        {}
    );

    assert.equal(result.covering.value, "no covering");

});

test("no previous covering means removal words in messages change nothing", () => {

    const result = postProcessState(
        {
            covering: field("", 0)
        },
        {
            previousFacts: {
                covering: field("", 0)
            },
            messages:
                "He throws the blanket off the bed to make room."
        }
    );

    assert.equal(result.covering.value, "");

});

// --- Anatomy override corroboration, both genders ---

test("a penis override without change evidence is dropped even at confidence 100", () => {

    const result = postProcessState(
        {
            penis: field("Large size", 100)
        },
        {
            gender: "male",
            messages:
                "He leans back on the couch, catching his breath."
        }
    );

    assert.equal(result.penis.value, "");
    assert.equal(result.penis.confidence, 0);

});

test("a penis override with transformation evidence is kept", () => {

    const result = postProcessState(
        {
            penis: field("Large size", 100)
        },
        {
            gender: "male",
            messages:
                "The potion takes hold and his body grows before her eyes."
        }
    );

    assert.equal(result.penis.value, "Large size");

});

test("a pussy override with transformation evidence is kept even without grooming words", () => {

    const result = postProcessState(
        {
            pussy: field("Natural", 100)
        },
        {
            gender: "female",
            messages:
                "The spell transforms her body completely."
        }
    );

    assert.equal(result.pussy.value, "Natural");

});

test("the anatomy guards apply per-field when gender is unspecified", () => {

    const result = postProcessState(
        {
            pussy: field("Natural", 100),
            penis: field("Average size", 100)
        },
        {
            messages:
                "They settle into the blankets, breathing slowly."
        }
    );

    assert.equal(result.pussy.value, "");
    assert.equal(result.penis.value, "");

});

// --- Item-aware covering removal ---

test("tarp removal is detected like any other covering", () => {

    const result = postProcessState(
        {
            covering: field("", 0)
        },
        {
            previousFacts: {
                covering: field("Tarp covering her body", 100)
            },
            messages:
                "He drags the tarp off her and tosses it into the corner."
        }
    );

    assert.equal(result.covering.value, "no covering");

});

test("removing a different item does not clear the covering", () => {

    const result = postProcessState(
        {
            covering: field("", 0)
        },
        {
            previousFacts: {
                covering: field(
                    "Blanket covering her up to the shoulders",
                    100
                )
            },
            messages:
                "He throws his jacket off and sits down beside her."
        }
    );

    assert.equal(result.covering.value, "");
    assert.equal(result.covering.confidence, 0);

});

test("a canvas covering matches its own item word in the removal", () => {

    const result = postProcessState(
        {
            covering: field("", 0)
        },
        {
            previousFacts: {
                covering: field(
                    "A large piece of canvas draped over her",
                    100
                )
            },
            messages:
                "The canvas is pulled away by the wind."
        }
    );

    assert.equal(result.covering.value, "no covering");

});
