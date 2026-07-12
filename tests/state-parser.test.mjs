import test from "node:test";
import assert from "node:assert/strict";

import { parse } from "../scripts/tasks/state/parser.js";

const complete = {
    underwearTop: { value: "sports bra", confidence: 100 },
    underwearBottom: { value: "no panties", confidence: 75 },
    hairColor: { value: "black", confidence: 0 },
    hairStyle: { value: "ponytail", confidence: 0 },
    bodyType: { value: "athletic", confidence: 0 },
    relationship: { value: "", confidence: 0 },
    notes: { value: "Running outside." }
};

test("state parser repairs missing final closing braces", () => {
    const truncated = JSON.stringify(complete).slice(0, -2);
    const result = parse(truncated);

    assert.equal(result.underwearTop.value, "sports bra");
    assert.equal(result.notes.value, "Running outside.");
    assert.equal(result.notes.confidence, 0);
});

test("state parser rejects truncation before required fields are returned", () => {
    assert.throws(
        () => parse('{"underwearTop":{"value":"sports bra"'),
        /missing required key/
    );
});

test("state parser still rejects mismatched containers", () => {
    assert.throws(
        () => parse('{"underwearTop":[]]'),
        /not valid JSON/
    );
});
