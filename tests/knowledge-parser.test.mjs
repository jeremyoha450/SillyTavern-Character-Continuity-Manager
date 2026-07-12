import test from "node:test";
import assert from "node:assert/strict";

import {
    parse as parseKnowledge
} from "../scripts/tasks/knowledge/parser.js";

import {
    parse as parseKnowledgeUpdate
} from "../scripts/tasks/knowledge-update/parser.js";

const CONCATENATED_ARRAYS = `
[{"text": "Views Husband as primary source of safety and stability.", "confidence": 100}]
[{"text": "Is skilled at academic pursuits.", "confidence": 100}]
[{"text": "Prefers the predictable structure of studies.", "confidence": 100}]
`;

test("knowledge parser merges adjacent JSON arrays from small models", () => {
    const parsed =
        parseKnowledge(
            CONCATENATED_ARRAYS
        );

    assert.equal(parsed.length, 3);
    assert.equal(parsed[0].text, "Views Husband as primary source of safety and stability.");
    assert.equal(parsed[2].confidence, 100);
});

test("knowledge update parser merges adjacent JSON arrays from small models", () => {
    const parsed =
        parseKnowledgeUpdate(
            CONCATENATED_ARRAYS
        );

    assert.equal(parsed.length, 3);
    assert.equal(parsed[1].text, "Is skilled at academic pursuits.");
});

test("knowledge parser still rejects prose after JSON", () => {
    assert.throws(
        () => parseKnowledge('[{"text":"A","confidence":100}]\nThis is not JSON.'),
        /Knowledge response was not valid JSON/
    );
});
