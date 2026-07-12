// scripts/providers/provider-manager.js

import {
    execute
} from "../ai/index.js";

export async function extractFacts(
    text,
    metadata = {}
) {


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


    return await execute(
        "image-prompt",
        character,
        metadata
    );
}
