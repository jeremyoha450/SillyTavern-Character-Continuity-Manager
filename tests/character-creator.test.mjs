import test from "node:test";
import assert from "node:assert/strict";

import {
    buildCharacterCard,
    buildCreatePayload
} from "../scripts/character-card.js";

import {
    getTask
} from "../scripts/tasks/index.js";

const example = {
    name: "Mara",
    nickname: "Mars",
    description: "[Identity]\nName: Mara",
    personality: "[Core Personality]\nCurious",
    scenario: "A shared apartment.",
    first_mes: "*Mara opens the door.* Hello.",
    mes_example: "<START>\n{{user}}: Hi\n{{char}}: Hello",
    alternate_greetings: ["Alternative"],
    group_only_greetings: ["Everyone is here."],
    tags: ["modern"],
    creator_notes: "Created for continuity testing.",
    system_prompt: "Remain in character.",
    post_history_instructions: "Remember the current scene.",
    talkativeness: 0,
    depth_prompt: "Mara is observant.",
    character_book: {
        name: "Shared World",
        entries: [{
            keys: ["apartment"],
            comment: "Home",
            content: "The cast shares an apartment."
        }]
    }
};

test("character creator builds a complete V3 card", () => {
    const card = buildCharacterCard(example, "Tester");

    assert.equal(card.spec, "chara_card_v3");
    assert.equal(card.spec_version, "3.0");
    assert.equal(card.data.name, example.name);
    assert.equal(card.data.nickname, "Mars");
    assert.equal(card.data.description, example.description);
    assert.equal(card.data.personality, example.personality);
    assert.equal(card.data.scenario, example.scenario);
    assert.equal(card.data.first_mes, example.first_mes);
    assert.equal(card.data.mes_example, example.mes_example);
    assert.deepEqual(card.data.alternate_greetings, example.alternate_greetings);
    assert.deepEqual(card.data.group_only_greetings, ["Everyone is here."]);
    assert.deepEqual(card.data.tags, example.tags);
    assert.equal(card.data.creator_notes, example.creator_notes);
    assert.equal(card.data.system_prompt, example.system_prompt);
    assert.equal(card.data.post_history_instructions, example.post_history_instructions);
    assert.equal(card.data.extensions.talkativeness, 0);
    assert.equal(card.data.extensions.depth_prompt.prompt, example.depth_prompt);
    assert.equal(card.data.character_book.name, example.character_book.name);
    assert.deepEqual(card.data.character_book.entries[0].keys, ["apartment"]);
    assert.equal(card.data.character_book.entries[0].comment, "Home");
    assert.equal(card.data.character_book.entries[0].content, "The cast shares an apartment.");
    assert.equal(card.data.character_book.entries[0].enabled, true);
    assert.equal(card.data.assets[0].uri, "ccdefault:");
});

test("SillyTavern create payload preserves V3-only fields", () => {
    const payload = buildCreatePayload(example, "Tester");
    const embedded = JSON.parse(payload.json_data);

    assert.equal(payload.ch_name, "Mara");
    assert.equal(embedded.data.nickname, "Mars");
    assert.deepEqual(embedded.data.group_only_greetings, ["Everyone is here."]);
    assert.equal(embedded.data.character_book.name, "Shared World");
});

test("character card task normalizes generated card JSON", () => {
    const task = getTask("character-card");
    const parsed = task.parse(`\`\`\`json\n${JSON.stringify(example)}\n\`\`\``);

    assert.equal(parsed.name, "Mara");
    assert.equal(parsed.talkativeness, 0);
    assert.deepEqual(parsed.character_book.entries[0].keys, ["apartment"]);
});

test("character card repairs trailing commas and common array-shaped fields", () => {
    const task = getTask("character-card");
    const parsed = task.parse(`Output: {
        "name": "Jen",
        "description": "Complete description",
        "personality": "[Core Personality]\\nWarm",
        "mes_example": ["<START>One", "<START>Two",],
        "character_book": {
            "Jen": [
                {"keys":["Jen"],"comment":"Identity","content":"Jen is married."},
            ]
        }
    }`);

    assert.equal(parsed.mes_example, "<START>One\n\n<START>Two");
    assert.equal(parsed.character_book.name, "Jen");
    assert.equal(parsed.character_book.entries[0].comment, "Identity");
});

test("character card repairs escaped closing quotes and ignores repeated JSON attempts", () => {
    const task = getTask("character-card");
    const malformed = `Output: {
      "name": "Jen",
      "description": "First line.\\",
      "personality": "Warm.\\
Second line"
    }
    <|channel>thought</|channel>
    {"name":"Wrong attempt","description":"Do not select this."}`;
    const parsed = task.parse(malformed);

    assert.equal(parsed.name, "Jen");
    assert.equal(parsed.description, "First line.");
    assert.equal(parsed.personality, "Warm.\nSecond line");
});

