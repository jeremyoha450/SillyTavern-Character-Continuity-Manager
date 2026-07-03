// scripts/knowledge/update-knowledge.js

import {
    getCharacter
} from "../database.js";

import {
    updateCharacter
} from "../database.js";

import {
    updateKnowledge
} from "../providers/provider-manager.js";

export async function updateCharacterKnowledge(
    characterId,
    conversation
) {

    const character =
        getCharacter(
            characterId
        );

    if (!character) {

        throw new Error(
            "Character not found."
        );

    }

    const updatedKnowledge =
        await updateKnowledge(
            character.knowledge,
            conversation,
            {
                characterId,
                characterName:
                    character.name
            }
        ) || [];

    const existing =
        character.knowledge || [];

    // Compare only text and confidence: the AI response
    // never carries ids or timestamps, so comparing full
    // items would report a change on every run.
    const normalize =
        items =>
            JSON.stringify(
                items.map(
                    item => ({
                        text: item.text,
                        confidence: item.confidence
                    })
                )
            );

    const changed =
        normalize(existing) !==
        normalize(updatedKnowledge);

    if (changed) {

        const existingByText =
            new Map(
                existing.map(
                    item => [item.text, item]
                )
            );

        const knowledge =
            updatedKnowledge.map(
                item => {

                    const previous =
                        existingByText.get(
                            item.text
                        );

                    const unchanged =
                        previous &&
                        previous.confidence ===
                            item.confidence;

                    return {
                        id:
                            previous?.id ||
                            "knowledge_" +
                            Date.now() +
                            "_" +
                            Math.random()
                                .toString(36)
                                .slice(2, 8),

                        text:
                            item.text,

                        confidence:
                            item.confidence,

                        createdAt:
                            previous?.createdAt ||
                            Date.now(),

                        updatedAt:
                            unchanged
                                ? previous.updatedAt
                                : Date.now()
                    };

                }
            );

        updateCharacter(
            characterId,
            {
                knowledge
            }
        );

        return {
            changed: true,
            knowledge
        };

    }

    return {
        changed: false,
        knowledge:
            character.knowledge || []
    };

}
