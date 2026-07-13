import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
    findSillyTavernCharacterIndex,
    openSillyTavernCharacterChat
} from "../scripts/image-chat-context.js";

const characters = [
    { name: "Lana", avatar: "lana.png" },
    { name: "Mia", avatar: "mia.png" }
];

test("image chat lookup prefers the stable avatar", () => {
    assert.equal(
        findSillyTavernCharacterIndex(
            { characters },
            { name: "Changed Name", avatar: "mia.png" }
        ),
        1
    );
});

test("image chat lookup supports legacy name-only records", () => {
    assert.equal(
        findSillyTavernCharacterIndex(
            { characters },
            { name: "Lana" }
        ),
        0
    );
});

test("opening an image chat uses SillyTavern character selection", async () => {
    const calls = [];
    const context = {
        characters,
        selectCharacterById: async (...args) => {
            calls.push(args);
        }
    };

    const index =
        await openSillyTavernCharacterChat(
            context,
            characters[1]
        );

    assert.equal(index, 1);
    assert.deepEqual(
        calls,
        [[1, { switchMenu: false }]]
    );
});

test("opening an image chat reports missing cards and unsupported hosts", async () => {
    await assert.rejects(
        openSillyTavernCharacterChat(
            { characters },
            { name: "Unknown", avatar: "unknown.png" }
        ),
        /could not be found/
    );

    await assert.rejects(
        openSillyTavernCharacterChat(
            { characters },
            characters[0]
        ),
        /cannot open a character chat/
    );
});

test("image prompt creation checks chat context before requesting a prompt", async () => {
    const source = await readFile(
        new URL(
            "../scripts/ui/image-prompt.js",
            import.meta.url
        ),
        "utf8"
    );

    const preflight =
        source.indexOf(
            "!await ensureActiveCharacterChat"
        );
    const promptStatus =
        source.indexOf(
            "Generating Image Prompt...",
            preflight
        );
    const providerRequest =
        source.indexOf(
            "await generateImagePrompt",
            preflight
        );

    assert.ok(preflight >= 0);
    assert.ok(promptStatus > preflight);
    assert.ok(providerRequest > preflight);
});

test("character dashboard chat-dependent actions use the active-chat preflight", async () => {
    const source = await readFile(
        new URL(
            "../scripts/ui/dashboard.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        source,
        /Starting a new chat[\s\S]*option_start_new_chat/
    );
    assert.match(
        source,
        /Re-extracting facts[\s\S]*actions\.reExtractCharacter/
    );
    assert.match(
        source,
        /Updating state[\s\S]*actions\.updateCharacterState/
    );
    assert.match(
        source,
        /Updating knowledge[\s\S]*actions\.updateCharacterKnowledge/
    );
});
