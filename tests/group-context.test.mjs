import test from "node:test";
import assert from "node:assert/strict";

import {
    formatChatMessages,
    getContextCharacters,
    getFirstCharacterMessage,
    getRelevantContextCharacters,
    isCharacterInCurrentContext,
    targetCharacterConversation
} from "../scripts/group-context.js";

const lana = { name: "Lana", avatar: "lana.png" };
const mia = { name: "Mia", avatar: "mia.png" };
const disabled = { name: "Kai", avatar: "kai.png" };

function groupContext() {
    return {
        groupId: "group-1",
        groups: [{
            id: "group-1",
            members: ["lana.png", "mia.png", "kai.png"],
            disabled_members: ["kai.png"]
        }],
        characters: [lana, mia, disabled]
    };
}

test("group context resolves enabled member cards by avatar", () => {
    assert.deepEqual(
        getContextCharacters(groupContext()),
        [lana, mia]
    );
});

test("legacy group member names still resolve to cards", () => {
    const context = groupContext();
    context.groups[0].members = ["Lana", "Mia"];

    assert.deepEqual(
        getContextCharacters(context),
        [lana, mia]
    );
});

test("solo context continues to resolve the active card", () => {
    assert.deepEqual(
        getContextCharacters({ characters: [lana], characterId: 0 }),
        [lana]
    );
});

test("relevant group members include speakers and named mentions", () => {
    const messages = [{
        is_user: false,
        name: "Lana",
        original_avatar: "lana.png",
        mes: "Lana hands Mia the map."
    }];

    assert.deepEqual(
        getRelevantContextCharacters(groupContext(), messages),
        [lana, mia]
    );
});

test("group transcript retains each speaker name", () => {
    const text = formatChatMessages([
        { is_user: true, mes: "Hello" },
        { is_user: false, name: "Lana", mes: "Hi" },
        { is_user: false, name: "Mia", mes: "Welcome" }
    ]);

    assert.equal(text, "User:\nHello\n\nLana:\nHi\n\nMia:\nWelcome");
});

test("target instruction isolates another member's attributes", () => {
    assert.match(
        targetCharacterConversation(lana, "Mia:\nHello"),
        /Track and update only Lana/
    );
});

test("group helpers recognize membership and first speaker message", () => {
    const context = groupContext();
    const messages = [
        { is_user: false, name: "Mia", original_avatar: "mia.png", mes: "First" },
        { is_user: false, name: "Mia", original_avatar: "mia.png", mes: "Second" }
    ];

    assert.equal(isCharacterInCurrentContext(context, mia), true);
    assert.equal(getFirstCharacterMessage(messages, mia), "First");
});
