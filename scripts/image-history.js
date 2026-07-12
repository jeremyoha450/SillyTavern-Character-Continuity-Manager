import {
    getScopedCharacter,
    updateScopedCharacter
} from "./database.js";

export const IMAGE_HISTORY_LIMIT = 200;

function generateImageRecordId() {
    return (
        "image_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}

export function getImageHistory(
    characterId,
    groupId = ""
) {
    const character =
        getScopedCharacter(
            characterId,
            groupId
        );

    return Array.isArray(
        character?.imageHistory
    )
        ? character.imageHistory
        : [];
}

export function getImageRecord(
    characterId,
    recordId,
    groupId = ""
) {
    return getImageHistory(
        characterId,
        groupId
    )
        .find(record =>
            record.id === recordId
        );
}

export function addImageRecord(
    characterId,
    values,
    groupId = ""
) {
    const record = {
        id: generateImageRecordId(),
        presetId: "",
        presetLabel: "",
        positive: "",
        negative: "",
        imageUrl: "",
        status: "prompt",
        error: "",
        createdAt: Date.now(),
        generatedAt: null,
        ...structuredClone(values)
    };

    const history = [
        record,
        ...getImageHistory(
            characterId,
            groupId
        )
    ].slice(0, IMAGE_HISTORY_LIMIT);

    updateScopedCharacter(
        characterId,
        { imageHistory: history },
        groupId
    );

    return record;
}

export function updateImageRecord(
    characterId,
    recordId,
    updates,
    groupId = ""
) {
    let updated = null;

    const history =
        getImageHistory(
            characterId,
            groupId
        )
            .map(record => {
                if (record.id !== recordId) {
                    return record;
                }

                updated = {
                    ...record,
                    ...structuredClone(updates)
                };

                return updated;
            });

    if (!updated) return null;

    updateScopedCharacter(
        characterId,
        { imageHistory: history },
        groupId
    );

    return updated;
}

export function removeImageRecord(
    characterId,
    recordId,
    groupId = ""
) {
    const history =
        getImageHistory(
            characterId,
            groupId
        )
            .filter(record =>
                record.id !== recordId
            );

    updateScopedCharacter(
        characterId,
        { imageHistory: history },
        groupId
    );
}
