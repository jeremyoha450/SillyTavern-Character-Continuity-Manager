import {
    getImagePromptPreset
} from "./presets/registry.js";

const INVALID_META_TAGS = new Set([
    "bad id",
    "duplicate",
    "commentary request"
]);

const PRIMARY_POSTURE_PATTERN =
    /^(standing|sitting|seated|kneeling|lying|reclining|squatting)\b/i;

const POSTURE_DETAILS = {
    standing: /\b(?:knees? (?:drawn |pulled )?up|knees to (?:the |her |his |their )?chest|hugging (?:own |her |his |their )?knees|cross-legged|fetal position)\b/i,
    sitting: /\bstanding upright\b|\blying on\b/i,
    kneeling: /\bstanding upright\b|\bsitting cross-legged\b|\blying on\b/i,
    lying: /\bstanding upright\b|\bsitting cross-legged\b/i,
    reclining: /\bstanding upright\b/i,
    squatting: /\bstanding upright\b|\bsitting cross-legged\b|\blying on\b/i
};

const NUDE_ALL_PATTERN = /^(?:completely nude|nude|naked|undressed)$/;
const NUDE_TOP_PATTERN = /^topless$/;
const NUDE_BOTTOM_PATTERN = /^bottomless$/;
const UNDERWEAR_ONLY_PATTERN = /^underwear only$/;

const NO_UPPER_GARMENT_PATTERN =
    /^no (?:shirt|top|t-shirt|tank top|crop top|blouse|sweater|jumper|jacket|hoodie|coat|cardigan|bra|singlet|camisole)$/;
const NO_LOWER_GARMENT_PATTERN =
    /^no (?:shorts?|pants?|jeans?|trousers|skirt|dress|leggings?|panties|underwear|boxers?|briefs?)$/;
const NO_OUTER_GARMENT_PATTERN =
    /^no (?:shirt|top|t-shirt|tank top|crop top|blouse|sweater|jumper|jacket|hoodie|coat|cardigan|shorts?|pants?|jeans?|trousers|skirt|dress|leggings?)$/;

// Small models echo the state's "no <garment>" values as
// literal tags alongside the nudity tag; on Danbooru those
// negation tags mean "clothed without that item" and
// contradict the nudity tag, so drop the ones it covers.
function removeRedundantRemovalTags(tags) {
    const strips = [];

    if (tags.some(tag => NUDE_ALL_PATTERN.test(tag))) {
        strips.push(
            NO_UPPER_GARMENT_PATTERN,
            NO_LOWER_GARMENT_PATTERN
        );
    } else {
        if (tags.some(tag => NUDE_TOP_PATTERN.test(tag))) {
            strips.push(NO_UPPER_GARMENT_PATTERN);
        }

        if (tags.some(tag => NUDE_BOTTOM_PATTERN.test(tag))) {
            strips.push(NO_LOWER_GARMENT_PATTERN);
        }

        if (tags.some(tag => UNDERWEAR_ONLY_PATTERN.test(tag))) {
            strips.push(NO_OUTER_GARMENT_PATTERN);
        }
    }

    if (!strips.length) {
        return tags;
    }

    return tags.filter(tag =>
        !strips.some(pattern => pattern.test(tag))
    );
}

function postureKind(tag) {
    const match = tag.match(PRIMARY_POSTURE_PATTERN);
    return match?.[1]?.toLowerCase() === "seated"
        ? "sitting"
        : match?.[1]?.toLowerCase() || "";
}

function locationFromRejectedPosture(tag) {
    const match = tag.match(
        /^(?:lying|sitting|seated|kneeling|standing|reclining|squatting)\s+(on|in|at|beside|by|under|over)\s+(.+)$/i
    );

    return match
        ? `${match[1].toLowerCase()} ${match[2]}`
        : "";
}

function removeConflictingPostures(tags) {
    // The LLM emits tags in arbitrary order, so a conflicting
    // detail can precede the primary posture it contradicts.
    const selectedPosture =
        tags.map(postureKind).find(Boolean) || "";

    const detailPattern =
        POSTURE_DETAILS[selectedPosture];

    return tags.flatMap(tag => {
        const kind = postureKind(tag);

        if (!kind) {
            return detailPattern?.test(tag)
                ? []
                : [tag];
        }

        if (kind === selectedPosture) {
            return [tag];
        }

        const location = locationFromRejectedPosture(tag);
        return location ? [location] : [];
    });
}

function escapeParentheses(tag) {
    return tag
        .replace(/(^|[^\\])\(/g, "$1\\(")
        .replace(/(^|[^\\])\)/g, "$1\\)");
}

function normalizeVisualTag(tag) {
    if (
        /^looking at (?:the )?(?:user|viewer)[’']s shoes$/.test(tag)
    ) {
        return [
            "front view",
            "body facing viewer",
            "looking down"
        ];
    }

    if (tag === "head tilted down") {
        return ["head down"];
    }

    return [tag];
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
            .flatMap(normalizeVisualTag)
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

        positive = removeConflictingPostures(removeRedundantRemovalTags(normalizeTags([
            preset.prefix,
            ...(preset.scoreTags || []),
            ...(preset.qualityTags || []),
            ...(preset.styleTags || []),
            ...content,
            ...(preset.requiredTags || []),
            preset.suffix
        ].join(","), tagOptions)))
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
