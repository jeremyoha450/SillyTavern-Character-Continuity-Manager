import assert from "node:assert/strict";
import test from "node:test";

import { parse } from "../scripts/tasks/image/parser.js";

test("image parser rejects malformed JSON-shaped output for corrective retry", () => {
    assert.throws(
        () => parse('{"prompt":"solo, indoors"'),
        /not valid JSON/i
    );
});

test("image parser retains plain-text provider compatibility", () => {
    assert.deepEqual(
        parse("prompt: solo, indoors"),
        {
            positive: "solo, indoors",
            negative: ""
        }
    );
});
