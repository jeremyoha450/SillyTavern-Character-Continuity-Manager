export const CARD_LENGTHS = {
    compact: {
        label: "Compact",
        guidance: "Keep the complete card concise, roughly 700-1100 words. Prioritize defining traits and avoid repetition."
    },
    standard: {
        label: "Standard",
        guidance: "Create a balanced complete card, roughly 1200-2000 words including greetings, examples, and lore."
    },
    detailed: {
        label: "Detailed",
        guidance: "Create a rich card, roughly 2200-3500 words with nuanced behaviour, relationships, dialogue, and lore without repetition."
    }
};

export const CARD_TYPES = {
    character: {
        label: "Individual Character",
        description: "A defined person with appearance, personality, history, voice, and a relationship to the user.",
        subjectLabel: "character",
        briefLabel: "Character description",
        showAppearance: true,
        guidance: "Create a single embodied character. Prioritize stable appearance, nuanced personality, behaviour, voice, background, goals, flaws, and relationship to the user."
    },
    connected: {
        label: "Connected Cast",
        description: "Separate character cards sharing one world, history, scenario, and relationship network.",
        subjectLabel: "character",
        briefLabel: "Character description",
        showAppearance: true,
        guidance: "Create separate embodied characters with distinct appearances, voices, goals, flaws, and perspective-sensitive reciprocal relationships."
    },
    world: {
        label: "Open World",
        description: "A setting that dynamically portrays locations, factions, events, and changing NPCs.",
        subjectLabel: "world card",
        briefLabel: "World concept and rules",
        showAppearance: false,
        guidance: "The card represents an open world, not one fixed person. Define its premise, locations, factions, rules, conflicts, dynamic NPC generation, narration style, user freedom, and evolving events."
    },
    narrator: {
        label: "Narrator / Scenario",
        description: "A storyteller, game master, simulation, or focused interactive scenario.",
        subjectLabel: "narrator card",
        briefLabel: "Story or simulation concept",
        showAppearance: false,
        guidance: "The card runs a scenario or narrates a story rather than acting as one fixed person. Define narration style, rules, pacing, user agency, NPC handling, stakes, and progression."
    },
    tool: {
        label: "Tool / Assistant",
        description: "A tutor, writing partner, game utility, translator, adviser, or specialist assistant.",
        subjectLabel: "assistant card",
        briefLabel: "Purpose and capabilities",
        showAppearance: false,
        guidance: "The card is a useful assistant rather than a roleplay person. Define its purpose, expertise, workflow, response style, boundaries, inputs, outputs, and examples of successful assistance."
    }
};

export const COMMON_CHARACTER_TAGS = [
    "Anime/Manga",
    "Sister",
    "Masturbation",
    "NSFW",
    "Fluff",
    "SFW <-> NSFW",
    "Can be wholesome, can be sexy",
    "Submissive",
    "OC",
    "Shy",
    "Female",
    "Human",
    "Cute",
    "Romance",
    "Roleplay",
    "Thick Thighs",
    "Schoolgirl",
    "Big Butt",
    "Hentai",
    "Original Character",
    "Thicc"
];

export function mergeTagSuggestions(...groups) {
    const result = [];
    const seen = new Set();
    for (const value of groups.flat(Infinity)) {
        const candidate = value && typeof value === "object"
            ? value.name ?? value.label ?? ""
            : value;
        const tag = String(candidate ?? "").trim();
        const key = tag.toLowerCase();
        if (tag && !seen.has(key)) {
            seen.add(key);
            result.push(tag);
        }
    }
    return result.sort((a, b) => a.localeCompare(b));
}

export function filterTagSuggestions(tags, query, selected = []) {
    const search = String(query || "").trim().toLowerCase();
    const selectedKeys = new Set(selected.map(value => String(value).toLowerCase()));
    return tags
        .filter(tag => !selectedKeys.has(tag.toLowerCase()))
        .filter(tag => !search || tag.toLowerCase().includes(search));
}

