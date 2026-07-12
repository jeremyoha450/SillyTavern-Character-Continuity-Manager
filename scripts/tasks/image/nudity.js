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

// Skip an anatomy tag when the prompt already conveys it in
// any common phrasing, not only the exact tag.
const ANATOMY_PRESENT = {
    "nipples": /\bnipples?\b/i,
    "pussy": /\bpussy\b|\bvulva\b|\bvagina\b/i,
    "no pubic hair": /\bpubic hair\b/i,
    "female pubic hair": /\bpubic hair\b/i,
    "pussy juice": /\bpussy juice\b|\bwet pussy\b/i,
    "swollen pussy": /\bswollen (?:pussy|vulva)\b/i,
    "penis": /\bpenis\b/i,
    "swollen penis": /\bswollen penis\b/i,
    "large penis": /\blarge penis\b/i,
    "small penis": /\bsmall penis\b/i,
    "erection": /\berect(?:ion)?\b/i,
    "flaccid": /\bflaccid\b|\bsoft penis\b/i
};

function removed(value) {
    return REMOVED_PATTERN.test(String(value || "").trim());
}

function absent(value) {
    const trimmed = String(value || "").trim();
    return !trimmed || removed(trimmed);
}

function hasValue(value) {
    return Boolean(String(value || "").trim());
}

// A covering (blanket, towel, sheet) suspends nudity: the
// character is not nude until it is removed, recorded as a
// "no covering"-style value.
export function hasActiveCovering(state = {}) {
    const covering = String(state.covering || "").trim();
    return Boolean(covering) && !/^no\b/i.test(covering);
}

// Nudity and anatomy phrases that must not survive in the
// prompt while a covering is active. Longer alternatives
// come first so "completely nude" wins over "nude" and
// "swollen pussy" over "pussy".
const COVERED_FORBIDDEN =
    /\b(?:completely nude|underwear only|no pubic hair|female pubic hair|pubic hair|pussy juice|wet pussy|swollen pussy|swollen penis|erect penis|large penis|small penis|nude|naked|topless|bottomless|undressed|unclothed|nipples?|areolae?|pussy|vulva|vagina|labia|clitoris|clit|erection|flaccid|penis|testicles)\b/gi;

function stripCoveredNudity(positive) {
    return positive
        .replace(COVERED_FORBIDDEN, " ")
        .replace(/\s+/g, " ")
        .replace(/(?:\s*,\s*)+/g, ", ")
        .replace(/\s+([.!?])/g, "$1")
        .replace(/^[\s,]+/, "")
        .replace(/[\s,]+$/, "")
        .trim();
}

// Exposure terms pushed into the negative prompt while a
// covering is active, so the image model keeps the covering
// in place instead of exposing the torso beneath it.
const COVERED_NEGATIVE_TERMS =
    "nude, completely nude, topless, bottomless, nipples, exposed breasts, bare chest, bare stomach, navel, exposed torso, pussy, groin, blanket slipping, covers pulled down";

const COVERING_WORD =
    /\b(?:blanket|duvet|quilt|comforter|sheet|bedding|covers|towel)\b/i;

// Positive-prompt anchor tags the image model actually
// understands for each covering kind.
function coveringAnchorTags(covering) {
    const item = covering.toLowerCase();

    if (/towel/.test(item)) {
        return ["towel"];
    }

    if (/blanket|duvet|quilt|comforter/.test(item)) {
        return ["blanket", "under covers"];
    }

    if (/sheet|bedding|covers/.test(item)) {
        return ["under covers"];
    }

    return [];
}

