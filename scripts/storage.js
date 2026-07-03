// scripts/storage.js

import {
    migrateDatabase,
    migrateAISettings
} from "./migrations.js";

const NAMESPACE =
    "characterContinuityManager";

const LEGACY_DATABASE_KEY =
    "ccm_database";

const LEGACY_AI_SETTINGS_KEY =
    "ccm_ai_settings";

function getContext() {

    return globalThis.SillyTavern
        ?.getContext?.();
}

function getServerStore() {

    const context =
        getContext();

    const extensionSettings =
        context?.extensionSettings ||
        context?.extension_settings;

    if (!extensionSettings) {
        return null;
    }

    if (
        !extensionSettings[NAMESPACE] ||
        typeof extensionSettings[NAMESPACE] !== "object"
    ) {
        extensionSettings[NAMESPACE] = {};
    }

    return extensionSettings[NAMESPACE];
}

function saveServerStore() {

    const save =
        getContext()?.saveSettingsDebounced;

    if (typeof save !== "function") {
        return false;
    }

    save();
    return true;
}

function readLegacy(key) {

    try {
        return JSON.parse(
            localStorage.getItem(key) ||
            "null"
        );
    } catch (error) {
        console.error(
            `[CCM] Failed To Read Legacy Storage '${key}'`,
            error
        );
        return null;
    }
}

function removeLegacy(key) {

    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(
            `[CCM] Could Not Remove Legacy Storage '${key}'`,
            error
        );
    }
}

function writeBrowserFallback(
    key,
    value
) {

    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
        return true;
    } catch (error) {
        console.error(
            `[CCM] Browser Fallback Save Failed '${key}'`,
            error
        );
        return false;
    }
}

export function loadDatabase() {

    const store =
        getServerStore();

    if (store?.database) {
        const database =
            migrateDatabase(
            store.database
        );

        store.database = database;
        if (saveServerStore()) {
            removeLegacy(
                LEGACY_DATABASE_KEY
            );
        }

        return database;
    }

    const legacy =
        readLegacy(
            LEGACY_DATABASE_KEY
        );

    const database =
        migrateDatabase(legacy);

    if (store) {
        store.database = database;
        store.browserDatabaseImported = true;
        if (saveServerStore()) {
            removeLegacy(
                LEGACY_DATABASE_KEY
            );
        }
    }

    return database;
}

export function saveDatabase(database) {

    const migrated =
        migrateDatabase(database);

    const store =
        getServerStore();

    if (store) {
        store.database = migrated;

        if (saveServerStore()) {
            removeLegacy(
                LEGACY_DATABASE_KEY
            );
            console.log(
                "[CCM] Database Saved To SillyTavern"
            );
            return true;
        }
    }

    return writeBrowserFallback(
        LEGACY_DATABASE_KEY,
        migrated
    );
}

export function loadAISettings() {

    const store =
        getServerStore();

    if (store?.aiSettings) {
        const settings =
            migrateAISettings(
            store.aiSettings
        );

        store.aiSettings = settings;
        if (saveServerStore()) {
            removeLegacy(
                LEGACY_AI_SETTINGS_KEY
            );
        }

        return settings;
    }

    const legacy =
        readLegacy(
            LEGACY_AI_SETTINGS_KEY
        );

    const settings =
        migrateAISettings(legacy);

    if (store) {
        store.aiSettings = settings;
        store.browserAISettingsImported = true;
        if (saveServerStore()) {
            removeLegacy(
                LEGACY_AI_SETTINGS_KEY
            );
        }
    }

    return settings;
}

export function saveAISettings(settings) {

    const migrated =
        migrateAISettings(settings);

    const store =
        getServerStore();

    if (store) {
        store.aiSettings = migrated;

        if (saveServerStore()) {
            removeLegacy(
                LEGACY_AI_SETTINGS_KEY
            );
            console.log(
                "[CCM] AI Settings Saved To SillyTavern"
            );
            return true;
        }
    }

    return writeBrowserFallback(
        LEGACY_AI_SETTINGS_KEY,
        migrated
    );
}

export function loadUIState(
    characterId,
    key
) {

    const id =
        `${characterId}:${key}`;

    const store =
        getServerStore();

    if (
        store?.uiState &&
        typeof store.uiState[id] === "boolean"
    ) {
        return store.uiState[id];
    }

    const legacyKey =
        `ccm-section-${characterId}-${key}`;

    const legacy =
        localStorage.getItem(legacyKey);

    const open =
        legacy !== "closed";

    if (store) {
        store.uiState =
            store.uiState || {};
        store.uiState[id] = open;
        if (saveServerStore()) {
            removeLegacy(legacyKey);
        }
    }

    return open;
}

export function saveUIState(
    characterId,
    key,
    open
) {

    const store =
        getServerStore();

    if (store) {
        store.uiState =
            store.uiState || {};
        store.uiState[
            `${characterId}:${key}`
        ] = !!open;

        if (saveServerStore()) {
            removeLegacy(
                `ccm-section-${characterId}-${key}`
            );
            return true;
        }
    }

    try {
        localStorage.setItem(
            `ccm-section-${characterId}-${key}`,
            open ? "open" : "closed"
        );
        return true;
    } catch (error) {
        console.error(
            "[CCM] UI State Fallback Save Failed",
            error
        );
        return false;
    }
}
