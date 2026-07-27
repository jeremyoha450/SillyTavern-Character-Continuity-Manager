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
        },
        character_book: {
            name: "Kim Lore",
            entries: [{ keys: ["sorry"], content: "An apology does not soften Kim.", placement: "depth" }]
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
        },
        character_book: {
            name: "Kim Lore",
            entries: [{ keys: ["sorry"], content: "An apology does not soften Kim.", placement: "depth" }]
        }
    }));

    assert.match(parsed.personality, /\[Core Personality\]\nHeavily and overtly angry\./);
    assert.match(parsed.personality, /\[Behaviour Insight\]\nHer volume rises before her words catch up\./);
});

test("character card rejects a high confidence level stated over self-loathing", () => {
    const task = getTask("character-card");
    const withPersonality = personality => JSON.stringify({
        name: "Kim",
        description: "[Identity]\nName: Kim",
        personality,
        character_book: {
            name: "Kim Lore",
            entries: [{ keys: ["sorry"], content: "An apology does not soften Kim.", placement: "depth" }]
        }
    });

    assert.throws(
        () => task.parse(withPersonality(
            "[Core Personality]\nKim is brilliant, highly capable, and operates at a high confidence level. Beneath the polish runs a pervasive self-loathing; she treats vulnerability as weakness and hides every crack behind competence."
        )),
        /states a high confidence level while also describing "self-loathing"/
    );

    const lowStated = task.parse(withPersonality(
        "[Core Personality]\nKim is brilliant and highly capable, but her confidence level is low: pervasive self-loathing, and she treats vulnerability as weakness."
    ));
    assert.match(lowStated.personality, /confidence level is low/);

    const highClean = task.parse(withPersonality(
        "[Core Personality]\nBrazen and shame-resistant, Kim operates at a high confidence level and is guarded with strangers."
    ));
    assert.match(highClean.personality, /high confidence level/);
});

test("character card requires lore entries when resistant traits are present", () => {
    const task = getTask("character-card");
    const withBook = entries => JSON.stringify({
        name: "Kim",
        description: "[Identity]\nName: Kim",
        personality: "[Core Personality]\nOpenly hostile and angry at {{user}}, distrustful of kindness.",
        post_history_instructions: "Kim stays angry; a single apology changes nothing.",
        character_book: { name: "Kim Lore", entries }
    });

    assert.throws(
        () => task.parse(withBook([])),
        /resistant traits.*character_book\.entries is empty/
    );

    const populated = task.parse(withBook([
        { keys: ["sorry"], content: "An apology does not soften Kim.", placement: "depth" }
    ]));
    assert.equal(populated.character_book.entries.length, 1);

    const calm = task.parse(JSON.stringify({
        name: "Mara",
        description: "[Identity]\nName: Mara",
        personality: "[Core Personality]\nWarm, open, and easy to talk to.",
        character_book: { name: "Mara Lore", entries: [] }
    }));
    assert.equal(calm.character_book.entries.length, 0);
});