function reinforceCovering(positive, state, preset) {
    const covering = String(state.covering || "").trim();

    if (preset?.mode === "natural-language") {
        if (COVERING_WORD.test(positive)) {
            return positive;
        }

        const sentence =
            covering.charAt(0).toUpperCase() +
            covering.slice(1);

        return positive
            ? `${positive.replace(/\.?\s*$/, ". ")}${sentence}.`
            : `${sentence}.`;
    }

    const missing =
        coveringAnchorTags(covering)
            .filter(tag =>
                !new RegExp(`\\b${tag}\\b`, "i")
                    .test(positive)
            );

    if (!missing.length) {
        return positive;
    }

    return positive
        ? `${positive}, ${missing.join(", ")}`
        : missing.join(", ");
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

export function deriveAnatomyTags(state = {}, nudityTag) {
    if (!nudityTag || nudityTag === "underwear only") {
        return [];
    }

    const upperBare =
        nudityTag === "completely nude" ||
        nudityTag === "topless";
    const lowerBare =
        nudityTag === "completely nude" ||
        nudityTag === "bottomless";

    const female =
        hasValue(state.pussy) ||
        hasValue(state.pussyState) ||
        hasValue(state.pussyCondition);
    const male =
        hasValue(state.penis) ||
        hasValue(state.penisState) ||
        hasValue(state.penisCondition);

    const tags = [];

    if (upperBare && female && !male) {
        tags.push("nipples");
    }

    if (lowerBare && female) {
        tags.push("pussy");

        const hair = String(state.pussy || "").toLowerCase();

        if (/shave|bald|hairless|smooth/.test(hair)) {
            tags.push("no pubic hair");
        } else if (/trim|natural|hairy|bush/.test(hair)) {
            tags.push("female pubic hair");
        }

        const wetness =
            String(state.pussyState || "").toLowerCase();

        if (/wet|dripping|soak|moist|juice/.test(wetness)) {
            tags.push("pussy juice");
        }

        // Conditions describe the organ, so the tag must
        // name it: bare "swollen" reads as a general body
        // condition to the image model.
        const condition =
            String(state.pussyCondition || "").toLowerCase();

        if (/swollen|puffy/.test(condition)) {
            tags.push("swollen pussy");
        }
    }

    if (lowerBare && male) {
        tags.push("penis");

        const size = String(state.penis || "").toLowerCase();

        if (/large|big|huge/.test(size)) {
            tags.push("large penis");
        } else if (/small/.test(size)) {
            tags.push("small penis");
        }

        const hardness =
            String(state.penisState || "").toLowerCase();

        if (/erect|hard|semi/.test(hardness)) {
            tags.push("erection");
        } else if (/soft|flaccid/.test(hardness)) {
            tags.push("flaccid");
        }

        const condition =
            String(state.penisCondition || "").toLowerCase();

        if (/swollen|puffy/.test(condition)) {
            tags.push("swollen penis");
        }
    }

    return tags;
}

function anatomySentence(additions, state) {
    const female =
        hasValue(state.pussy) ||
        hasValue(state.pussyState) ||
        hasValue(state.pussyCondition);

    const parts = [];

    if (additions.includes("nipples")) {
        parts.push("nipples");
    }

    if (additions.includes("pussy")) {
        let phrase = "pussy";

        if (additions.includes("no pubic hair")) {
            phrase = `smooth shaved ${phrase}`;
        }

        if (additions.includes("swollen pussy")) {
            phrase = `swollen ${phrase}`;
        }

        if (additions.includes("pussy juice")) {
            phrase = `${phrase}, glistening wet`;
        }

        parts.push(phrase);
    } else if (additions.includes("swollen pussy")) {
        parts.push("swollen pussy");
    }

    if (additions.includes("penis")) {
        let phrase = "penis";

        if (additions.includes("large penis")) {
            phrase = `large ${phrase}`;
        } else if (additions.includes("small penis")) {
            phrase = `small ${phrase}`;
        }

        if (additions.includes("erection")) {
            phrase = `erect ${phrase}`;
        } else if (additions.includes("flaccid")) {
            phrase = `flaccid ${phrase}`;
        }

        if (additions.includes("swollen penis")) {
            phrase = `swollen ${phrase}`;
        }

        parts.push(phrase);
    } else if (additions.includes("swollen penis")) {
        parts.push("swollen penis");
    }

    if (!parts.length) {
        return "";
    }

    const pronoun = female ? "Her" : "His";

    return `${pronoun} ${parts.join(" and ")} are fully visible.`;
}

export function applyNudityBackstop(parsed, state, preset) {
    const positive = String(parsed?.positive || "");

    // While covered she is not nude: never inject nudity or
    // anatomy tags, strip any the model echoed anyway,
    // anchor the covering in the positive prompt, and push
    // exposure terms into the negative prompt so the image
    // model keeps the covering in place.
    if (hasActiveCovering(state)) {
        const cleaned = reinforceCovering(
            stripCoveredNudity(positive),
            state,
            preset
        );

        const baseNegative = String(
            parsed?.negative ||
            preset?.negativePrompt ||
            ""
        ).trim();

        const negative = baseNegative
            ? `${baseNegative}, ${COVERED_NEGATIVE_TERMS}`
            : "";

        if (cleaned === positive && !negative) {
            return parsed;
        }

        return {
            ...parsed,
            positive: cleaned,
            ...(negative ? { negative } : {})
        };
    }

    const tag = deriveNudityTag(state);

    if (!tag) {
        return parsed;
    }

    const missingNudity =
        !NUDITY_ALREADY_PRESENT.test(positive);

    const anatomy = deriveAnatomyTags(state, tag)
        .filter(anatomyTag =>
            !ANATOMY_PRESENT[anatomyTag]?.test(positive)
        );

    if (!missingNudity && !anatomy.length) {
        return parsed;
    }

    if (preset?.mode === "natural-language") {
        const sentences = [
            positive,
            missingNudity ? NUDITY_SENTENCES[tag] : "",
            anatomySentence(anatomy, state)
        ].filter(Boolean);

        return {
            ...parsed,
            positive: sentences.join(" ").trim()
        };
    }

    const additions = [
        ...(missingNudity ? [tag] : []),
        ...anatomy
    ];

    return {
        ...parsed,
        positive: `${additions.join(", ")}, ${positive}`
    };
}
