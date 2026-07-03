// scripts/providers/provider-manager.js

import {
    execute
} from "../ai/index.js";

export async function extractFacts(
    text,
    metadata = {}
) {

    console.log(
        "[CCM] Provider Manager: Facts"
    );

    return await execute(
        "facts",
        text,
        metadata
    );
}

export async function extractState(
    text,
    metadata = {}
) {

    console.log(
        "[CCM] Provider Manager: State"
    );

    return await execute(
        "state",
        text,
        metadata
    );
}

export async function updateKnowledge(
    knowledge,
    conversation,
    metadata = {}
) {

    console.log(
        "[CCM] Provider Manager: Knowledge Update"
    );

    return await execute(
        "knowledge-update",
        {
            knowledge,
            conversation
        },
        metadata
    );

}


export async function extractKnowledge(
    text,
    metadata = {}
) {

    console.log(
        "[CCM] Provider Manager: Knowledge"
    );

    return await execute(
        "knowledge",
        text,
        metadata
    );
}

export async function generateImagePrompt(
    character,
    metadata = {}
) {

    console.log(
        "[CCM] Provider Manager: Image Prompt"
    );

    return await execute(
        "image-prompt",
        character,
        metadata
    );
}
