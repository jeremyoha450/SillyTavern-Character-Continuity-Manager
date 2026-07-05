// scripts/state/update-state.js

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

import {
    postProcessState
} from "../extraction/post-process.js";

// Momentary fields that must always be re-derived from the
// new messages. They are stripped from the baseline sent to
// the LLM, never from the stored state itself.
const TRANSIENT_FIELDS = new Set([
    "leftHand",
    "rightHand",
    "headPosition",
    "eyeDirection",
    "expression",
    "mood",
    "moodIntensity",
    "positionDetail"
]);

// Semi-permanent fields owned by the facts extraction. A
// non-empty value from the state extraction permanently
// overrides the stored fact, and the field is flagged in
// character.overrides so a card re-extract cannot reset it.
const OVERRIDE_FIELDS = new Set([
    "hairColor",
    "hairStyle",
    "bodyType",
    "relationship",
    "penis",
    "pussy"
]);

function buildStateBaseline(facts) {

    const value = key =>
        TRANSIENT_FIELDS.has(key)
            ? ""
            : String(facts[key]?.value ?? "").trim();

    const wearing = [
        "upper",
        "outerwear",
        "lower",
        "underwearTop",
        "underwearBottom",
        "footwear"
    ]
        .map(value)
        .filter(Boolean)
        .join("; ");

    const place = [
        "location",
        "area"
    ]
        .map(value)
        .filter(Boolean)
        .join(", ");

    const anatomy = [
        "penis",
        "penisState",
        "penisCondition",
        "pussy",
        "pussyState",
        "pussyCondition"
    ]
        .map(value)
        .filter(Boolean)
        .join("; ");

    const hair = [
        "hairColor",
        "hairStyle"
    ]
        .map(value)
        .filter(Boolean)
        .join(", ");

    const sections = [

        wearing
            ? `Previously wearing: ${wearing}.`
            : "",

        place
            ? `Location: ${place}.`
            : "",

        value("position")
            ? `Position: ${value("position")}.`
            : "",

        value("accessories")
            ? `Accessories: ${value("accessories")}.`
            : "",

        hair
            ? `Hair: ${hair}.`
            : "",

        value("bodyType")
            ? `Body: ${value("bodyType")}.`
            : "",

        value("relationship")
            ? `Relationship: ${value("relationship")}.`
            : "",

        anatomy
            ? `Anatomy: ${anatomy}.`
            : "",

        value("condition")
            ? `Condition: ${value("condition")}.`
            : "",

        value("injuries")
            ? `Injuries: ${value("injuries")}.`
            : "",

        value("notes")
            ? `Notes: ${value("notes")}.`
            : ""

    ].filter(Boolean);

    return sections.length
        ? sections.join(" ")
        : null;

}

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

    const baseline =
        buildStateBaseline(
            currentFacts
        );

    const state =
        postProcessState(
            await extractState(
                {
                    baseline,
                    messages
                },
                {
                    characterId: id,
                    characterName:
                        character.name
                }
            ),
            {
                gender:
                    currentFacts.gender?.value,
                previousFacts:
                    currentFacts
            }
        );

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

    const overriddenNow =
        mergedState.changes
            .map(change => change.field)
            .filter(field =>
                OVERRIDE_FIELDS.has(field)
            );

    const update = {

        facts:
            mergedState.data,

        history

    };

    if (overriddenNow.length) {

        update.overrides = {
            ...(character.overrides || {}),
            ...Object.fromEntries(
                overriddenNow.map(
                    field => [field, true]
                )
            )
        };

    }

    updateCharacter(
        id,
        update
    );

    return {

        changed: true,

        changes:
            mergedState.changes,

        facts:
            mergedState.data

    };

}
