import test from "node:test";
import assert from "node:assert/strict";

globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

const {
    getEditorCharacterDetails,
    saveCharacter
} = await import("../scripts/ui/editor.js");

const {
    addCharacter,
    createCharacter,
    getCharacter
} = await import("../scripts/database.js");

function createEditorRoot() {
    let removed = false;

    const elements = new Proxy({}, {
        get(target, id) {
            if (id === "ccm-name") return { value: "Edited card" };
            if (id === "ccm-character-name") return { value: "Edited name" };
            if (id === "ccm-inventory") return { value: "key, map, " };
            if (id === "ccm-lock-bodyType") return { checked: true };
            if (id === "ccm-editor") {
                return { remove: () => { removed = true; } };
            }
            if (String(id).startsWith("ccm-lock-")) return { checked: false };
            return { value: `value for ${id}` };
        }
    });

    return {
        root: { getElementById: id => elements[id] },
        wasRemoved: () => removed
    };
}

test("editor export includes unsaved values, lock states, and inventory", () => {
    const { root } = createEditorRoot();
    const original = {
        id: "character-1",
        name: "Old card",
        facts: {
            characterName: { value: "Old name", confidence: 82 },
            bodyType: { value: "Old build", confidence: 65 }
        },
        locks: {},
        settings: { enabled: true }
    };

    const exported = getEditorCharacterDetails(original, root);

    assert.equal(exported.name, "Edited card");
    assert.deepEqual(exported.facts.characterName, {
        value: "Edited name",
        confidence: 82
    });
    assert.equal(exported.facts.bodyType.confidence, 65);
    assert.equal(exported.locks.bodyType, true);
    assert.equal(exported.locks.characterName, true);
    assert.deepEqual(exported.inventory, ["key", "map"]);
    assert.deepEqual(exported.settings, { enabled: true });
    assert.equal(original.name, "Old card");
});

test("editor save uses the same values as editor export", () => {
    const { root, wasRemoved } = createEditorRoot();
    const character = createCharacter("Old card");
    character.facts.characterName.confidence = 82;
    character.facts.bodyType.confidence = 65;
    addCharacter(character);

    const expected = getEditorCharacterDetails(character, root);
    globalThis.document = root;
    let refreshedId = "";

    saveCharacter(character.id, id => {
        refreshedId = id;
    });

    const saved = getCharacter(character.id);
    assert.equal(saved.name, expected.name);
    assert.deepEqual(saved.facts, expected.facts);
    assert.deepEqual(saved.locks, expected.locks);
    assert.deepEqual(saved.inventory, expected.inventory);
    assert.equal(refreshedId, character.id);
    assert.equal(wasRemoved(), true);
});
