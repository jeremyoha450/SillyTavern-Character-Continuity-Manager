import { getCurrentDriver } from "./ai/registry.js";
import {
    getAISource,
    getDriverSettings,
    getImageGenerationSettings,
    getImagePromptPresetSettings
} from "./ai/settings.js";
import { getSillyTavernModelInfo } from "./ai/sillytavern.js";
import { getHeightConfigStatus } from "./config/height-defaults.js";
import { getDebugSettings } from "./debug-logger.js";
import { DATABASE_VERSION, AI_SETTINGS_VERSION } from "./migrations.js";
import { getSillyTavernImageSetupError } from "./sillytavern-image.js";
import { getStorageStatus } from "./storage.js";

function text(value, fallback = "Unknown") {
    const result = String(value ?? "").trim();
    return result || fallback;
}

async function getCCMVersion() {
    try {
        const response = await fetch(new URL("../manifest.json", import.meta.url));
        if (!response.ok) return "Unknown";
        return text((await response.json()).version);
    } catch {
        return "Unknown";
    }
}

async function getSillyTavernVersion() {
    const context = globalThis.SillyTavern?.getContext?.();
    const exposedVersion = text(
        context?.version ||
        context?.appVersion ||
        globalThis.SillyTavern?.version,
        ""
    );
    if (exposedVersion) return exposedVersion;

    try {
        const response = await fetch("/version");
        if (!response.ok) return "Unknown";
        const data = await response.json();
        return text(
            data?.version ||
            data?.pkgVersion ||
            data?.packageVersion ||
            data?.agent
        );
    } catch {
        return "Unknown";
    }
}

export async function getHealthSnapshot() {
    const source = getAISource();
    const driver = getCurrentDriver();
    const stModel = source === "sillytavern" ? getSillyTavernModelInfo() : null;
    const provider = source === "sillytavern"
        ? stModel.provider
        : driver?.name || "Not selected";
    const model = source === "sillytavern"
        ? stModel.model
        : driver
            ? text(getDriverSettings(driver.id).model, "Not selected")
            : "Not selected";
    const imageSettings = getImageGenerationSettings();
    const preset = getImagePromptPresetSettings(imageSettings.preset);
    const imageError = getSillyTavernImageSetupError();
    const height = getHeightConfigStatus();
    const storage = getStorageStatus();
    const debug = getDebugSettings();

    return {
        ccmVersion: await getCCMVersion(),
        databaseVersion: DATABASE_VERSION,
        aiSettingsVersion: AI_SETTINGS_VERSION,
        sillyTavernVersion: await getSillyTavernVersion(),
        aiSource: source === "sillytavern" ? "SillyTavern active model" : "CCM provider",
        provider: text(provider),
        model: text(model),
        imageGeneration: imageError || "Available",
        imageGenerationAvailable: !imageError,
        imagePreset: preset?.label || "Not selected",
        heightConfig: height.detail,
        heightConfigValid: height.valid,
        storage: storage.mode,
        storageAvailable: storage.available,
        debugLogging: debug.enabled
            ? `Enabled (${debug.allCategories ? "all areas" : `${debug.categories.length} selected area(s)`}${debug.includeAIContent ? ", AI content capture on" : ""})`
            : "Off"
    };
}
