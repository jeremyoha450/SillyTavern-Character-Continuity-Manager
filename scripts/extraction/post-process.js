// scripts/extraction/post-process.js
//
// Deterministic post-processing for extraction results.
// Runs AFTER JSON parsing and BEFORE the merge into stored
// state. Pure functions: no side effects, config injected
// by the caller.

const PLACEHOLDER_EXACT =
    /^(?:unknown|n\/a|none|unspecified|not\s+stated)$/i;

// Placeholder followed by exactly one word ("unknown skin",
// "unspecified hair"). Anchored so longer legitimate text
// ("Unknown to the user, she...") is never blanked.
const PLACEHOLDER_WITH_SUFFIX =
    /^(?:unknown|unspecified|not\s+stated)\s+\w+$/i;

const QUOTE_OR_BLANK =
    /^["'`\s]*$/;

// Facial-coloring words that belong in condition, not
// expression. Word-bounded so "red" never fires inside
// "bored" or "tired".
const FLUSH_WORDS =
    /\b(?:flush(?:ed|ing)?|red|pink|pale|blushing)\b/gi;

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

// Per-character usual-outfit facts that replace the generic
// clothing defaults when present.
const USUAL_OUTFIT_SOURCES = {
    upper: "usualUpper",
    lower: "usualLower",
    footwear: "usualFootwear"
};

// Semi-permanent fields owned by the facts extraction. A
// non-empty value here permanently overwrites the stored
// fact, so it must come from an explicit or strongly implied
// change in the messages (confidence 75+), never from a
// guess or inference.
const OVERRIDE_FIELDS = [
    "hairColor",
    "hairStyle",
    "bodyType",
    "relationship",
    "penis",
    "pussy"
];

const OVERRIDE_MIN_CONFIDENCE = 75;

// Anatomy overrides (pussy, penis) are permanent changes the
// messages must actually describe. Models fabricate these
// fields at confidence 100 (echoing the prompt's example
// values like "Natural"), so confidence alone cannot be
// trusted: without matching evidence in the recent messages
// the value is dropped. The check is per-field, so it works
// identically regardless of the character's gender.
const GROOMING_EVIDENCE =
    /\b(?:shav\w*|trim\w*|wax\w*|raz[oe]r|groom\w*|stubble|hairless|lasered?|bald)\b/i;

const TRANSFORMATION_EVIDENCE =
    /\b(?:circumcis\w*|transform\w*|shapeshift\w*|polymorph\w*|cursed?|spell|potion|enchant\w*|surger\w*|surgical\w*|operation|grew|grows?|growing|grown|shr(?:ink|inks|inking|ank|unk)\w*|enlarg\w*|resiz\w*|reshap\w*|magic\w*)\b/i;

const ANATOMY_OVERRIDE_EVIDENCE = {
    pussy: text =>
        GROOMING_EVIDENCE.test(text) ||
        TRANSFORMATION_EVIDENCE.test(text),
    penis: text =>
        TRANSFORMATION_EVIDENCE.test(text)
};

// Covering-removal detection. Small models routinely leave
// the covering field "" (= unchanged) when the messages
// clearly remove it, so removal is also detected in code.
// Patterns are direction-aware: "pulls the blanket away"
// and "the blanket is pulled away" count; "pulls the
// blanket up over her" does not. Detection is item-aware:
// only removal of the item actually covering the character
// counts, so "he throws his jacket off" never clears a
// blanket.
const KNOWN_COVERING_ITEMS = [
    "blanket", "covers", "cover", "duvet", "quilt",
    "comforter", "bedsheet", "sheets", "sheet", "bedding",
    "towel", "tarp", "tarpaulin", "cloak", "cape", "coat",
    "jacket", "robe", "shawl", "poncho", "throw", "fur",
    "pelt", "hide", "cloth", "fabric", "canvas", "curtain",
    "drape", "rug", "sleeping bag", "afghan", "wrap"
];

// The alternation matches the item words present in the
// stored covering value; when none are recognized (an
// exotic covering), every known item word counts.
function coveringItemAlternation(previousCovering) {

    const value =
        String(previousCovering || "").toLowerCase();

    const present =
        KNOWN_COVERING_ITEMS.filter(item =>
            new RegExp(
                `\\b${item.replace(/ /g, "\\s+")}s?\\b`
            ).test(value)
        );

    const items = present.length
        ? present
        : KNOWN_COVERING_ITEMS;

    return (
        "(?:" +
        items
            .map(item => item.replace(/ /g, "\\s+"))
            .join("|") +
        ")s?"
    );

}

function buildCoveringRemovalPatterns(item) {
    return [

        // Active: "<verb> the blanket away/off/aside"
        new RegExp(
            "\\b(?:pulls?|pulled|pulling|pushes?|pushed|pushing|throws?|threw|thrown|tosses?|tossed|kicks?|kicked|yanks?|yanked|tugs?|tugged|whips?|whipped|slips?|slipped|slides?|slid|draws?|drew|drawn|casts?|flings?|flung|shoves?|shoved|sweeps?|swept|drags?|dragged|peels?|peeled|strips?|stripped|lifts?|lifted)\\s+(?:the\\s+|her\\s+|his\\s+|their\\s+|that\\s+|this\\s+)?" +
            item +
            "\\s+(?:away|off|aside)\\b",
            "i"
        ),

        // Passive / intransitive: "the blanket is pulled
        // away", "the blanket slips off", "the tarp falls
        // away"
        new RegExp(
            "\\b" + item +
            "\\s+(?:is|was|being|gets?|got|has been|had been)?\\s*(?:pulled|pushed|thrown|tossed|kicked|yanked|tugged|whipped|slipped|slips?|slid|slides?|drawn|cast|flung|shoved|swept|dragged|peeled|stripped|removed|discarded|lifted|falls?|fell|comes?|came)\\s*(?:away|off|aside)\\b",
            "i"
        ),

        // "removes/discards the blanket"
        new RegExp(
            "\\b(?:removes?|removed|removing|discards?|discarded|discarding)\\s+(?:the\\s+|her\\s+|his\\s+|their\\s+)?" +
            item + "\\b",
            "i"
        )

    ];
}

// A covering value that describes the removal event instead
// of a covering ("Blanket thrown off") means uncovered.
const COVERING_VALUE_IS_REMOVAL =
    /\b(?:pulled|thrown|tossed|kicked|pushed|yanked|whipped|flung|shoved|swept|dragged|stripped|slipped|fell|fallen)\s*(?:away|off|aside)\b|\b(?:removed|discarded|gone)\b/i;

function messagesRemoveCovering(
    messagesText,
    previousCovering
) {
    return buildCoveringRemovalPatterns(
        coveringItemAlternation(previousCovering)
    ).some(pattern =>
        pattern.test(messagesText)
    );
}

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

// FNV-1a: cheap deterministic hash so the variety offset is
// stable for a given character id.
function hashString(text) {

    let hash = 0x811c9dc5;

    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }

    return hash >>> 0;

}