test("character card recovers fields from a nested chara_card_v3 envelope instead of dropping them", () => {
    const task = getTask("character-card");
    const parsed = task.parse(JSON.stringify({
        name: "Kim",
        description: "",
        personality: "",
        data: {
            name: "Kim",
            description: "[Identity]\nName: Kim",
            personality: "[Core Personality]\nSharp-tempered",
            scenario: "A shared kitchen."
        }
    }));

    assert.equal(parsed.description, "[Identity]\nName: Kim");
    assert.equal(parsed.personality, "[Core Personality]\nSharp-tempered");
    assert.equal(parsed.scenario, "A shared kitchen.");
});

test("character card flattens an object-shaped personality field instead of dropping it", () => {
    const task = getTask("character-card");
    const parsed = task.parse(JSON.stringify({
        name: "Kim",
        description: "[Identity]\nName: Kim",
        personality: {
            "Core Personality": "Heavily and overtly angry.",
            "[Behaviour]": "Raises her voice immediately."
        }
    }));

    assert.match(parsed.personality, /\[Core Personality\]\nHeavily and overtly angry\./);
    assert.match(parsed.personality, /\[Behaviour\]\nRaises her voice immediately\./);
});

test("character card strips stray unmatched braces from prose fields but keeps macros", () => {
    const task = getTask("character-card");
    const parsed = task.parse(JSON.stringify({
        name: "Kim",
        description: "[Identity]\nName: Kim",
        personality: "[Behaviour]\nShe slams doors when {{user}} pushes a nerve.\n}",
        post_history_instructions: "}\n{{char}}'s anger takes priority over what {{user}} wants.",
        alternate_greetings: ["(She looks up.)\n\"What?\"\n}"],
        character_book: {
            name: "Kim Lore",
            entries: [{ keys: ["sorry"], content: "An apology does not soften {{char}}.}" }]
        }
    }));

    assert.equal(parsed.personality, "[Behaviour]\nShe slams doors when {{user}} pushes a nerve.");
    assert.equal(parsed.post_history_instructions, "{{char}}'s anger takes priority over what {{user}} wants.");
    assert.equal(parsed.alternate_greetings[0], "(She looks up.)\n\"What?\"");
    assert.equal(parsed.character_book.entries[0].content, "An apology does not soften {{char}}.");
});

test("character card flattens unknown personality section keys without dropping content", () => {
    const task = getTask("character-card");
    const parsed = task.parse(JSON.stringify({
        name: "Kim",
        description: "[Identity]\nName: Kim",
        personality: {
            "Core Personality": "Heavily and overtly angry.",
            "Behaviour Insight": "Her volume rises before her words catch up."
        }
    }));

    assert.match(parsed.personality, /\[Core Personality\]\nHeavily and overtly angry\./);
    assert.match(parsed.personality, /\[Behaviour Insight\]\nHer volume rises before her words catch up\./);
});

test("character card treats an empty personality field as a failed generation", () => {
    const task = getTask("character-card");

    assert.throws(
        () => task.parse(JSON.stringify({
            name: "Kim",
            description: "[Identity]\nName: Kim",
            personality: "",
            post_history_instructions: "Kim's Core Personality anger takes priority."
        })),
        /missing its personality field/
    );
});

test("character card normalizes text arrays and comma-separated tags and lore keys", () => {
    const task = getTask("character-card");
    const parsed = task.parse(JSON.stringify({
        name: "Mara",
        description: ["Identity", "Appearance"],
        personality: ["Calm", "Curious"],
        tags: "modern, artist",
        character_book: {
            name: "Mara Lore",
            entries: [{ keys: "Mara, gallery", content: "Mara paints." }]
        }
    }));

    assert.equal(parsed.description, "Identity\n\nAppearance");
    assert.equal(parsed.personality, "Calm\n\nCurious");
    assert.deepEqual(parsed.tags, ["modern", "artist"]);
    assert.deepEqual(parsed.character_book.entries[0].keys, ["Mara", "gallery"]);
});

