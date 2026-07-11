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
    "penis": /\bpenis\b/i,
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

        if (additions.includes("pussy juice")) {
            phrase = `${phrase}, glistening wet`;
        }

        parts.push(phrase);
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

        parts.push(phrase);
    }

    if (!parts.length) {
        return "";
    }

    const pronoun = female ? "Her" : "His";

    return `${pronoun} ${parts.join(" and ")} are fully visible.`;
}

export function applyNudityBackstop(parsed, state, preset) {
    const positive = String(parsed?.positive || "");
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