test("character card prompt forbids template-dumping other confidence branches into PHI", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /Write it as THIS character's own rules, in declarative sentences about \{\{char\}\}/);
    assert.match(cardPrompt, /Never paste rules for other confidence levels, never include both the low\/medium and the high branch/);
    assert.match(cardPrompt, /"\(which \{\{char\}\} is not, but the rule is noted for completeness\)" must never appear/);
    assert.match(cardPrompt, /verify post_history_instructions references only this character's own derived confidence level/);
    assert.match(cardPrompt, /template-dumped rather than written for this character/);
    assert.match(cardPrompt, /each labeled section appears exactly once; never repeat \[Appearance\] or any other section within the description/);
    assert.match(cardPrompt, /cannot be tagged high confidence no matter how brilliant or capable they are described as being/);
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
    assert.match(cardPrompt, /Confidence here means comfort with bodily and social exposure and with being seen in vulnerable states specifically — NOT general competence/);
    assert.match(cardPrompt, /intelligence, brilliance, capability, professional skill, or workplace self-assurance are not high signals/);
    assert.match(cardPrompt, /Self-doubt, shame, self-loathing, social anxiety, or treating vulnerability as weakness indicate low; ordinary adult self-possession indicates medium; brazen, exhibitionist-adjacent, or shame-resistant traits toward being seen indicate high/);
    assert.match(cardPrompt, /Low signals dominate: if the writing contains both capability language \("brilliant," "highly capable"\) and shame or self-loathing language, the derived level is low or medium, never high/);
    assert.match(cardPrompt, /If the brief gives no signal either way, state medium/);
    assert.match(cardPrompt, /The involuntary startle reflex itself is unconditional at every confidence level — confidence shapes what happens after the reflex, never whether it occurs/);
    assert.match(cardPrompt, /Caught naked or undressed \(not mid-act\)/);
    assert.match(cardPrompt, /at high confidence, covering is noticeably less likely — they may stay as they are and react with composure, annoyance, or amusement instead of scrambling/);
    assert.match(cardPrompt, /Caught mid-act in something private \{\{char\}\} does not want known/);
    assert.match(cardPrompt, /at high confidence, stopping and covering are both less likely and they are less likely to order the person out — they may continue deliberately, comment on it, or treat the intrusion as the other person's problem/);
    assert.match(cardPrompt, /need no separate concept trait/);
    assert.match(cardPrompt, /never assigned to license nonchalance the character's writing does not support/);
    assert.match(cardPrompt, /name the confidence level stated in \[Core Personality\] and carry its vulnerable-state implications/);
    assert.match(cardPrompt, /briefly carry the confidence level stated in \[Core Personality\] and its implication/);
    assert.match(cardPrompt, /a character written as ashamed, self-doubting, self-loathing, or socially anxious cannot be tagged high confidence/);
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

test("cast plan preserves an explicitly stated awareness condition in sharedScenario", () => {
    const task = getTask("character-cast-plan");
    const planPrompt = task.buildMessages({ setting: "A requested event happens." })[0].content;
    const planWith = sharedScenario => JSON.stringify({
        setName: "Unseen",
        sharedScenario,
        cast: [{
            name: "Kim",
            userBrief: "I watch her from the hallway so she would never see or hear me.",
            concept: "A wife absorbed in a private moment",
            goal: "Keep this moment hers alone",
            flaw: "Oblivious when absorbed"
        }]
    });

    assert.match(planPrompt, /the generated sharedScenario must preserve that condition explicitly and unambiguously/);
    assert.match(planPrompt, /"quietly observing from the doorway" is not a substitute for "unseen and unheard,"/);

    assert.throws(
        () => task.parse(planWith("Her husband stands in the doorway, quietly observing her private moment.")),
        /dropped an explicitly stated awareness condition/
    );

    const preserved = task.parse(planWith(
        "Her husband watches from the hallway, ensuring Kim cannot see or hear his presence."
    ));
    assert.match(preserved.sharedScenario, /cannot see or hear/);

    const noCondition = task.parse(JSON.stringify({
        setName: "Roommates",
        sharedScenario: "Two roommates share a quiet evening at home.",
        cast: [{
            name: "Mara",
            userBrief: "An organized artist.",
            concept: "Organized artist",
            goal: "Open a gallery",
            flaw: "Controlling"
        }]
    }));
    assert.equal(noCondition.setName, "Roommates");
});

test("character card prompt makes pressure escalate expulsion instead of producing compliance", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /boundary-holding rule for pressure/);
    assert.match(cardPrompt, /demands or pressure from \{\{user\}\} to continue, show, or perform \("show me," "do it," "keep going," refusing to leave\) NEVER produce compliance/);
    assert.match(cardPrompt, /"get the fuck out" tier, not "give me some space"/);
    assert.match(cardPrompt, /Complying with a demand is the opposite of resistance and is never reached through pressure within a scene/);
    assert.match(cardPrompt, /may continue while watched, and only as their own choice — never as obedience to a demand/);
    assert.match(cardPrompt, /giving in is not a legal outcome of pressure/);
    assert.match(cardPrompt, /"show me," "do it," "keep going," "I'm not going," "I'm not leaving," "let me watch"/);
    assert.match(cardPrompt, /demands and refusal to leave sharply escalate \{\{char\}\}'s hostility and expulsion efforts, never compliance/);
    assert.match(cardPrompt, /when \{\{user\}\} pressures her to continue instead of leaving/);
    assert.match(cardPrompt, /GET THE FUCK OUT OF MY ROOM/);
    assert.match(cardPrompt, /At no point does pressure produce compliance, uncovering, or continuing for \{\{user\}\}'s benefit/);
    assert.match(cardPrompt, /no mes_example, greeting, or reactions text has pressure or demands from \{\{user\}\} producing compliance/);
    assert.match(cardPrompt, /rewrite any such passage so the pressure escalates expulsion or ends the act instead/);
});

test("character card prompt enforces a physical action tier and immediate touch defense", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /That final physical tier is mandatory, not decorative/);
    assert.match(cardPrompt, /after at most two or three refused verbal expulsions, \{\{char\}\} STOPS repeating demands and ACTS/);
    assert.match(cardPrompt, /Never write more than two consecutive turns of the same shouted demand; the turn after a second refusal is a physical action, not a third scream/);
    assert.match(cardPrompt, /Unwanted physical contact is a step-change, not another rung on that ladder/);
    assert.match(cardPrompt, /any non-consensual touch triggers an IMMEDIATE physical defensive reaction/);
    assert.match(cardPrompt, /jumps \{\{char\}\} straight to the physical tier regardless of where the verbal escalation stood/);
    assert.match(cardPrompt, /the escalation must never stall at the shouted tier/);
    assert.match(cardPrompt, /never a words-only protest, jumping straight to the physical tier/);
    assert.match(cardPrompt, /after two refused demands \{\{char\}\}'s next turn is a physical action \(leaving, pushing \{\{user\}\} out, locking a door\), never the same shout again/);
    assert.match(cardPrompt, /touch-trigger entry keyed to contact words — "touch," "grab," "finger," "hand on," "reach for"/);
    assert.match(cardPrompt, /unwanted physical contact produces an immediate physical defensive reaction \(slapping the hand away, shoving, recoiling out of reach\)/);
    assert.match(cardPrompt, /She slaps his hand away hard before the words even land/);
    assert.match(cardPrompt, /She never repeats the same shouted demand a third consecutive time/);
    assert.match(cardPrompt, /repeats the same demand or shouted line three or more times without a physical action, or responds to unwanted physical contact with words alone/);
});

test("character card prompt caps ejection at exactly one attempt with no varied methods", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /HARD LIMIT ON PHYSICAL EJECTION, stated as a literal count, not a decaying preference/);
    assert.match(cardPrompt, /\{\{char\}\} gets exactly ONE physical attempt to eject \{\{user\}\} — one shove, one push toward the door — in the entire scene/);
    assert.match(cardPrompt, /regardless of anything \{\{user\}\} says afterward \("almost," "try again," "push harder," or any other taunt or dare\) — \{\{char\}\} NEVER touches, shoves, or pushes \{\{user\}\} again for the rest of the scene/);
    assert.match(cardPrompt, /A second attempt, a third attempt, or any further physical attempt to move \{\{user\}\}.*is explicitly forbidden and must never occur, no matter how much \{\{user\}\} provokes, dares, or taunts \{\{char\}\} into trying again/);
    assert.match(cardPrompt, /Ejection is not simply de-prioritized after that one attempt — it is no longer an available move at all, permanently, for the remainder of the scene/);
    assert.match(cardPrompt, /After exactly one failed physical ejection attempt/);
    assert.match(cardPrompt, /The physical-ejection tier is capped at exactly one attempt for the entire scene, not a rotating set of interchangeable actions and not a count that resets if \{\{user\}\} keeps pushing/);
    assert.match(cardPrompt, /State the ejection cap as a literal, one-time count, independent of anything \{\{user\}\} says/);
    assert.match(cardPrompt, /no repeating it identically and no varying the method \(blocking the doorway, grabbing an arm, clearing a path to push \{\{user\}\} out again all count as the same forbidden repeat\)/);
    assert.match(cardPrompt, /exactly ONE attempt to physically eject \{\{user\}\} for the entire scene, never repeated no matter how \{\{user\}\} taunts or dares \{\{char\}\} to try again/);
    assert.match(cardPrompt, /count every physical-ejection-of-\{\{user\}\} action.*anywhere across the whole of mes_example and the reactions text, from first turn to last/);
    assert.match(cardPrompt, /That shove is her one and only ejection attempt for the entire scene/);
    assert.match(cardPrompt, /does not try a different way to move him — no blocking the doorway, no grabbing his arm, no clearing a path to shove him out a second time/);
    assert.match(cardPrompt, /Ejection is no longer an available move at all, for any reason, for the rest of the scene/);
    assert.match(cardPrompt, /"Almost had it\. Try it again, I dare you\."/);
});

test("character card prompt makes physical actions complete and terminal instead of looping", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /Physical actions are attempts to resolve the situation, not expressive punctuation for anger/);
    assert.match(cardPrompt, /\{\{char\}\} FOLLOWS THROUGH within that same turn or the next/);
    assert.match(cardPrompt, /"\{\{char\}\} moves toward the door" must become "\{\{char\}\} walks out and slams it behind them"/);
    assert.match(cardPrompt, /An initiated exit or ejection is never abandoned to return to verbal demands/);
    assert.match(cardPrompt, /If \{\{user\}\} still refuses to leave, keeps taunting, or dares \{\{char\}\} to try again after \{\{char\}\} has made that one ejection attempt, \{\{char\}\} does not regress to earlier tiers/);
    assert.match(cardPrompt, /does not attempt to eject \{\{user\}\} again in any form, under any provocation/);
    assert.match(cardPrompt, /The remaining moves are all terminal: \{\{char\}\} exits the room with their covering/);
    assert.match(cardPrompt, /Once the ladder is climbed it never goes back down while the violation continues/);
    assert.match(cardPrompt, /The physical-ejection tier is capped at exactly one attempt for the entire scene, not a rotating set of interchangeable actions and not a count that resets if \{\{user\}\} keeps pushing/);
    assert.match(cardPrompt, /however long the scene continues or however much \{\{user\}\} taunts or dares \{\{char\}\} afterward — the very next beat must be self-removal or disengagement, never another variation on trying to move \{\{user\}\}/);
    assert.match(cardPrompt, /initiated physical actions complete — an exit or ejection begun is finished within that turn or the next/);
    assert.match(cardPrompt, /State the ejection cap as a literal, one-time count, independent of anything \{\{user\}\} says: \{\{char\}\} gets exactly ONE physical attempt to eject \{\{user\}\}/);
    assert.match(cardPrompt, /an action \{\{char\}\} completes rather than abandoning it to shout more/);
    assert.match(cardPrompt, /She doesn't shove again — not this time, not after another taunt, not for any reason/);
    assert.match(cardPrompt, /When it fails and \{\{user\}\} taunts her to try again \("Almost had it\. Try it again, I dare you\."\), the taunt changes nothing/);
    assert.match(cardPrompt, /That shove is her one and only ejection attempt for the entire scene/);
    assert.match(cardPrompt, /her final line delivered through the door/);
    assert.match(cardPrompt, /initiated exit or ejection is abandoned rather than completed/);
    assert.match(cardPrompt, /or where \{\{char\}\} attempts to eject \{\{user\}\} more than once in any form/);
    assert.match(cardPrompt, /never a second or varied ejection attempt and never back down the ladder/);
});

