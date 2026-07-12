import test from "node:test";
import assert from "node:assert/strict";

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.document = { dispatchEvent: () => {} };

const { addCharacter, createCharacter } = await import("../scripts/database.js");
const { addImageRecord, getImageHistory, IMAGE_HISTORY_LIMIT } = await import("../scripts/image-history.js");

test("image history retains the newest bounded records per scope", () => {
    const character = createCharacter("Retention");
    character.image = "active-image.png";
    addCharacter(character);
    for (let index = 0; index < IMAGE_HISTORY_LIMIT + 5; index++) {
        addImageRecord(character.id, { positive: `prompt-${index}` });
    }
    const history = getImageHistory(character.id);
    assert.equal(history.length, IMAGE_HISTORY_LIMIT);
    assert.equal(history[0].positive, `prompt-${IMAGE_HISTORY_LIMIT + 4}`);
    assert.equal(history.at(-1).positive, "prompt-5");
    assert.equal(character.image, "active-image.png");
});