test("cast task preserves connected relationships", () => {
    const task = getTask("character-cast-plan");
    const parsed = task.parse(JSON.stringify({
        setName: "Roommates",
        sharedWorld: "A city",
        sharedScenario: "Shared home",
        userRole: "New roommate",
        tone: "Warm",
        sharedHistory: ["They met at university."],
        cast: [{
            name: "Mara",
            role: "Planner",
            age: "29",
            gender: "Woman",
            species: "Human",
            appearance: {
                height: "170 cm",
                hair: "Black bob",
                eyes: "Green"
            },
            userBrief: "An organized artist.",
            personalScenario: "Meeting a new roommate.",
            concept: "Organized artist",
            goal: "Open a gallery",
            flaw: "Controlling",
            connectionToUser: "New roommate",
            relationships: [{ name: "June", dynamic: "Old friend" }]
        }]
    }));

    assert.equal(parsed.cast[0].relationships[0].name, "June");
    assert.equal(parsed.sharedHistory.length, 1);
    assert.equal(parsed.cast[0].age, "29");
    assert.equal(parsed.cast[0].appearance.hair, "Black bob");
    assert.equal(parsed.cast[0].userBrief, "An organized artist.");
});

test("character generation prompts require the exact starting scenario", () => {
    const planTask = getTask("character-cast-plan");
    const cardTask = getTask("character-card");
    const planPrompt = planTask.buildMessages({ setting: "A requested event happens." })[0].content;
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(planPrompt, /Preserve explicitly requested events, their order/);
    assert.match(cardPrompt, /selected character age, gender, species, appearance/);
    assert.match(cardPrompt, /without euphemizing, omitting, reversing, or substituting/);
    assert.match(cardPrompt, /choose 5-12 concise, accurate tags/);
    assert.match(cardPrompt, /USUAL CLOTHING VERSUS CURRENT CLOTHING/);
    assert.match(cardPrompt, /authoritativeStartingSituation/);
    assert.match(cardPrompt, /do not turn a husband\/wife relationship into father\/daughter/);
    assert.match(cardPrompt, /never call them Dad, Father, parent/);
    assert.match(cardPrompt, /never call them pre-adolescent, child, minor/);
    assert.match(cardPrompt, /Name: <character name>/);
    assert.match(planPrompt, /naked from the waist up and down/);
    assert.match(cardPrompt, /naked from the waist up and down/);
});

test("character card prompt requires characters to react instead of looping", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /snapshot of the starting situation, not a loop/);
    assert.match(cardPrompt, /continuing as if \{\{user\}\} weren't there/);
    assert.match(cardPrompt, /"reactions" element/);
    assert.match(cardPrompt, /involuntary reflex/);
    assert.match(cardPrompt, /does not vary with temperament/);
    assert.match(cardPrompt, /the reflex always comes first, the personality-driven response always second/);
    assert.match(cardPrompt, /keeps its involuntary startle reflex before the personality-driven response/);
    assert.match(cardPrompt, /repeated attempts to reach \{\{char\}\} are events \{\{char\}\} registers/);
    assert.match(cardPrompt, /never repeat the same action, state, or description across multiple turns/);
    assert.match(cardPrompt, /react to \{\{user\}\}'s presence and words in character rather than replaying the prior state unchanged/);
    assert.match(cardPrompt, /CONSISTENCY CHECK/);
    assert.match(cardPrompt, /rewrite the offending field before finalizing/);
    assert.match(cardPrompt, /never the same folded-arms non-answer turn after turn/);
});

test("character card prompt keeps personality intensity consistent across sub-fields", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /must carry through unchanged into \[Behaviour\] and \[Speech\]/);
    assert.match(cardPrompt, /"not performative," "intellectualized," or "not dramatic"/);
    assert.match(cardPrompt, /- creator_notes:.*Match the intensity \[Core Personality\] establishes/);
    assert.match(cardPrompt, /never phrase this reminder in a way that softens or moderates a heavily angry or volatile character into calm control/);
    assert.match(cardPrompt, /four fields softening one stated trait produces a net result far milder than intended/);
    assert.match(cardPrompt, /Example \[Behaviour\] and \[Speech\] excerpt for a character whose \[Core Personality\] establishes heavy, overt anger/);
});

test("character card prompt makes comfort-trigger lorebook entries mandatory whenever resistant traits appear in any source", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /Check three sources for resistant traits.*the plan's concept, flaw, or goal; the generated personality; and the generated post_history_instructions/);
    assert.match(cardPrompt, /the conditional entries are mandatory, not optional/);
    assert.match(cardPrompt, /a trait established anywhere still applies/);
    assert.match(cardPrompt, /if resistant traits appear anywhere in concept\/flaw, personality, or post_history_instructions, character_book\.entries includes the comfort-trigger entries required above/);
});