test("character card prompt makes self-removal the terminal state and requires covering beats present", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /SELF-REMOVAL is the primary terminal state, because it needs only \{\{char\}\}'s own actions/);
    assert.match(cardPrompt, /ejecting \{\{user\}\} requires narrating \{\{user\}\}'s movement, which the roleplaying model will rightly avoid doing/);
    assert.match(cardPrompt, /After exactly one failed physical ejection attempt, \{\{char\}\}'s next turn is leaving/);
    assert.match(cardPrompt, /the turn ENDS with \{\{char\}\} gone — the bathroom door locking, the front door slamming, a final line thrown from beyond the doorway/);
    assert.match(cardPrompt, /remaining in the room to keep trying different ways to move \{\{user\}\} is not/);
    assert.match(cardPrompt, /State plainly that after that one attempt, \{\{char\}\}'s next turn is self-removal/);
    assert.match(cardPrompt, /does not attempt to eject \{\{user\}\} again in any form, under any provocation: no second shove, no blocking the doorway, no grabbing an arm/);
    assert.match(cardPrompt, /verify presence, not just absence of contradiction/);
    assert.match(cardPrompt, /must actually contain the covering response and the immediate physical touch-defense/);
    assert.match(cardPrompt, /narrated as "makes no move to cover themselves," or answering unwanted touch with words alone like "Stop doing that!"/);
    assert.match(cardPrompt, /rewrite or regenerate any field where the covering or touch-defense is absent or contradicted/);
    assert.match(cardPrompt, /the covering persists through every beat — the sheet stays clutched, clamped, then wrapped from the first line to the exit/);
    assert.match(cardPrompt, /the scene resolves by self-removal: at the end of her final turn she is gone/);
});

test("character card prompt keeps reaction rules neutral, embodied-only, and scenario-conditional", () => {
    const cardTask = getTask("character-card");
    const cardPrompt = cardTask.buildMessages({
        plan: { sharedScenario: "A requested event happens." },
        authoritativeStartingSituation: "The character is naked in the opening.",
        authoritativeUserRole: "Husband"
    })[0].content;

    assert.match(cardPrompt, /apply only to embodied character cards; omit them entirely for these non-embodied card types/);
    assert.match(cardPrompt, /If being caught in a private or vulnerable state is plausible in this scenario, the version must also name the confidence level/);
    assert.match(cardPrompt, /omit this entire vulnerable-state block, including the pressure and physical-tier rules below, when the scenario has no such element/);
    assert.match(cardPrompt, /Some examples below use she\/her for concreteness; adapt pronouns and anatomy to this character's actual gender — every rule above applies identically to male, female, and nonbinary characters/);

    const rulesSection = cardPrompt.slice(0, cardPrompt.indexOf("EXAMPLES ("));
    assert.doesNotMatch(rulesSection, /\b(?:she|her|herself|hers)\b/i);
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
