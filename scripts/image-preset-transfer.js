const STRING_FIELDS = [
    "systemPrompt",
    "prefix",
    "suffix",
    "negativePrompt"
];
const TAG_FIELDS = [
    "qualityTags",
    "scoreTags",
    "styleTags",
    "requiredTags"
];

function string(value) {
    return typeof value === "string" ? value : "";
}

function tags(value) {
    if (!Array.isArray(value)) return [];
    return value.map(item => string(item).trim()).filter(Boolean);
}

export function presetIdFromName(name) {
    return string(name)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "custom-preset";
}

export function uniquePresetId(name, existingIds = []) {
    const existing = new Set(existingIds);
    const base = presetIdFromName(name);
    if (!existing.has(base)) return base;
    let suffix = 2;
    while (existing.has(`${base}-${suffix}`)) suffix++;
    return `${base}-${suffix}`;
}

export function validateImportedPreset(value) {
    const source = value?.type === "ccm-image-prompt-preset"
        ? value.preset
        : value?.preset || value;
    if (!source || typeof source !== "object" || Array.isArray(source)) {
        throw new Error("Preset JSON must contain a preset object.");
    }

    const label = string(source.label).trim();
    if (!label) throw new Error("Imported preset is missing its name.");
    if (source.mode !== "tags" && source.mode !== "natural-language") {
        throw new Error("Imported preset mode must be 'tags' or 'natural-language'.");
    }
    if (!string(source.systemPrompt).trim()) {
        throw new Error("Imported preset is missing its AI system prompt.");
    }
    for (const field of TAG_FIELDS) {
        if (source[field] !== undefined && !Array.isArray(source[field])) {
            throw new Error(`Imported preset field '${field}' must be a list.`);
        }
    }

    return {
        id: presetIdFromName(source.id || label),
        label,
        mode: source.mode,
        preserveUnderscores: source.preserveUnderscores === true,
        ...Object.fromEntries(STRING_FIELDS.map(field => [field, string(source[field])])),
        ...Object.fromEntries(TAG_FIELDS.map(field => [field, tags(source[field])])),
        custom: source.custom === true
    };
}

export function createPresetExport(preset) {
    const validated = validateImportedPreset(preset);
    return {
        type: "ccm-image-prompt-preset",
        version: 1,
        exportedAt: new Date().toISOString(),
        preset: validated
    };
}

export function createCustomPreset(imported, name, existingIds = []) {
    const validated = validateImportedPreset(imported);
    const label = string(name).trim() || validated.label;
    return {
        ...validated,
        id: uniquePresetId(label, existingIds),
        label,
        custom: true
    };
}
