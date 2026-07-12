import test from "node:test";
import assert from "node:assert/strict";

globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

const {
    addCharacter,
    createCharacter,
    getCharacter,
    getGroupContext,
    getScopedCharacter,
    syncGroupContext,
    updateScopedCharacter
} = await import("../scripts/database.js");

test("group continuity is isolated from the solo character record", () => {
    const character = createCharacter("Lana");
    character.avatar = "lana.png";
    character.facts.mood.value = "Calm";
    addCharacter(character);

    syncGroupContext(
        { id: "group-1", name: "Friends" },
        [character]
    );

    const scoped =
        getScopedCharacter(
            character.id,
            "group-1"
        );

    scoped.facts.mood.value = "Excited";
    updateScopedCharacter(
        character.id,
        { facts: scoped.facts },
        "group-1"
    );

    assert.equal(
        getScopedCharacter(character.id, "group-1").facts.mood.value,
        "Excited"
    );
    assert.equal(
        getCharacter(character.id).facts.mood.value,
        "Calm"
    );
});

test("group sync adds new members without erasing saved group details", () => {
    const first = createCharacter("First");
    const second = createCharacter("Second");
    addCharacter(first);
    addCharacter(second);

    syncGroupContext(
        { id: "group-2", name: "Party" },
        [first]
    );

    updateScopedCharacter(
        first.id,
        { inventory: ["map"] },
        "group-2"
    );

    syncGroupContext(
        { id: "group-2", name: "Party" },
        [first, second]
    );

    const group = getGroupContext("group-2");
    assert.deepEqual(group.memberOrder, [first.id, second.id]);
    assert.deepEqual(group.members[first.id].inventory, ["map"]);
    assert.ok(group.members[second.id]);
});
