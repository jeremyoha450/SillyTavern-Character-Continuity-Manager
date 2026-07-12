// scripts/migrations.js

export const DATABASE_VERSION = 5;
export const AI_SETTINGS_VERSION = 7;

export function migrateDatabase(value) {

    const database =
        value && typeof value === "object"
            ? structuredClone(value)
            : {};

    let version =
        Number(database.version) || 1;

    if (version < 2) {
        database.characters =
            database.characters &&
            typeof database.characters === "object"
                ? database.characters
                : {};

        version = 2;
    }

    if (version < 3) {
        database.usage =
            database.usage || {
                version: 1,
                totals: {
                    requests: 0,
                    reportedRequests: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0
                },
                byCharacter: {},
                byTask: {},
                byProvider: {},
                byModel: {},
                recent: []
            };

        version = 3;
    }

    if (version < 4) {
        for (
            const character
            of Object.values(
                database.characters || {}
            )
        ) {
            character.imageHistory =
                Array.isArray(
                    character.imageHistory
                )
                    ? character.imageHistory
                    : [];
        }

        version = 4;
    }

    if (version < 5) {
        database.groups =
            database.groups &&
            typeof database.groups === "object"
                ? database.groups
                : {};

        version = 5;
    }

    database.version =
        DATABASE_VERSION;

    database.characters =
        database.characters &&
        typeof database.characters === "object"
            ? database.characters
            : {};

    database.groups =
        database.groups &&
        typeof database.groups === "object"
            ? database.groups
            : {};

    for (
        const character
        of Object.values(database.characters)
    ) {
        character.imageHistory =
            Array.isArray(character.imageHistory)
                ? character.imageHistory
                : [];
    }

    return database;
}

export function migrateAISettings(value) {

    const source =
        value && typeof value === "object"
            ? value
            : {};

    return {
        version: AI_SETTINGS_VERSION,
        aiSource:
            source.aiSource === "sillytavern"
                ? "sillytavern"
                : "ccm",
        driver:
            typeof source.driver === "string"
                ? source.driver
                : "",
        drivers:
            source.drivers &&
            typeof source.drivers === "object"
                ? structuredClone(source.drivers)
                : {},
        imageGeneration: {
            preset:
                typeof source.imageGeneration?.preset === "string"
                    ? (
                        source.imageGeneration.preset === "default"
                            ? ""
                            : source.imageGeneration.preset
                    )
                    : "",
            presets:
                source.imageGeneration?.presets &&
                typeof source.imageGeneration.presets === "object"
                    ? structuredClone(
                        source.imageGeneration.presets
                    )
                    : {}
        }
    };
}