const FEMALE_TOPS = [
    "shirt", "sports bra", "long-sleeve shirt", "V-neck shirt", "crew neck shirt",
    "Henley", "polo shirt", "tank top", "sleeveless top", "camisole", "tube top",
    "halter top", "crop top", "blouse", "tunic", "peasant top", "wrap top",
    "off-the-shoulder top", "cold-shoulder top", "button-up shirt", "button-down shirt"
];
const FEMALE_BOTTOMS = [
    "jeans", "skirt", "mini-skirt", "cargo pants", "chinos", "dress pants", "trousers",
    "slacks", "joggers", "sweatpants", "track pants", "leggings", "jeggings", "yoga pants",
    "compression leggings", "thermal pants", "palazzo pants", "linen pants", "capris", "cropped pants"
];
const MALE_TOPS = ["shirt", "singlet", "button-up shirt"];
const MALE_BOTTOMS = ["jeans", "shorts", "pants"];

function seededNumber(value) {
    let hash = 2166136261;
    for (const character of String(value || "")) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function seededPick(values, seed, offset) {
    return values[(seededNumber(`${seed}:${offset}`) % values.length)];
}

export function generateCreatorClothing({ name = "", age = "", gender = "" } = {}, index = 0) {
    const seed = `${name}:${age}:${gender}:${index}`;
    const normalizedGender = String(gender).trim().toLowerCase();

    if (/female|woman|girl/.test(normalizedGender)) {
        const dress = seededNumber(`${seed}:dress`) % 4 === 0;
        const outfit = dress
            ? `Outfit: ${seededPick(["dress", "wrap dress", "sundress"], seed, 1)}`
            : `Top: ${seededPick(FEMALE_TOPS, seed, 2)}; Bottom: ${seededPick(FEMALE_BOTTOMS, seed, 3)}`;
        return `${outfit}; Underwear top: ${seededPick(["bra", "no bra"], seed, 4)}; Underwear bottom: ${seededPick(["panties", "no panties"], seed, 5)}`;
    }

    if (/male|man|boy/.test(normalizedGender)) {
        const outfit = `Top: ${seededPick(MALE_TOPS, seed, 1)}; Bottom: ${seededPick(MALE_BOTTOMS, seed, 2)}`;
        return `${outfit}; Underwear top: singlet; Underwear bottom: ${seededPick(["underwear", "boxers"], seed, 4)}`;
    }

    return `Top: ${seededPick(["shirt", "long-sleeve shirt", "polo shirt"], seed, 1)}; Bottom: ${seededPick(["jeans", "shorts", "trousers"], seed, 2)}; Underwear: ${seededPick(["underwear", "boxers"], seed, 4)}`;
}

export function estimateTokens(card) {
    const text = [
        card?.description,
        card?.personality,
        card?.scenario,
        card?.first_mes,
        card?.mes_example,
        ...(card?.alternate_greetings || []),
        ...(card?.group_only_greetings || []),
        ...(card?.character_book?.entries || []).map(entry => entry.content)
    ].filter(Boolean).join("\n");

    return Math.ceil(text.length / 4);
}

export function validateCreatorCard(card, characterNames = []) {
    const issues = [];
    const required = [
        ["name", "Name is missing."],
        ["description", "Description is missing."],
        ["personality", "Personality is missing."],
        ["scenario", "Scenario is missing."],
        ["first_mes", "First message is missing."],
        ["mes_example", "Example dialogue is missing."]
    ];

    for (const [field, message] of required) {
        if (!String(card?.[field] || "").trim()) issues.push(message);
    }

    if (
        card?.mes_example &&
        (!card.mes_example.includes("{{char}}:") ||
            !card.mes_example.includes("{{user}}:"))
    ) {
        issues.push("Example dialogue should contain {{char}}: and {{user}}: labels.");
    }

    if (characterNames.length > 1) {
        const description = String(card?.description || "").toLowerCase();
        const missing = characterNames
            .filter(name => name !== card?.name)
            .filter(name => !description.includes(String(name).toLowerCase()));
        if (missing.length) {
            issues.push(`Relationships do not mention: ${missing.join(", ")}.`);
        }
    }

    return issues;
}

export function buildRelationshipSummaries(names, relationships) {
    return names.map((name, index) => {
        const lines = [];
        for (let other = 0; other < names.length; other++) {
            if (other === index) continue;
            const low = Math.min(index, other);
            const high = Math.max(index, other);
            const key = `${low}:${high}`;
            const dynamic = String(relationships?.[key] || "").trim();
            if (dynamic) lines.push(`${names[other]}: ${dynamic}`);
        }
        return lines.join("\n");
    });
}

export function lockCreatorPlan(plan, setup, briefs, relationshipMatrix = {}) {
    const locked = structuredClone(plan || {});
    const sourceBriefs = Array.isArray(briefs) ? briefs : [];

    if (setup?.setName) locked.setName = String(setup.setName);
    if (!String(locked.sharedScenario || "").trim() && setup?.setting) {
        locked.sharedScenario = String(setup.setting);
    }
    if (setup?.userRole) locked.userRole = String(setup.userRole);
    if (setup?.tone) locked.tone = String(setup.tone);

    locked.cast = (locked.cast || []).map((planned, index) => {
        const original = sourceBriefs.find(item =>
            String(item?.name || "").trim().toLowerCase() ===
            String(planned?.name || "").trim().toLowerCase()
        ) || sourceBriefs[index] || {};
        const originalIndex = Math.max(0, sourceBriefs.indexOf(original));
        const relationships = sourceBriefs
            .map((other, otherIndex) => ({ other, otherIndex }))
            .filter(({ otherIndex }) => otherIndex !== originalIndex)
            .map(({ other, otherIndex }) => {
                const low = Math.min(originalIndex, otherIndex);
                const high = Math.max(originalIndex, otherIndex);
                return {
                    name: String(other?.name || ""),
                    dynamic: String(relationshipMatrix[`${low}:${high}`] || "")
                };
            })
            .filter(item => item.name && item.dynamic);

        return {
            ...planned,
            name: String(original.name || planned.name || ""),
            age: String(original.age || ""),
            gender: String(original.gender || ""),
            species: String(original.species || ""),
            appearance: structuredClone(original.appearance || {}),
            userBrief: String(original.brief || ""),
            personalScenario: String(original.scenario || ""),
            relationships: relationships.length
                ? relationships
                : planned.relationships || []
        };
    });

    return locked;
}

export function applyLockedCardDetails(card, plan, selectedCharacter) {
    const result = structuredClone(card || {});
    const selected = selectedCharacter || {};
    result.name = String(selected.name || result.name || "");

    const lockedDetails = [
        ["Age", selected.age],
        ["Gender", selected.gender],
        ["Species", selected.species],
        ["Height", selected.appearance?.height],
        ["Body type", selected.appearance?.bodyType],
        ["Skin", selected.appearance?.skin],
        ["Eyes", selected.appearance?.eyes],
        ["Hair", selected.appearance?.hair],
        ["Face", selected.appearance?.face],
        ["Usual clothing", selected.appearance?.clothing],
        ["Distinctive features", selected.appearance?.distinctiveFeatures]
    ].filter(([, value]) => String(value || "").trim());
    const description = String(result.description || "");
    const missingDetails = lockedDetails.filter(([, value]) =>
        !description.toLowerCase().includes(String(value).trim().toLowerCase())
    );
    const additions = [];
    if (missingDetails.length) {
        additions.push(`[Creator-Provided Details]\n${missingDetails
            .map(([label, value]) => `${label}: ${String(value).trim()}`)
            .join("\n")}`);
    }
    if (additions.length) {
        result.description = [description.trim(), ...additions].filter(Boolean).join("\n\n");
    }

    let scenario = String(result.scenario || "").trim();
    if (!scenario) {
        scenario = String(plan?.sharedScenario || "").trim();
    }
    result.scenario = scenario;

    return result;
}

export function buildCreatorImageContinuity(card, selectedCharacter = {}) {
    const appearance = selectedCharacter.appearance || {};
    const facts = {
        characterName: card?.name || selectedCharacter.name || "",
        age: selectedCharacter.age || "",
        gender: selectedCharacter.gender || "",
        species: selectedCharacter.species || "",
        height: appearance.height || "",
        bodyType: appearance.bodyType || "",
        skin: appearance.skin || "",
        eyeColor: appearance.eyes || "",
        hairColor: appearance.hair || "",
        face: appearance.face || "",
        clothing: appearance.clothing || "",
        distinctiveFeatures: appearance.distinctiveFeatures || "",
        description: card?.description || ""
    };
    return {
        primaryCharacter: {
            facts: Object.fromEntries(
                Object.entries(facts).filter(([, value]) => String(value || "").trim())
            ),
            state: {
                position: "portrait pose",
                eyeDirection: "looking at viewer",
                expression: "natural expression"
            }
        },
        notes: "Create one clean character avatar portrait. Prioritize stable physical appearance over the current story scene."
    };
}

export function modelSizeBillions(label) {
    const matches = [...String(label || "").matchAll(/(?:^|[^\d.])(\d+(?:\.\d+)?)\s*b(?:\b|[-_])/gi)];
    if (!matches.length) return null;
    return Math.max(...matches.map(match => Number(match[1])));
}

export function getModelSpecs(label) {
    const text = String(label || "");
    const quantization = text.match(/(?:^|[-_\s])(Q\d(?:_[A-Z0-9]+)*|FP(?:8|16|32)|BF16|INT(?:4|8))(?:$|[-_\s])/i)?.[1] || null;
    const contextMatch = text.match(/(?:^|[-_\s])(\d+(?:\.\d+)?)\s*(K|M)\s*(?:CTX|CONTEXT|TOKENS?)?(?:$|[-_\s])/i);
    const explicitContext = text.match(/(?:^|\s)([\d,]+)\s+TOKENS?\s+CONTEXT(?:$|\s)/i);
    let contextTokens = explicitContext
        ? Number(explicitContext[1].replaceAll(",", ""))
        : null;
    if (contextMatch) {
        contextTokens = Math.round(
            Number(contextMatch[1]) * (contextMatch[2].toUpperCase() === "M" ? 1_000_000 : 1_000)
        );
    }

    return {
        parametersBillions: modelSizeBillions(text),
        quantization: quantization?.toUpperCase() || null,
        contextTokens
    };
}

export function formatModelSpecs(label) {
    const specs = getModelSpecs(label);
    const details = [
        specs.parametersBillions ? `${specs.parametersBillions}B parameters` : "Parameters unknown",
        specs.quantization || "Quantization unknown",
        specs.contextTokens ? `${specs.contextTokens.toLocaleString()} token context` : "Context unknown"
    ];
    return details.join(" · ");
}

export function compareCreatorModels(ccmLabel, sillyTavernLabel, count) {
    const ccmSpecs = getModelSpecs(ccmLabel);
    const stSpecs = getModelSpecs(sillyTavernLabel);
    const ccmSize = ccmSpecs.parametersBillions;
    const stSize = stSpecs.parametersBillions;
    const needsLarger = Number(count) >= 4;

    let betterSource = null;
    let recommendation;

    if (ccmSize && stSize && ccmSize !== stSize) {
        betterSource = ccmSize > stSize ? "ccm" : "sillytavern";
        const betterName = betterSource === "ccm" ? "CCM Provider" : "SillyTavern Active Model";
        recommendation = `Recommended: ${betterName} for 4 or more characters (${Math.max(ccmSize, stSize)}B vs ${Math.min(ccmSize, stSize)}B). The smaller model should usually be suitable for 1–3 characters.`;
        if (needsLarger) recommendation += ` For this ${count}-character cast, use ${betterName}.`;
        recommendation += " Parameter count is a useful estimate, not a guarantee of output quality.";
    } else if (ccmSize && stSize) {
        recommendation = `Both models report ${ccmSize}B parameters, so neither is clearly better from the available specifications. For 4 or more characters, prefer the model you know follows complex instructions more reliably.`;
    } else if (!ccmSize || !stSize) {
        recommendation = "A reliable winner cannot be determined because one or both model names do not expose parameter size. For 4 or more characters, use the stronger model if you know it; otherwise test both with the same brief.";
    }

    return { ccmSize, stSize, ccmSpecs, stSpecs, betterSource, needsLarger, recommendation };
}
