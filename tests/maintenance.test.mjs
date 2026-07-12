import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

const { createCharacter } = await import("../scripts/database.js");

test("shipped database schema is valid and current", async () => {
    const schema = JSON.parse(
        await readFile(
            new URL("../schema.json", import.meta.url),
            "utf8"
        )
    );

    assert.equal(schema.properties.version.const, 5);
    assert.ok(schema.$defs.character);
    assert.ok(schema.$defs.facts.properties.characterName);
    assert.ok(schema.$defs.facts.properties.pussyCondition);
    assert.ok(schema.$defs.groupContext);
});

test("new characters omit inactive legacy structures", () => {
    const character = createCharacter("Test Character");

    for (const key of [
        "appearance",
        "anatomy",
        "clothing",
        "location",
        "position",
        "mood",
        "relationships",
        "statusInfo",
        "state",
        "hashes"
    ]) {
        assert.equal(key in character, false, key);
    }

    assert.ok(character.facts);
    assert.deepEqual(character.facts.characterName, {
        value: "",
        confidence: 0
    });
    assert.deepEqual(character.inventory, []);
    assert.deepEqual(character.imageHistory, []);
});

test("character creator final save keeps confirmations clickable and buttons themed", async () => {
    const creator = await readFile(
        new URL("../scripts/ui/character-creator.js", import.meta.url),
        "utf8"
    );
    const styles = await readFile(
        new URL("../style.css", import.meta.url),
        "utf8"
    );

    assert.match(creator, /status\("Creating cards…", true, false\)/);
    assert.match(creator, /status\("", false, false\)/);
    assert.match(styles, /\.ccm-creator-window button\s*\{/);
    assert.match(styles, /input::file-selector-button/);
});

test("CCM launcher supports standard click and keyboard activation", async () => {
    const uiSource = await readFile(new URL("../scripts/ui.js", import.meta.url), "utf8");
    assert.match(uiSource, /aria-label", "Open Character Continuity Manager/);
    assert.match(uiSource, /handle\.addEventListener\("click"/);
    assert.match(uiSource, /handle\.addEventListener\("keydown"/);
});

test("character creator provides coherent examples and separated usual clothing fields", async () => {
    const creator = await readFile(
        new URL("../scripts/ui/character-creator.js", import.meta.url),
        "utf8"
    );

    assert.match(creator, /data-fill-complete-example/);
    assert.match(creator, /data-use-example/);
    assert.match(creator, /name="clothingTop"/);
    assert.match(creator, /name="clothingBottom"/);
    assert.match(creator, /name="clothingFootwear"/);
    assert.match(creator, /name="clothingUnderwear"/);
    assert.match(creator, /combineClothingParts\(clothingParts\)/);
});

test("facts prompt extracts explicit card-content names without using card display names", async () => {
    const prompt = await readFile(
        new URL("../scripts/tasks/facts/prompt.js", import.meta.url),
        "utf8"
    );

    assert.match(prompt, /Name: Kaye/);
    assert.match(prompt, /external SillyTavern card\/display name/);
    assert.match(prompt, /Leave blank only when no personal name appears/);
});
