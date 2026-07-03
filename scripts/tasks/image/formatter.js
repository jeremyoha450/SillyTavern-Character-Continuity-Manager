import {
    getImagePromptPreset
} from "./presets/registry.js";

const INVALID_META_TAGS = new Set([
    "bad id",
    "duplicate",
    "commentary request"
]);

function escapeParentheses(tag) {
    return tag
        .replace(/(^|[^\\])\(/g, "$1\\(")
        .replace(/(^|[^\\])\)/g, "$1\\)");
}

function normalizeTags(
    value,
    { preserveUnderscores = false } = {}
) {

    if (typeof value !== "string") {
        return [];
    }

    return [...new Set(
        value
            .replace(/\r?\n/g, ",")
            .split(",")
            .map(tag => tag
                .trim()
                .replace(/^['"`]+|['"`]+$/g, "")
                .replace(
                    /_/g,
                    preserveUnderscores
                        ? "_"
                        : " "
                )
                .replace(/^(?:artist|character)\s*:\s*/i, "")
                .replace(/^by\s+/i, "")
                .replace(/\s+/g, " ")
                .toLowerCase()
            )
            .filter(tag =>
                tag &&
                !tag.includes("http://") &&
                !tag.includes("https://") &&
                !INVALID_META_TAGS.has(tag)
            )
            .map(escapeParentheses)
    )];
}

function joinNaturalLanguage(parts) {
    return parts
        .map(value => String(value || "").trim())
        .filter(Boolean)
        .join(". ")
        .replace(/\.{2,}/g, ".")
        .replace(/\.?$/, ".");
}

export function formatImagePrompt(
    parsed,
    presetId,
    presetSettings = null
) {

    const preset =
        presetSettings &&
        typeof presetSettings === "object"
            ? presetSettings
            : getImagePromptPreset(presetId);

    const rawPositive =
        typeof parsed === "string"
            ? parsed
            : parsed?.positive || "";

    let positive;

    if (preset.mode === "natural-language") {
        positive = joinNaturalLanguage([
            preset.prefix,
            rawPositive,
            preset.suffix
        ]);
    } else {
        const tagOptions = {
            preserveUnderscores:
                !!preset.preserveUnderscores
        };

        const supplied = normalizeTags([
            preset.prefix,
            ...(preset.scoreTags || []),
            ...(preset.qualityTags || []),
            ...(preset.styleTags || []),
            ...(preset.requiredTags || []),
            preset.suffix
        ].join(","), tagOptions);

        const content =
            normalizeTags(
                rawPositive,
                tagOptions
            )
                .filter(tag =>
                    !supplied.includes(tag)
                );

        positive = normalizeTags([
            preset.prefix,
            ...(preset.scoreTags || []),
            ...(preset.qualityTags || []),
            ...(preset.styleTags || []),
            ...content,
            ...(preset.requiredTags || []),
            preset.suffix
        ].join(","), tagOptions)
            .join(", ");
    }

    if (!positive) {
        throw new Error(
            "The AI returned an empty image prompt."
        );
    }

    return {
        presetId: preset.id,
        presetLabel: preset.label,
        positive,
        negative:
            parsed?.negative ||
            preset.negativePrompt ||
            ""
    };
}
