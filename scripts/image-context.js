const STATE_FIELDS = new Set([
    "upper",
    "outerwear",
    "lower",
    "footwear",
    "underwearTop",
    "underwearBottom",
    "covering",
    "location",
    "position",
    "area",
    "positionDetail",
    "legs",
    "leftHand",
    "rightHand",
    "headPosition",
    "eyeDirection",
    "expression",
    "mood",
    "moodIntensity",
    "accessories",
    "penis",
    "penisState",
    "penisCondition",
    "pussy",
    "pussyState",
    "pussyCondition",
    "condition",
    "injuries"
]);

const EXCLUDED_FIELDS = new Set([
    "characterName",
    "notes",
    // Wardrobe preference, not what is currently worn: the
    // state clothing fields are the only clothing source for
    // an image of the current moment. Sending the usual
    // outfit re-dresses nude characters in the prompt.
    "usualUpper",
    "usualLower",
    "usualFootwear"
]);

function nonEmptyValue(value) {
    if (
        value === undefined ||
        value === null ||
        !String(value).trim()
    ) {
        return "";
    }

    return value;
}

function factValue(character, field) {
    return nonEmptyValue(
        character?.facts?.[field]?.value
    );
}

export function buildImageContinuity(
    character,
    {
        groupScene = null,
        baseCharacter = null
    } = {}
) {
    const facts = {};
    const state = {};

    for (
        const [field, data]
        of Object.entries(character?.facts || {})
    ) {
        if (EXCLUDED_FIELDS.has(field)) {
            continue;
        }

        const value = nonEmptyValue(
            data?.value
        );

        if (!value) continue;

        const destination =
            STATE_FIELDS.has(field)
                ? state
                : facts;

        destination[field] = value;
    }

    if (groupScene) {
        for (const field of [
            "location",
            "area"
        ]) {
            const value =
                nonEmptyValue(
                    groupScene[field]
                ) ||
                factValue(
                    character,
                    field
                ) ||
                factValue(
                    baseCharacter,
                    field
                );

            if (value) {
                state[field] = value;
            } else {
                delete state[field];
            }
        }
    }

    return {
        primaryCharacter: {
            facts,
            state
        }
    };
}