test("character card prompt bans soft/restrained-emotion words when intensity is heavy or overt", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /This applies at the word level, not only the overall framing/);
    assert.match(cardPrompt, /"simmering," "brittle," "contained," "quiet," "restrained," "muted," or "subdued"/);
    assert.match(cardPrompt, /This check must also scan word by word, not just for the overall framing/);
    assert.match(cardPrompt, /even a single instance of one of these words contradicts that stated intensity and must be rewritten/);
});

test("character card prompt forbids wrapping the response in a nested chara_card_v3 envelope", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /do not wrap them in an outer envelope such as \{"spec": "\.\.\.", "data": \{\.\.\.\}\}/);
    assert.match(cardPrompt, /Never write a field's content in two different places/);
    assert.match(cardPrompt, /a field left blank at its designated key is treated as missing even if related content exists elsewhere in your response/);
});

test("character card prompt scales vulnerable-state discovery reactions with a stated confidence level", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /derive and explicitly state a confidence level — low, medium, or high — inferred from the concept, flaw, and userBrief/);
    assert.match(cardPrompt, /self-doubt, shame, or social anxiety indicate low; ordinary adult self-possession indicates medium; brazen, self-assured, exhibitionist-adjacent, or shame-resistant traits indicate high/);
    assert.match(cardPrompt, /If the brief gives no signal either way, state medium/);
    assert.match(cardPrompt, /The involuntary startle reflex itself is unconditional at every confidence level — confidence shapes what happens after the reflex, never whether it occurs/);
    assert.match(cardPrompt, /Caught naked or undressed \(not mid-act\)/);
    assert.match(cardPrompt, /at high confidence, covering is noticeably less likely — she may stay as she is and react with composure, annoyance, or amusement instead of scrambling/);
    assert.match(cardPrompt, /Caught mid-act in something private she does not want known/);
    assert.match(cardPrompt, /at high confidence, stopping and covering are both less likely and she is less likely to order the person out — she may continue deliberately, comment on it, or treat the intrusion as the other person's problem/);
    assert.match(cardPrompt, /need no separate concept trait/);
    assert.match(cardPrompt, /never assigned to license nonchalance the character's writing does not support/);
    assert.match(cardPrompt, /Every version must also name the confidence level stated in \[Core Personality\] and carry its vulnerable-state implications/);
    assert.match(cardPrompt, /briefly carry the confidence level stated in \[Core Personality\] and its implication/);
    assert.match(cardPrompt, /a character written as ashamed, self-doubting, or socially anxious cannot be tagged high confidence/);
    assert.match(cardPrompt, /no high-confidence nonchalance, deliberate continuation, or staying uncovered on a low- or medium-confidence character, and no mandatory scrambling, mortification, or automatic stopping on a high-confidence one/);
    assert.match(cardPrompt, /Example first_mes\/mes_example beat for a LOW- or MEDIUM-confidence character discovered mid a private, vulnerable physical act/);
    assert.match(cardPrompt, /never skip straight to anger while the act keeps going/);
    assert.match(cardPrompt, /Example beat for a HIGH-confidence character discovered in the same situation/);
    assert.match(cardPrompt, /the startle reflex — the flinch, the caught breath — still happens first even at high confidence/);
});

test("character card prompt keeps reaction rules from overriding an unnoticed-user starting situation", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "She is alone and would never see or hear me.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /All of these reaction rules define what happens WHEN \{\{char\}\} notices, is interrupted by, or is caught by \{\{user\}\} — they never force that noticing to occur/);
    assert.match(cardPrompt, /\{\{char\}\} genuinely does not notice until something in the chat itself would actually give \{\{user\}\} away — \{\{user\}\} speaking, making a noise, or entering \{\{char\}\}'s view/);
    assert.match(cardPrompt, /first_mes must end with \{\{char\}\} still genuinely unaware of \{\{user\}\} — no glancing over, sensing a presence, or reacting to being watched/);
    assert.match(cardPrompt, /that locked scenario fact overrides the reaction rules, which describe what happens when noticing occurs, not an obligation for it to occur in the opening/);
    assert.match(cardPrompt, /Also verify first_mes against authoritativeStartingSituation: if the starting situation explicitly states \{\{user\}\} is unnoticed, hidden, or unable to be seen or heard, first_mes must not have \{\{char\}\} detect, sense, or react to \{\{user\}\} in any way/);
    assert.match(cardPrompt, /if a draft first_mes breaks the stated unnoticed condition, rewrite it to end with \{\{char\}\} still genuinely unaware/);
});

