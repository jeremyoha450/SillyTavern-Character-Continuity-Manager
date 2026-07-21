import test from "node:test";
import assert from "node:assert/strict";

import { parseJsonResponse } from "../scripts/tasks/character-creator/parser.js";

test("parser merges mes_example speaker lines that were broken into stray top-level keys", () => {
    const corrupted = [
        "{",
        '"name": "Kim",',
        '"description": "A friendly neighbor.",',
        '"personality": "Warm but guarded.",',
        '"scenario": "Kim opens the door.",',
        '"first_mes": "Kim waves hello.",',
        '"mes_example": "<START>",',
        '"user:": "(Holds out a cup of coffee.)\\n\\"I brought you your favorite.\\"",',
        '"kim:": (Glances at the cup without taking it.)',
        '"One coffee doesn\'t undo what you said.",',
        '"alternate_greetings": [],',
        '"tags": [],',
        '"character_book": {"name": "", "entries": []}',
        "}"
    ].join("\n");

    const result = parseJsonResponse(corrupted);

    assert.equal(result.name, "Kim");
    assert.match(result.mes_example, /<START>/);
    assert.match(result.mes_example, /user: \(Holds out a cup of coffee\.\)/);
    assert.match(result.mes_example, /"I brought you your favorite\."/);
    assert.match(result.mes_example, /kim: \(Glances at the cup without taking it\.\)/);
    assert.match(result.mes_example, /"One coffee doesn't undo what you said\."/);
    assert.deepEqual(result.alternate_greetings, []);
    assert.equal(result.character_book.entries.length, 0);
});

test("parser still rejects invalid JSON unrelated to the speaker-key pattern", () => {
    assert.throws(
        () => parseJsonResponse('{"name": "Kim", "description": '),
        /Character creator returned invalid JSON/
    );
});

test("parser still parses well-formed character_book entries arrays unchanged", () => {
    const valid = JSON.stringify({
        name: "Kim",
        description: "desc",
        mes_example: "<START>\n{{user}}: hi\n{{char}}: hi back",
        character_book: {
            name: "",
            entries: [
                { keys: ["a"], comment: "", content: "b", placement: "before_char" }
            ]
        }
    });

    const result = parseJsonResponse(valid);
    assert.equal(result.character_book.entries.length, 1);
});
