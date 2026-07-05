// scripts/extraction/post-process.js
//
// Deterministic post-processing for extraction results.
// Runs AFTER JSON parsing and BEFORE the merge into stored
// state. Pure functions: no imports, no side effects.

const PLACEHOLDER_EXACT =
    /^(?:unknown|n\/a|none|unspecified|not\s+stated)$/i;

// Placeholder followed by exactly one word ("unknown skin",
// "unspecified hair"). Anchored so longer legitimate text
// ("Unknown to the user, she...") is never blanked.
const PLACEHOLDER_WITH_SUFFIX =
    /^(?:unknown|unspecified|not\s+stated)\s+\w+$/i;

const QUOTE_OR_BLANK =
    /^["'`\s]*$/;

const MOOD_INTENSITY_WORDS = new Set([
    "minimal",
    "low",
    "medium",
    "high",
    "intense",
    "extreme",
    "overwhelming"
]);

const FEMALE_BLANK_FIELDS = [
    "penis",
    "penisState",
    "penisCondition"
];

const MALE_BLANK_FIELDS = [
    "pussy",
    "pussyState",
    "pussyCondition",
    "breastSize"
];

const FACTS_SUFFIX_RULES = [
    ["eyeColor", ["eyes"], " eyes"],
    ["hairColor", ["hair"], " hair"],
    ["skin", ["skin", "fur"], " skin"],
    ["bodyType", ["body"], " body"]
];

const STATE_SUFFIX_RULES = [
    ["hairColor", ["hair"], " hair"],
    ["bodyType", ["body"], " body"]
];

const HAND_PREFIX_RULES = [
    ["leftHand", "Left hand"],
    ["rightHand", "Right hand"]
];

// Underwear terms are matched on word boundaries so "bra"
// never fires on "braid". When the value also names an outer
// garment ("shirt over sports bra") the model described
// layers, so the value stays in place.
const GARMENT_REROUTE_RULES = [
    {
        source: "upper",
        target: "underwearTop",
        replacement: "no shirt",
        underwear:
            /\b(?:bra|singlet|camisole)\b/i,
        outerwear:
            /\b(?:shirt|blouse|top|sweater|sweatshirt|hoodie|jacket|coat|dress|cardigan|tunic|vest|robe)\b/i
    },
    {
        source: "lower",
        target: "underwearBottom",
        replacement: "no pants",
        underwear:
            /\b(?:panties|briefs|boxers)\b/i,
        outerwear:
            /\b(?:pants|sweatpants|jeans|trousers|shorts|skirt|leggings|slacks|overalls)\b/i
    }
];

const STATE_DEFAULTS = {
    upper: "white shirt",
    lower: "Blue short",
    footwear: "barefoot",
    location: "House",
    area: "Bedroom",
    leftHand: "Left hand by side",
    rightHand: "Right hand by side"
};

const FACTS_DEFAULTS = {
    eyeColor: "Brown eyes",
    bodyType: "Slim body",
    skin: "White skin",
    buttSize: "Medium Butt",
    species: "Human"
};

function normalizeGender(gender) {

    const value =
        String(gender || "").toLowerCase();

    if (/\bfemale\b/.test(value)) {
        return "female";
    }

    if (/\bmale\b/.test(value)) {
        return "male";
    }

    return "";

}

function cleanupFields(result) {

    for (const key of Object.keys(result)) {

        const field = result[key];

        if (
            !field ||
            typeof field !== "object"
        ) {
            result[key] = {
                value: "",
                confidence: 0
            };
            continue;
        }

        let value =
            String(field.value ?? "").trim();

        if (
            QUOTE_OR_BLANK.test(value) ||
            PLACEHOLDER_EXACT.test(value) ||
            PLACEHOLDER_WITH_SUFFIX.test(value)
        ) {
            value = "";
        }

        const confidence =
            Number(field.confidence);

        field.value = value;
        field.confidence =
            Number.isFinite(confidence)
                ? Math.max(
                    0,
                    Math.min(100, confidence)
                )
                : 0;

    }

}

function blankWrongGenderFields(
    result,
    gender
) {

    const fields =
        gender === "female"
            ? FEMALE_BLANK_FIELDS
            : gender === "male"
                ? MALE_BLANK_FIELDS
                : [];

    for (const key of fields) {

        if (result[key]) {
            result[key].value = "";
            result[key].confidence = 0;
        }

    }

}

function applySuffixRules(
    result,
    rules
) {

    for (const [key, endings, suffix] of rules) {

        const field = result[key];

        if (!field || !field.value) {
            continue;
        }

        const lower =
            field.value.toLowerCase();

        if (
            !endings.some(ending =>
                lower.endsWith(ending)
            )
        ) {
            field.value =
                field.value + suffix;
        }

    }

}

function applyHandPrefixes(result) {

    for (const [key, prefix] of HAND_PREFIX_RULES) {

        const field = result[key];

        if (!field || !field.value) {
            continue;
        }

        if (
            field.value
                .toLowerCase()
                .startsWith(prefix.toLowerCase())
        ) {
            continue;
        }

        field.value =
            prefix +
            " " +
            field.value[0].toLowerCase() +
            field.value.slice(1);

    }

}

function applyGarmentReroute(result) {

    for (const rule of GARMENT_REROUTE_RULES) {

        const source = result[rule.source];
        const target = result[rule.target];

        if (
            !source ||
            !target ||
            !source.value ||
            !rule.underwear.test(source.value) ||
            rule.outerwear.test(source.value)
        ) {
            continue;
        }

        // Overwrites the target even when it holds a
        // "no bra"-style value; the rerouted extraction
        // is the more current signal.
        target.value = source.value;
        target.confidence = source.confidence;

        source.value = rule.replacement;
        source.confidence = 75;

    }

}

function applyConsistency(result) {

    for (const key of Object.keys(result)) {

        const field = result[key];

        if (
            field.value !== "" &&
            field.confidence <= 0
        ) {
            field.confidence = 25;
        }

        if (
            field.value === "" &&
            field.confidence > 0
        ) {
            field.confidence = 0;
        }

    }

}

export function postProcessFacts(
    facts,
    { gender = "" } = {}
) {

    const result =
        structuredClone(facts);

    cleanupFields(result);

    // The facts extraction carries its own gender field;
    // a stored gender, when supplied, takes priority.
    const resolvedGender =
        normalizeGender(
            gender || result.gender?.value
        );

    blankWrongGenderFields(
        result,
        resolvedGender
    );

    applySuffixRules(
        result,
        FACTS_SUFFIX_RULES
    );

    for (
        const [key, defaultValue]
        of Object.entries(FACTS_DEFAULTS)
    ) {

        const field = result[key];

        if (field && field.value === "") {
            field.value = defaultValue;
            field.confidence = 25;
        }

    }

    if (result.age) {
        result.age.value =
            result.age.value.replace(/\D+/g, "");
    }

    applyConsistency(result);

    return result;

}

export function postProcessState(
    state,
    {
        gender = "",
        previousFacts = null
    } = {}
) {

    const result =
        structuredClone(state);

    cleanupFields(result);

    blankWrongGenderFields(
        result,
        normalizeGender(gender)
    );

    applySuffixRules(
        result,
        STATE_SUFFIX_RULES
    );

    applyHandPrefixes(result);

    applyGarmentReroute(result);

    for (
        const [key, defaultValue]
        of Object.entries(STATE_DEFAULTS)
    ) {

        const field = result[key];

        if (!field || field.value !== "") {
            continue;
        }

        const previousValue =
            String(
                previousFacts?.[key]?.value ?? ""
            ).trim();

        // "" with a stored previous value means unchanged;
        // only a truly blank field gets the default.
        if (!previousValue) {
            field.value = defaultValue;
            field.confidence = 25;
        }

    }

    if (result.moodIntensity) {

        const word =
            result.moodIntensity.value.toLowerCase();

        if (
            word &&
            !MOOD_INTENSITY_WORDS.has(word)
        ) {
            result.moodIntensity.value = "";
            result.moodIntensity.confidence = 0;
        }

    }

    applyConsistency(result);

    return result;

}
