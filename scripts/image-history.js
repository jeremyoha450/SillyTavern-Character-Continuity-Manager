import {
    getCharacter,
    updateCharacter
} from "./database.js";

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
    characterId
) {
    const character =
        getCharacter(characterId);

    return Array.isArray(
        character?.imageHistory
    )
        ? character.imageHistory
        : [];
}

export function getImageRecord(
    characterId,
    recordId
) {
    return getImageHistory(characterId)
        .find(record =>
            record.id === recordId
        );
}

export function addImageRecord(
    characterId,
    values
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
        ...getImageHistory(characterId)
    ];

    updateCharacter(characterId, {
        imageHistory: history
    });

    return record;
}

export function updateImageRecord(
    characterId,
    recordId,
    updates
) {
    let updated = null;

    const history =
        getImageHistory(characterId)
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

    updateCharacter(characterId, {
        imageHistory: history
    });

    return updated;
}

export function removeImageRecord(
    characterId,
    recordId
) {
    const history =
        getImageHistory(characterId)
            .filter(record =>
                record.id !== recordId
            );

    updateCharacter(characterId, {
        imageHistory: history
    });
}
