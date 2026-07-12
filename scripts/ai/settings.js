// scripts/ai/settings.js

import {
    getDriver
} from "./registry.js";

import {
    loadAISettings,
    saveAISettings
} from "../storage.js";

import {
    getBuiltInImagePromptPreset,
    getBuiltInImagePromptPresetMap
} from "../tasks/image/presets/registry.js";

const defaults = {

    aiSource: "ccm",

    driver: "",

    drivers: {},

    imageGeneration: {
        preset: "",
        presets:
            getBuiltInImagePromptPresetMap()
    }

};

function loadSettings() {

    const saved =
        loadAISettings();

    if (!saved || typeof saved !== "object") {
        return structuredClone(defaults);
    }

    const builtInPresets =
        getBuiltInImagePromptPresetMap();

    const savedPresets =
        saved.imageGeneration?.presets &&
        typeof saved.imageGeneration.presets === "object"
            ? saved.imageGeneration.presets
            : {};

    const presets =
        {
            ...Object.fromEntries(
            Object.entries(builtInPresets)
                .map(([id, preset]) => [
                    id,
                    savedPresets[id]
                        ? structuredClone(savedPresets[id])
                        : preset
                ])
            ),
            ...Object.fromEntries(
                Object.entries(savedPresets)
                    .filter(([id]) => !(id in builtInPresets))
                    .map(([id, preset]) => [id, structuredClone(preset)])
            )
        };

    return {
        version: saved.version,
        aiSource:
            saved.aiSource === "sillytavern"
                ? "sillytavern"
                : "ccm",
        driver:
            typeof saved.driver === "string"
                ? saved.driver
                : defaults.driver,
        drivers:
            saved.drivers &&
            typeof saved.drivers === "object"
                ? saved.drivers
                : {},
        imageGeneration: {
            preset:
                typeof saved.imageGeneration?.preset === "string"
                    ? (
                        saved.imageGeneration.preset === "default"
                            ? ""
                            : saved.imageGeneration.preset
                    )
                    : defaults.imageGeneration.preset,
            presets
        }
    };
}

const settings =
    loadSettings();

export function saveSettings() {

    return saveAISettings(settings);
}

export function resetSettings() {

    const reset =
        structuredClone(defaults);

    settings.driver =
        reset.driver;

    settings.aiSource =
        reset.aiSource;

    settings.drivers =
        reset.drivers;

    settings.imageGeneration =
        reset.imageGeneration;

    return saveSettings();
}

export function getCurrentDriverId() {

    return settings.driver;

}

export function setCurrentDriverId(id) {

    settings.driver = id;

}

export function getAISource() {
    return settings.aiSource || "ccm";
}

export function setAISource(source) {
    settings.aiSource = source === "sillytavern"
        ? "sillytavern"
        : "ccm";
}

export function getImageGenerationSettings() {

    return settings.imageGeneration;

}

export function setImageGenerationSettings(values) {

    settings.imageGeneration = {
        ...settings.imageGeneration,
        ...values
    };

}

export function getImagePromptPresetSettings(id) {

    const presetId =
        id || settings.imageGeneration.preset;

    if (!presetId) {
        return null;
    }

    if (
        !settings.imageGeneration
            .presets[presetId]
    ) {
        const builtIn =
            getBuiltInImagePromptPreset(
                presetId
            );

        if (!builtIn) {
            return null;
        }

        settings.imageGeneration
            .presets[presetId] = builtIn;
    }

    return structuredClone(
        settings.imageGeneration
            .presets[presetId]
    );

}

export function setImagePromptPresetSettings(
    id,
    preset
) {

    const builtIn =
        getBuiltInImagePromptPreset(id);

    settings.imageGeneration.presets[id] = {
        ...structuredClone(preset),
        id: builtIn?.id || id,
        label: builtIn?.label || preset.label || id,
        custom: !builtIn
    };

}

export function resetImagePromptPreset(id) {
    const builtIn =
        getBuiltInImagePromptPreset(id);

    if (builtIn) {
        settings.imageGeneration.presets[id] =
            builtIn;
    }

}

export function resetAllImagePromptPresets() {
    const custom = Object.fromEntries(
        Object.entries(settings.imageGeneration.presets)
            .filter(([id]) => !getBuiltInImagePromptPreset(id))
    );
    settings.imageGeneration.presets = {
        ...getBuiltInImagePromptPresetMap(),
        ...custom
    };

}

export function getAllImagePromptPresetSettings() {
    return Object.values(settings.imageGeneration.presets)
        .map(preset => structuredClone(preset))
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));
}

export function setDriverSettings(
    id,
    values
) {

    settings.drivers[id] = {
        ...getDriverSettings(id),
        ...values
    };

}

export function getDriverSettings(
    id = settings.driver
) {

    if (!settings.drivers[id]) {

        settings.drivers[id] = {};

        const driver =
            getDriver(id);

        if (driver) {

            for (const field of driver.settings) {

                settings.drivers[id][field.id] =
                    field.default ?? "";

            }

        }

    }

    return settings.drivers[id];

}
