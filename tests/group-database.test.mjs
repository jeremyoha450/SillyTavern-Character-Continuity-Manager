import test from "node:test";
import assert from "node:assert/strict";

globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

const {
    addCharacter,
    createCharacter,
    findCharacterForCard
} = await import("../scripts/database.js");

test("cards with the same name retain separate avatar identities", () => {
    const first = createCharacter("Alex");
    first.avatar = "alex-one.png";
    addCharacter(first);

    const second = createCharacter("Alex");
    second.avatar = "alex-two.png";
    addCharacter(second);

    assert.equal(
        findCharacterForCard({ name: "Alex", avatar: "alex-one.png" })?.id,
        first.id
    );
    assert.equal(
        findCharacterForCard({ name: "Alex", avatar: "alex-two.png" })?.id,
        second.id
    );
});

test("legacy records without avatars can still match by name", () => {
    const legacy = createCharacter("Legacy");
    addCharacter(legacy);

    assert.equal(
        findCharacterForCard({ name: "Legacy", avatar: "legacy.png" })?.id,
        legacy.id
    );
});
