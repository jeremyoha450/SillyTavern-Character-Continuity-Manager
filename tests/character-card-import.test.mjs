import test from "node:test";
import assert from "node:assert/strict";

import {
    normalizeImportedCard,
    parsePngCharacterCard
} from "../scripts/character-card-import.js";

function pngWithText(keyword, value) {
    const text = new TextEncoder().encode(`${keyword}\0${value}`);
    const bytes = new Uint8Array(8 + 12 + text.length);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer);
    view.setUint32(8, text.length);
    bytes.set(new TextEncoder().encode("tEXt"), 12);
    bytes.set(text, 16);
    return bytes.buffer;
}

test("imports a V3 card from a ccv3 PNG text chunk", () => {
    const source = {
        spec: "chara_card_v3",
        data: { name: "Iris", description: "A mage." }
    };
    const parsed = parsePngCharacterCard(
        pngWithText("ccv3", btoa(JSON.stringify(source)))
    );
    assert.equal(parsed.data.name, "Iris");
});

test("normalizes imported card fields and lorebook entries", () => {
    const card = normalizeImportedCard({
        data: {
            name: "Iris",
            description: "A mage.",
            alternate_greetings: ["Hello"],
            character_book: {
                name: "Magic",
                entries: [{ keys: ["spell"], content: "Magic exists." }]
            }
        }
    });
    assert.equal(card.name, "Iris");
    assert.deepEqual(card.alternate_greetings, ["Hello"]);
    assert.equal(card.character_book.entries[0].keys[0], "spell");
});
