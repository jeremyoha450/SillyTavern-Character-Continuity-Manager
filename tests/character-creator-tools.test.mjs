import test from "node:test";
import assert from "node:assert/strict";

import {
    CARD_TYPES,
    COMMON_CHARACTER_TAGS,
    applyLockedCardDetails,
    buildCreatorImageContinuity,
    buildRelationshipSummaries,
    compareCreatorModels,
    estimateTokens,
    formatModelSpecs,
    filterTagSuggestions,
    generateCreatorClothing,
    getModelSpecs,
    lockCreatorPlan,
    mergeTagSuggestions,
    validateCreatorCard
} from "../scripts/character-creator-tools.js";

test("card type presets provide tailored generation guidance", () => {
    assert.equal(CARD_TYPES.character.showAppearance, true);
    assert.equal(CARD_TYPES.world.showAppearance, false);
    assert.match(CARD_TYPES.tool.guidance, /assistant/i);
});

test("tag suggestions merge case-insensitively and support search", () => {
    const tags = mergeTagSuggestions(
        [{ name: "Romance" }, { name: "Adventure" }],
        COMMON_CHARACTER_TAGS,
        ["romance", "Custom"]
    );
    assert.equal(tags.filter(tag => tag.toLowerCase() === "romance").length, 1);
    assert.deepEqual(filterTagSuggestions(tags, "thic", ["Thicc"]), ["Thick Thighs"]);
});

test("random creator clothing is stable and assumes adult characters", () => {
    const adult = generateCreatorClothing({ name: "Ava", age: "24", gender: "Female" });
    assert.equal(adult, generateCreatorClothing({ name: "Ava", age: "24", gender: "Female" }));
    assert.match(adult, /(?:Outfit|Top):/);

    const explicitYoungAge = generateCreatorClothing({ name: "Bea", age: "16", gender: "Female" });
    assert.match(explicitYoungAge, /Underwear top: (?:bra|no bra); Underwear bottom: (?:panties|no panties)/);
    assert.doesNotMatch(explicitYoungAge, /age-appropriate undergarments/i);

    const unknownAge = generateCreatorClothing({ name: "Cleo", age: "", gender: "Male" });
    assert.match(unknownAge, /Underwear top: singlet; Underwear bottom: (?:underwear|boxers)/);
});

test("relationship matrix creates a perspective list for every character", () => {
    const summaries = buildRelationshipSummaries(
        ["Ava", "Bea", "Cleo"],
        { "0:1": "Sisters", "0:2": "Rivals", "1:2": "Friends" }
    );
    assert.match(summaries[0], /Bea: Sisters/);
    assert.match(summaries[0], /Cleo: Rivals/);
    assert.match(summaries[2], /Bea: Friends/);
});

test("creator plan locks every user-entered character detail", () => {
    const plan = lockCreatorPlan({
        sharedScenario: "AI replacement",
        userRole: "Stranger",
        tone: "Wrong",
        cast: [{ name: "Changed", relationships: [] }, { name: "Bea", relationships: [] }]
    }, {
        setName: "Sisters",
        setting: "At home",
        userRole: "Friend",
        tone: "Warm"
    }, [{
        name: "Ava", age: "28", gender: "Woman", species: "Human",
        appearance: { hair: "Red curls", eyes: "Blue" },
        brief: "A careful doctor.", scenario: "Cooking dinner."
    }, {
        name: "Bea", age: "30", gender: "Woman", species: "Human",
        appearance: { hair: "Black bob" }, brief: "A bold artist.", scenario: "Arriving late."
    }], { "0:1": "Sisters who trust each other." });

    assert.equal(plan.sharedScenario, "AI replacement");
    assert.equal(plan.userRole, "Friend");
    assert.equal(plan.tone, "Warm");
    assert.equal(plan.cast[0].name, "Ava");
    assert.equal(plan.cast[0].appearance.hair, "Red curls");
    assert.equal(plan.cast[0].relationships[0].dynamic, "Sisters who trust each other.");
});

test("generated card restores structured details without echoing raw prose", () => {
    const card = applyLockedCardDetails({
        name: "Wrong",
        description: "[Identity]\nA doctor.",
        scenario: "The room is quiet."
    }, {
        sharedScenario: "The user arrives home."
    }, {
        name: "Ava",
        age: "28",
        gender: "Woman",
        species: "Human",
        appearance: { hair: "Red curls", eyes: "Blue" },
        userBrief: "A careful doctor.",
        personalScenario: "She is cooking dinner.",
        relationships: [{ name: "Bea", dynamic: "Her trusted sister." }]
    });

    assert.equal(card.name, "Ava");
    assert.match(card.description, /Hair: Red curls/);
    assert.doesNotMatch(card.description, /\[Creator Brief\]/);
    assert.doesNotMatch(card.description, /\[Creator-Provided Relationships\]/);
    assert.doesNotMatch(card.scenario, /The user arrives home\./);
    assert.doesNotMatch(card.scenario, /She is cooking dinner\./);
    assert.match(card.scenario, /The room is quiet\./);
});

test("creator image continuity uses stable appearance instead of scene details", () => {
    const continuity = buildCreatorImageContinuity({
        name: "Ava",
        description: "A careful doctor."
    }, {
        age: "28",
        gender: "Woman",
        appearance: { hair: "Red curls", eyes: "Blue", clothing: "White coat" }
    });
    assert.equal(continuity.primaryCharacter.facts.hairColor, "Red curls");
    assert.equal(continuity.primaryCharacter.facts.eyeColor, "Blue");
    assert.equal(continuity.primaryCharacter.facts.clothing, "White coat");
    assert.doesNotMatch(JSON.stringify(continuity), /current story scene.*included/i);
});

test("card validator reports incomplete and missing connected details", () => {
    const issues = validateCreatorCard({
        name: "Ava",
        description: "Ava is here.",
        personality: "Calm",
        scenario: "Home",
        first_mes: "Hello",
        mes_example: "No labels"
    }, ["Ava", "Bea"]);
    assert.ok(issues.some(issue => issue.includes("{{char}}")));
    assert.ok(issues.some(issue => issue.includes("Bea")));
});

test("token estimator includes lore and greetings", () => {
    assert.ok(estimateTokens({
        description: "a".repeat(400),
        alternate_greetings: ["b".repeat(400)],
        character_book: { entries: [{ content: "c".repeat(400) }] }
    }) >= 300);
});

test("model comparison recommends the larger model for bigger casts", () => {
    const result = compareCreatorModels(
        "Gemma 8B Q4",
        "Qwen 32B",
        5
    );
    assert.equal(result.needsLarger, true);
    assert.equal(result.stSize, 32);
    assert.equal(result.betterSource, "sillytavern");
    assert.match(result.recommendation, /For this 5-character cast, use SillyTavern Active Model/);
});

test("model specifications are conservatively parsed from model names", () => {
    assert.deepEqual(getModelSpecs("gemma-3-12B-it-Q4_K_M-128K-context"), {
        parametersBillions: 12,
        quantization: "Q4_K_M",
        contextTokens: 128000
    });
    assert.equal(getModelSpecs("Active model — 32,768 token context").contextTokens, 32768);
    assert.match(formatModelSpecs("gemma-3-12B-it-Q4_K_M"), /12B parameters · Q4_K_M · Context unknown/);
});

test("model comparison does not invent a winner for unknown specifications", () => {
    const result = compareCreatorModels("custom-model", "remote-model", 4);
    assert.equal(result.betterSource, null);
    assert.match(result.recommendation, /cannot be determined/);
});