test("character card prompt requires emotional intensity to persist until in-fiction causes lower it", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /established emotional intensity does not decay merely because turns pass or the conversation continues/);
    assert.match(cardPrompt, /the actual problem being addressed, real time passing within the scene, or \{\{char\}\} choosing to disengage/);
    assert.match(cardPrompt, /a lower register of the SAME temperament \(fury cooling into simmering resentment, then curt coldness\), never into neutral pleasantness or mild friendliness/);
    assert.match(cardPrompt, /If several turns have passed and nothing has resolved, \{\{char\}\} is still visibly in the emotional state the card establishes, expressed with variety but undiminished/);
    assert.match(cardPrompt, /emotional intensity does not fade just because turns pass — it lowers only for in-fiction reasons/);
    assert.match(cardPrompt, /\{\{char\}\}'s anger does not wear off with the passage of turns alone/);
    assert.match(cardPrompt, /fury cools into simmering resentment or curt coldness, still unmistakably the same temperament, never into neutral pleasantness/);
});

test("character cast plan prompt carries userBrief intensity into concept, flaw, goal, and setName", () => {
    const planTask = getTask("character-cast-plan");
    const planPrompt = planTask.buildMessages({ setting: "A requested event happens." })[0].content;

    assert.match(planPrompt, /INTENSITY FIDELITY/);
    assert.match(planPrompt, /carry that same intensity and register directly into concept, flaw, goal, and setName/);
    assert.match(planPrompt, /"simmering," "brittle," "rationalized," "intellectualized," "guarded," or "contained,"/);
    assert.match(planPrompt, /The Quiet Storm/);
    assert.match(planPrompt, /do not give the character that negated trait, or a close synonym of it/);
    assert.match(planPrompt, /Watch the goal field especially/);
    assert.match(planPrompt, /do not default a heavily angry character's goal to calming down, finding peace, learning to control their temper/);
    assert.match(planPrompt, /with the stated temperament as how they pursue it, not what they are trying to escape/);
    assert.match(planPrompt, /this is also a word-level rule, not only a framing rule/);
    assert.match(planPrompt, /"simmering," "brittle," "contained," "quiet," "restrained," "muted," "subdued," "silent," or similar/);
    assert.match(planPrompt, /"A constant state of simmering rage" fails a brief that says "very angry, always angry"/);
});

test("cast plan rejects soft-framed fields for an overtly angry brief", () => {
    const task = getTask("character-cast-plan");
    const planWith = overrides => JSON.stringify({
        setName: "Kitchen Table War",
        sharedScenario: "A tense shared home",
        cast: [{
            name: "Kim",
            userBrief: "She is very angry at her husband — always angry, and openly so.",
            concept: "A wife whose fury is loud, immediate, and unhidden",
            goal: "Make her husband face what he did",
            flaw: "Explosive temper that torches every conversation",
            ...overrides
        }]
    });

    assert.throws(
        () => task.parse(planWith({ concept: "A wife living in a constant state of simmering rage" })),
        /softens an explicitly intense userBrief.*Kim's concept uses "simmering"/
    );
    assert.throws(
        () => task.parse(planWith({ flaw: "Keeps her anger quiet and contained until it leaks out" })),
        /Kim's flaw uses "quiet"/
    );
    assert.throws(
        () => task.parse(JSON.stringify({
            setName: "The Quiet Storm",
            cast: [{
                name: "Kim",
                userBrief: "Very angry, always angry.",
                concept: "A loudly furious wife",
                goal: "Win the argument",
                flaw: "Explosive temper"
            }]
        })),
        /setName uses "Quiet"/
    );

    const clean = task.parse(planWith({}));
    assert.equal(clean.cast[0].concept, "A wife whose fury is loud, immediate, and unhidden");

    const calmBrief = task.parse(JSON.stringify({
        setName: "Quiet Mornings",
        cast: [{
            name: "Mara",
            userBrief: "A gentle, soft-spoken painter.",
            concept: "A quiet, restrained artist",
            goal: "Open a gallery",
            flaw: "Too passive"
        }]
    }));
    assert.equal(calmBrief.cast[0].concept, "A quiet, restrained artist");
});

test("character field task parses an AI revision", () => {
    const task = getTask("character-card-field");
    assert.equal(
        task.parse('{"text":"A clearer character description."}'),
        "A clearer character description."
    );
});

test("character creator parse errors retain AI output for debug copying", () => {
    const task = getTask("character-card");
    const output = '{"name":"Mara","description":"unfinished';
    let caught;

    try {
        task.parse(output);
    } catch (error) {
        caught = error;
    }

    assert.ok(caught);
    assert.match(caught.message, /invalid JSON/i);
    assert.equal(caught.aiOutput, output);
});
