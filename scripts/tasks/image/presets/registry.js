import animaPreset from "./anima.js";
import fluxPreset from "./flux.js";
import ponyPreset from "./pony.js";
import illustriousPreset from "./illustrious.js";
import noobaiPreset from "./noobai.js";
import sdxlPreset from "./sdxl.js";

const presets = [
    animaPreset,
    fluxPreset,
    ponyPreset,
    illustriousPreset,
    noobaiPreset,
    sdxlPreset
];

export function getImagePromptPresets() {
    return presets.map(preset => ({
        id: preset.id,
        label: preset.label
    }));
}

export function getImagePromptPreset(id) {
    return presets.find(
        preset => preset.id === id
    ) || null;
}

export function getBuiltInImagePromptPreset(id) {
    const preset =
        getImagePromptPreset(id);

    return preset
        ? structuredClone(preset)
        : null;
}

export function getBuiltInImagePromptPresetMap() {
    return Object.fromEntries(
        presets.map(preset => [
            preset.id,
            structuredClone(preset)
        ])
    );
}
