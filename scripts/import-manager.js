import {
    findCharacterByHash,
    findCharacterByName
} from "./database.js";

export async function checkImport(
    card,
    hashes
) {
    const hashMatch =
        findCharacterByHash(
            hashes.full
        );

    if (hashMatch) {
        return {
            action: "reuse",
            character: hashMatch
        };
    }

    const nameMatch =
        findCharacterByName(
            card.name
        );

    if (nameMatch) {
        return {
            action: "prompt",
            character: nameMatch
        };
    }

    return {
        action: "new"
    };
}