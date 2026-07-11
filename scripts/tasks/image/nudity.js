// scripts/tasks/image/nudity.js

// The state extraction records removed clothing as explicit
// markers ("no shirt", "no bra"). A blank field means unknown,
// which must stay covered-by-default, so only these markers
// count as bare.
const REMOVED_PATTERN =
    /^(?:no\s+\S|none$|nothing$|removed\b|nude\b|naked\b|bare\b|topless$|bottomless$)/i;

const NUDITY_ALREADY_PRESENT =
    /\b(?:nude|naked|topless|bottomless|undressed|unclothed|wearing nothing|wearing only|only underwear|underwear only|bare below|bare from|bare-chested|bare chested)\b/i;

const NUDITY_SENTENCES = {
    "completely nude": "The character is completely nude.",
    "topless": "The character is topless.",
    "bottomless": "The character is bare below the waist.",
    "underwear only": "The character is wearing only underwear."
};

function removed(value) {
    return REMOVED_PATTERN.test(String(value || "").trim());
}

function absent(value) {
    const trimmed = String(value || "").trim();
    return !trimmed || removed(trimmed);
}

export function deriveNudityTag(state = {}) {
    const upperClothingGone =
        removed(state.upper) && absent(state.outerwear);
    const lowerClothingGone = removed(state.lower);
    const braGone = removed(state.underwearTop);
    const pantiesGone = removed(state.underwearBottom);

    if (upperClothingGone && lowerClothingGone) {
        return braGone && pantiesGone
            ? "completely nude"
            : "underwear only";
    }

    if (upperClothingGone && braGone) {
        return "topless";
    }

    if (lowerClothingGone && pantiesGone) {
        return "bottomless";
    }

    return "";
}

export function applyNudityBackstop(parsed, state, preset) {
    const positive = String(parsed?.positive || "");
    const tag = deriveNudityTag(state);

    if (!tag || NUDITY_ALREADY_PRESENT.test(positive)) {
        return parsed;
    }

    return {
        ...parsed,
        positive:
            preset?.mode === "natural-language"
                ? `${positive} ${NUDITY_SENTENCES[tag]}`.trim()
                : `${tag}, ${positive}`
    };
}
