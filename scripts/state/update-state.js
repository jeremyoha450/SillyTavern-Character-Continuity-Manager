// scriptsstateupdate-state.js

import {
    getCharacter,
    updateCharacter
} from "../database.js";

import {
    extractState
} from "../providers/provider-manager.js";

import {
    mergeData
} from "../merge/merge-data.js";

import {
    addHistory
} from "../history/history.js";

import stateSchema
from "../tasks/state/schema.js";

export async function updateCharacterStateData(
    id,
    messages
) {

    const character =
        getCharacter(
            id
        );

    if (!character) {

        throw new Error(
            "Character not found."
        );

    }

    const state =
        await extractState(
            messages,
            {
                characterId: id,
                characterName:
                    character.name
            }
        );

    const currentFacts =
        structuredClone(
            character.facts || {}
        );

    const migrateHandField = (
        target,
        positionKey,
        actionKey
    ) => {

        if (!(target in currentFacts)) {

            const position =
                currentFacts[positionKey];

            const action =
                currentFacts[actionKey];

            const value =
                action?.value ||
                position?.value ||
                "";

            const confidence =
                Math.max(
                    Number(position?.confidence) || 0,
                    Number(action?.confidence) || 0
                );

            currentFacts[target] = {
                value,
                confidence
            };

        }

        delete currentFacts[positionKey];
        delete currentFacts[actionKey];

    };

    migrateHandField(
        "leftHand",
        "leftHandPosition",
        "leftHandAction"
    );

    migrateHandField(
        "rightHand",
        "rightHandPosition",
        "rightHandAction"
    );

    for (
        const [key, field]
        of Object.entries(stateSchema)
    ) {

        if (!(key in currentFacts)) {
            currentFacts[key] =
                structuredClone(field);
        }

    }

    const mergedState =
        mergeData(
            currentFacts,
            state,
            character.locks
        );

    if (!mergedState.changed) {

        return {

            changed: false,
            changes: []

        };

    }

    const history =
        addHistory(
            character,
            "state",
            mergedState.changes
        );

    updateCharacter(
        id,
        {

            facts:
                mergedState.data,

            history

        }
    );

    return {

        changed: true,

        changes:
            mergedState.changes,

        facts:
            mergedState.data

    };

}
