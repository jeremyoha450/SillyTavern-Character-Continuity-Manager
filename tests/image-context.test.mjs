import { test } from "node:test";
import assert from "node:assert/strict";

import {
    buildImageContinuity
} from "../scripts/image-context.js";

import imagePromptTask
from "../scripts/tasks/image/index.js";

globalThis.localStorage =
    globalThis.localStorage || {
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

const {
    addImageRecord
} = await import("../scripts/image-history.js");

function value(text) {
    return {
        value: text,
        confidence: 100
    };
}

function createFixture() {
    const solo = {
        id: "alpha",
        name: "Alpha",
        facts: {
            species: value("Human"),
            location: value(
                "Headmistress Office"
            ),
            area: value("North Alcove"),
            position: value("sitting"),
            expression: value("calm"),
            positionDetail: value(
                "behind the desk"
            )
        }
    };

    const member = {
        ...structuredClone(solo),
        facts: {
            ...structuredClone(solo.facts),
            location: value("Disposable Lab"),
            area: value("Lower Workshop"),
            position: value("standing"),
            expression: value("smiling"),
            positionDetail: value(
                "beside the east window"
            )
        }
    };

    const scene = {
        location: "Clocktower Library",
        area: "Upper Reading Hall",
        notes:
            "Rain outside; all three characters are present."
    };

    return {
        solo,
        member,
        scene
    };
}

test("group shared location and area override member and solo scene fields", () => {
    const {
        solo,
        member,
        scene
    } = createFixture();

    const continuity = buildImageContinuity(
        member,
        {
            groupScene: scene,
            baseCharacter: solo
        }
    );

    assert.equal(
        continuity.primaryCharacter.state.location,
        "Clocktower Library"
    );
    assert.equal(
        continuity.primaryCharacter.state.area,
        "Upper Reading Hall"
    );

    const messages =
        imagePromptTask.buildMessages({
            preset: {
                systemPrompt: "Fixture prompt"
            },
            continuity
        });

    const input = messages[1].content;
    assert.match(input, /Clocktower Library/);
    assert.match(input, /Upper Reading Hall/);
    assert.doesNotMatch(input, /Disposable Lab/);
    assert.doesNotMatch(
        input,
        /Headmistress Office/
    );
});

test("shared scene overlay preserves group member pose and expression", () => {
    const {
        solo,
        member,
        scene
    } = createFixture();

    const state = buildImageContinuity(
        member,
        {
            groupScene: scene,
            baseCharacter: solo
        }
    ).primaryCharacter.state;

    assert.equal(state.position, "standing");
    assert.equal(state.expression, "smiling");
    assert.equal(
        state.positionDetail,
        "beside the east window"
    );
});

test("blank shared scene falls back to group member location and area", () => {
    const {
        solo,
        member
    } = createFixture();

    const state = buildImageContinuity(
        member,
        {
            groupScene: {
                location: "  ",
                area: ""
            },
            baseCharacter: solo
        }
    ).primaryCharacter.state;

    assert.equal(state.location, "Disposable Lab");
    assert.equal(state.area, "Lower Workshop");
});

test("blank shared and member scene fields use the solo base fallback", () => {
    const {
        solo,
        member
    } = createFixture();

    member.facts.location = value("");
    member.facts.area = value("");

    const state = buildImageContinuity(
        member,
        {
            groupScene: {
                location: "",
                area: ""
            },
            baseCharacter: solo
        }
    ).primaryCharacter.state;

    assert.equal(
        state.location,
        "Headmistress Office"
    );
    assert.equal(state.area, "North Alcove");
});

test("solo image continuity remains authoritative and receives no group scene", () => {
    const {
        solo
    } = createFixture();

    const continuity =
        buildImageContinuity(solo);

    const input = imagePromptTask
        .buildMessages({
            preset: {
                systemPrompt: "Fixture prompt"
            },
            continuity
        })[1]
        .content;

    assert.match(input, /Headmistress Office/);
    assert.doesNotMatch(
        input,
        /Clocktower Library/
    );
});

test("image continuity assembly does not mutate member, solo, or scene data", () => {
    const {
        solo,
        member,
        scene
    } = createFixture();

    const before = structuredClone({
        solo,
        member,
        scene
    });

    buildImageContinuity(
        member,
        {
            groupScene: scene,
            baseCharacter: solo
        }
    );

    assert.deepEqual(
        {
            solo,
            member,
            scene
        },
        before
    );
});

test("image prompt history remains isolated to the group member scope", () => {
    const character =
        createCharacter(
            "Image Scope Fixture"
        );

    character.avatar =
        `image-scope-${Date.now()}.png`;
    addCharacter(character);

    const groupId =
        `image-group-${Date.now()}`;

    syncGroupContext(
        {
            id: groupId,
            name: "Image Group"
        },
        [character]
    );

    updateScopedCharacter(
        character.id,
        { imageHistory: [] },
        groupId
    );

    addImageRecord(
        character.id,
        {
            presetId: "noobai",
            positive:
                "Clocktower Library, standing"
        },
        groupId
    );

    assert.equal(
        getScopedCharacter(
            character.id,
            groupId
        ).imageHistory.length,
        1
    );
    assert.equal(
        getCharacter(character.id)
            .imageHistory.length,
        0
    );
    assert.equal(
        getGroupContext(groupId)
            .members[character.id]
            .imageHistory.length,
        1
    );
});