function isFillableHeight(value) {

    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > 0
    );

}

// Token match so "petite frame" fires on "petite" but
// "shortly" never fires on "short".
function matchHeightBand(value, keywords) {

    const tokens = new Set(
        value
            .toLowerCase()
            .split(/[^a-z']+/)
            .filter(Boolean)
    );

    for (const band of ["short", "tall"]) {

        const words =
            keywords?.[band] ?? [];

        if (
            words.some(word =>
                tokens.has(word.toLowerCase())
            )
        ) {
            return band;
        }

    }

    return "";

}

// Picks the byAge entry for the character. An exact age
// match wins; otherwise "nearest" takes the closest defined
// age (ties round down) and "floor" takes the highest
// defined age at or below the character's (or the lowest
// entry when none is). Ages above the highest entry always
// use the highest entry. Unparseable ages follow unknownAge:
// "youngest" uses the lowest entry, "blank" skips the fill.
function resolveAgeKey(result, config) {

    const definedAges =
        Object.keys(config.byAge ?? {})
            .map(Number)
            .filter(Number.isFinite)
            .sort((a, b) => a - b);

    if (!definedAges.length) {
        return "";
    }

    const digits =
        String(result.age?.value ?? "")
            .replace(/\D+/g, "");

    if (!digits) {
        return config.unknownAge === "youngest"
            ? String(definedAges[0])
            : "";
    }

    const age = Number(digits);

    if (config.byAge[String(age)]) {
        return String(age);
    }

    const highest =
        definedAges[definedAges.length - 1];

    if (age >= highest) {
        return String(highest);
    }

    if (config.fallback === "floor") {

        const floor =
            [...definedAges]
                .reverse()
                .find(defined => defined <= age);

        return String(
            floor ?? definedAges[0]
        );

    }

    let nearest = definedAges[0];

    for (const defined of definedAges) {

        // Strict comparison over the ascending list keeps
        // the lower age on equidistant ties.
        if (
            Math.abs(defined - age) <
            Math.abs(nearest - age)
        ) {
            nearest = defined;
        }

    }

    return String(nearest);

}

function resolveHeightBaseline(
    config,
    ageKey,
    gender,
    band
) {

    const value =
        config.byAge?.[ageKey]
            ?.[gender]?.[band];

    return isFillableHeight(value)
        ? value
        : 0;

}

function applyHeightFill(
    result,
    gender,
    characterId,
    config
) {

    const height = result.height;

    if (
        !height ||
        !config
    ) {
        return;
    }

    const original = height.value;

    // Any digits mean a real measurement ("170cm",
    // "5 feet", "5'4\"") — never overwrite it.
    if (/\d/.test(original)) {
        return;
    }

    if (!gender) {
        return;
    }

    let band;
    let confidence;

    if (original === "") {
        band = "average";
        confidence = 25;
    } else {

        band =
            matchHeightBand(
                original,
                config.keywords
            );

        if (!band) {
            return;
        }

        confidence = 50;

    }

    const ageKey =
        resolveAgeKey(result, config);

    if (!ageKey) {
        return;
    }

    const baseline =
        resolveHeightBaseline(
            config,
            ageKey,
            gender,
            band
        );

    if (!baseline) {
        return;
    }

    let cm = baseline;

    const variety =
        Math.floor(
            Number(config.varietyCm) || 0
        );

    if (variety > 0 && characterId) {

        cm =
            baseline +
            (
                hashString(String(characterId)) %
                (2 * variety + 1)
            ) -
            variety;

    }

    const formatted =
        String(config.format)
            .replace("{cm}", String(cm));

    // Descriptor words stay in the value: "short (152 cm)".
    height.value =
        original
            ? `${original} (${formatted})`
            : formatted;

    height.confidence = confidence;

}

function applyExpressionFlush(result) {

    const expression = result.expression;

    if (!expression || !expression.value) {
        return;
    }

    const stripped =
        expression.value.replace(
            FLUSH_WORDS,
            " "
        );

    if (stripped === expression.value) {
        return;
    }

    expression.value =
        stripped
            .replace(/\s+/g, " ")
            .replace(/\s*,(?:\s*,)+/g, ",")
            .replace(/\band\s+and\b/gi, "and")
            .replace(/^[\s,;]*(?:and\b)?[\s,;]*/i, "")
            .replace(/[\s,;]*(?:\band)?[\s,;]*$/i, "")
            .trim();

    const condition = result.condition;

    if (!condition) {

        result.condition = {
            value: "Blushing",
            confidence: 25
        };

    } else if (
        !/\bblushing\b/i.test(condition.value)
    ) {

        condition.value =
            condition.value
                ? condition.value + ", Blushing"
                : "Blushing";

    }

}

function applyConsistency(result) {

    for (const key of Object.keys(result)) {

        const field = result[key];

        if (
            !field ||
            typeof field !== "object"
        ) {
            continue;
        }

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

// Consistency pass (rule 5) for merged field maps. The
// per-extraction post-processors only see extraction output;
// merging can reintroduce stored template values with a
// non-empty value at confidence 0, so the final merged data
// needs its own pass before it is persisted.
export function enforceConsistency(fields) {

    const result =
        structuredClone(fields);

    applyConsistency(result);

    return result;

}

export function postProcessFacts(
    facts,
    {
        gender = "",
        characterId = "",
        heightConfig = null
    } = {}
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

    // Resolve the age after stripping non-numeric text.
    applyHeightFill(
        result,
        resolvedGender,
        characterId,
        heightConfig
    );

    applyConsistency(result);

    return result;

}

export function postProcessState(
    state,
    {
        gender = "",
        previousFacts = null,
        messages = ""
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

    applyExpressionFlush(result);

    // A populated override field permanently rewrites a
    // stored fact, so a weak guess is worse than no value:
    // drop anything below the explicit/strongly-implied bar.
    for (const key of OVERRIDE_FIELDS) {

        const field = result[key];

        if (
            field &&
            field.value !== "" &&
            field.confidence < OVERRIDE_MIN_CONFIDENCE
        ) {
            field.value = "";
            field.confidence = 0;
        }

    }

    const messagesText =
        String(messages ?? "");

    if (messagesText) {

        for (
            const [key, hasEvidence]
            of Object.entries(ANATOMY_OVERRIDE_EVIDENCE)
        ) {

            const field = result[key];

            if (
                field &&
                field.value !== "" &&
                !hasEvidence(messagesText)
            ) {
                field.value = "";
                field.confidence = 0;
            }

        }

    }

    if (result.covering) {

        // A removal event is not a covering: normalize it.
        if (
            COVERING_VALUE_IS_REMOVAL.test(
                result.covering.value
            )
        ) {
            result.covering.value = "no covering";
            result.covering.confidence = 75;
        }

        // The model said "unchanged" while the messages
        // removed an active covering: force the removal.
        const previousCovering =
            String(
                previousFacts?.covering?.value ?? ""
            ).trim();

        if (
            result.covering.value === "" &&
            previousCovering &&
            !/^no\b/i.test(previousCovering) &&
            messagesText &&
            messagesRemoveCovering(
                messagesText,
                previousCovering
            )
        ) {
            result.covering.value = "no covering";
            result.covering.confidence = 75;
        }

    }

    for (
        const [key, defaultValue]
        of Object.entries(STATE_DEFAULTS)
    ) {

        const field = result[key];

        if (!field) {
            continue;
        }

        const previousValue =
            String(
                previousFacts?.[key]?.value ?? ""
            ).trim();

        const usualValue =
            String(
                previousFacts?.[
                    USUAL_OUTFIT_SOURCES[key]
                ]?.value ?? ""
            ).trim();

        const fillValue =
            usualValue || defaultValue;

        if (field.value === "") {

            // "" with a stored previous value means unchanged;
            // only a truly blank field gets the default —
            // the character's usual outfit when known,
            // otherwise the generic default.
            if (!previousValue) {
                field.value = fillValue;
                field.confidence = 25;
            }

            continue;

        }

        // The extraction sometimes echoes a default at guess
        // confidence even though the previous state holds a
        // real value (e.g. "white shirt" re-dressing a
        // character stored as "no shirt"). A default is only
        // ever a stand-in for "nothing known", so it must
        // never displace known state. The same applies to an
        // echoed usual-outfit garment: wearing it must come
        // from the messages, not from the wardrobe record.
        const echoed =
            field.value.toLowerCase() ===
                defaultValue.toLowerCase() ||
            (
                usualValue &&
                field.value.toLowerCase() ===
                    usualValue.toLowerCase()
            );

        if (
            previousValue &&
            field.confidence <= 25 &&
            echoed &&
            previousValue.toLowerCase() !==
                field.value.toLowerCase()
        ) {
            field.value = "";
            field.confidence = 0;
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
