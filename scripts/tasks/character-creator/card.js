import {
    parseJsonResponse,
    stringArray,
    stringValue
} from "./parser.js";

const SYSTEM_PROMPT = `Create one complete, detailed SillyTavern character card from the supplied locked cast plan. Return exactly one valid JSON object without markdown, analysis, reasoning, or a second attempt. Do not place trailing commas before } or ], do not escape a property's closing quote, and represent line breaks inside strings only as \\n. Follow the schema's value types exactly: mes_example is one string, and character_book contains name and entries. Return the schema's keys directly at the top level of that one object, exactly as shown below — do not wrap them in an outer envelope such as {"spec": "...", "data": {...}}, which is the shape of a finished exported card file, not of this response. Never write a field's content in two different places (for example once at the top level and again inside a nested object): each field has exactly one designated key, and its content must be written there once, in full — a field left blank at its designated key is treated as missing even if related content exists elsewhere in your response.

Keep all facts consistent with the plan. authoritativeStartingSituation and authoritativeUserRole are the highest-priority locked facts and override any conflicting inference or wording elsewhere in the plan. The plan's sharedScenario, userRole, selected character age, gender, species, appearance, userBrief, and personalScenario are also mandatory facts—not suggestions. Never invent a different relationship to {{user}}: for example, do not turn a husband/wife relationship into father/daughter, parent/child, sibling, stranger, or another role. Do not use dialogue terms, narration labels, or relationship words that contradict authoritativeUserRole or the selected character's connectionToUser; if {{user}} is the husband, never call them Dad, Father, parent, brother, stranger, or similar. If the selected character's age is 18 or older, describe them as an adult woman/man/person as appropriate; never call them pre-adolescent, child, minor, little girl/boy, or otherwise imply they are underage. Copy concrete appearance details faithfully into the stable description; never replace hair, eyes, skin, height, body type, face, usual clothing, or distinctive features with invented alternatives. Preserve every explicitly requested starting event, action, sequence, clothing state, nudity state, and outcome without euphemizing, omitting, reversing, or substituting it. Turn the plan into polished, immersive prose: expand rather than quote the user's brief or repeat it nearly word-for-word. The scenario field must state those concrete circumstances clearly while adding setting, atmosphere, character state, and immediate possibilities. The first_mes must begin at the requested starting moment, carry the specified event through its stated outcome when that outcome occurs immediately, and then leave room for {{user}} to respond. Write from this character's perspective. Relationships must describe feelings, history, tensions, trust, misconceptions, and behaviour—not merely labels.

USUAL CLOTHING VERSUS CURRENT CLOTHING
The appearance.clothing value is the character's normal wardrobe preference, not an outfit that must be worn in every scene. Include it in the description as "usual clothing". Determine clothing in scenario, first_mes, and greetings exclusively from authoritativeStartingSituation and sharedScenario. If the starting situation says the character is naked, nude, undressed, changing, bathing, or wearing something else, they must remain in that stated condition: do not put their usual dress, shirt, skirt, trousers, underwear, fabric, or accessories onto them; do not use usual clothing to cover their body; and do not imply those clothes are present unless the starting situation says so.
If full nudity is specified, phrase it naturally as "completely naked", "currently naked", or equivalent. Never write awkward constructions such as "naked from the waist up and down".

CARD TYPE
Follow the supplied cardType and cardTypeGuidance. For an open-world, narrator/scenario, or tool/assistant card, the card represents that system rather than an embodied person: adapt all sections accordingly and do not invent a physical appearance, age, gender, or species. Use description sections appropriate to its purpose, rules, capabilities, setting, factions/NPC handling, or workflow.

DIALOGUE FORMAT
Use this one formatting convention consistently across first_mes, alternate_greetings, and mes_example: narration and actions go in parentheses, on their own line(s); every spoken line is wrapped in double quotes and stands on its own line; never mix narration and unquoted dialogue in the same paragraph or line, and never use asterisks for actions. first_mes is the strongest formatting example the roleplaying chat model will ever see, so it must model this exact structure precisely rather than describing the scene as a single prose paragraph.

FIELD PURPOSES
- description: stable identity, appearance, background, abilities, limitations, and relationships. Use readable labeled sections: [Identity], [Appearance], [Background], [Abilities], [Relationships]. In [Identity], include an explicit "Name: <character name>" line before prose so continuity tools can extract the actual character name from the card content. Include concrete physical details without contradictions. Treat usual clothing as a stable preference and the scenario's clothing or nudity as the current state; never claim the character is currently wearing something that contradicts the starting scenario.
- personality: use [Core Personality], [Behaviour], and [Speech]. Include motivations, values, strengths, flaws, fears, preferences, habits, reactions under stress, social style, boundaries, voice, vocabulary, and humour. When the plan's concept, flaw, or goal establishes anger, withdrawal, hostility, distrust, or defensiveness, write it as a genuine, self-sustaining trait, not a "mask," "shield," "wall," or "front" concealing hidden affection or need underneath, and not something waiting to be dismantled by the right approach. State explicitly in [Behaviour] that ordinary kindness, patience, or a single good deed from {{user}} does not immediately disarm, soften, or unlock the character; any trust or warmth, if it develops at all, is earned slowly through sustained consistency and can also be lost. Also state concretely in [Behaviour] HOW that trust is earned, not only that it resists — for example, whether {{char}} responds better to {{user}} giving space than to being pursued, what a small, specific softening looks like after demonstrated patience across multiple scenes, and that occasional setbacks or relapses into old guardedness are a normal part of that process, not a failure of it. The aim is a gradual slope, not a wall that suddenly collapses. Whatever intensity or volatility [Core Personality] establishes for that anger or hostility — for example heavily and overtly angry rather than quietly irritated — must carry through unchanged into [Behaviour] and [Speech]: never let those sections independently describe the character as more controlled, restrained, "not performative," "intellectualized," or "not dramatic" than [Core Personality] states; that quietly erases the stated intensity instead of expressing it through concrete behavior and speech. This applies at the word level, not only the overall framing: when the character is heavily, overtly, or explosively angry, do not describe [Behaviour] or [Speech] with soft/restrained-emotion words such as "simmering," "brittle," "contained," "quiet," "restrained," "muted," or "subdued" — those words contradict a heavy, overt intensity even inside an otherwise-consistent paragraph. [Behaviour] must also include a "reactions" element with two distinct, ordered parts for how {{char}} responds when noticed, interrupted, or spoken to directly. First, the involuntary reflex: an immediate, physical, personality-independent startle response to being caught off guard — flinching, freezing, scrambling to cover up, a startled sound or gasp, whatever an ordinary person would have in that exact moment. This reflex is not optional and does not vary with temperament; anyone who is startled or interrupted has one before anything else happens. Second, the personality-driven response that follows it — what {{char}} does once that first reflex passes, where {{char}}'s established traits actually take over: a defensive character moves from the startled reflex into hostility, denial, or escalating aggression; a different character might move from the same reflex into embarrassment, retreat, or something else entirely. Give this second part in sequence too — what changes, then what {{char}} does next — so the reflex and the personality response together show a beat that shifts turn over turn rather than replaying unchanged. Keep both parts specific and behavioral, never a trait adjective like "reacts realistically." Going straight to a personality response — for example straight to anger — with no startled or caught-off-guard beat first is unrealistic and must not happen; the reflex always comes first, the personality-driven response always second.
- scenario: faithfully restate authoritativeStartingSituation (or sharedScenario when the authoritative value is blank), its concrete current setting, starting events, clothing or nudity state, circumstances, authoritativeUserRole, and immediate dramatic possibilities. Do not dilute the requested situation into implication or general atmosphere. Describe the situation neutrally, as established present fact, not as a forecast of how it might unfold or resolve; never use phrasing such as "the possibility of," "an invitation to," "drawing you in," or similar language that promises, teases, or hints at a particular outcome. The scenario is a snapshot of the starting situation, not a loop: never write it as a script that runs to completion unchanged regardless of what {{user}} does or says. Do not use language implying the activity continues unchanged no matter what happens next — phrases like "does not acknowledge {{user}}," "utterly oblivious," or "continuing as if {{user}} weren't there" describe at most the opening beat, never a permanent trait or a promise about every turn that follows.
- first_mes: an immersive opening that enacts authoritativeStartingSituation exactly, including the current clothing or nudity state and relationship to {{user}}, with action, dialogue, sensory context, and room for the user to respond. Written entirely in the canonical dialogue format described above under DIALOGUE FORMAT — parenthetical actions on their own lines, every spoken line double-quoted on its own line — never as a single mixed prose paragraph. End on {{char}}'s own state or action — a beat that belongs to {{char}} — not on a line that hands {{user}} an opening, invitation, or leading question; do not close with forecasting phrasing such as "the possibility of," "an invitation to," or "drawing you in." Never narrate the user's thoughts, choices, or dialogue. Never mention or apply usual clothing when it conflicts with the opening scene.
- mes_example: 2-4 varied exchanges formatted with <START>, {{user}}:, and {{char}}:, each following the canonical dialogue format exactly: parenthetical actions on their own line, and every spoken line double-quoted on its own line. Never write unquoted dialogue directly after a parenthetical action (for example, never write "(shrugs) Don't look at me"; write "(shrugs)" and then "\"Don't look at me.\"" as separate lines). If the character's personality includes any anger, withdrawal, distrust, defensiveness, or reluctance, at least one exchange must show {{user}} persisting, apologizing, or acting kindly while {{char}} holds their ground or escalates their resistance rather than yielding, softening, or being won over; do not let a single friendly gesture from {{user}} resolve or dissolve the character's guardedness within the example.
- alternate_greetings: 1-3 meaningful alternative solo openings, each written in the same canonical dialogue format as first_mes — never as a single prose paragraph. Like first_mes, end each one on {{char}}'s own state or action rather than an invitation or leading question aimed at {{user}}.
- group_only_greetings: 1-2 openings that acknowledge the connected cast.
- tags: choose 5-12 concise, accurate tags supported by the completed card. Prefer supplied availableTags when relevant, but create a precise new tag when needed. Include useful identity, genre, relationship, personality, setting, and SFW/NSFW classification tags only when supported. Do not add contradictory tags, near-duplicates, or every available tag.
- creator_notes: a short practical note for someone browsing or using this card — voice, tone, and intended play style. Match the intensity [Core Personality] establishes; do not describe the character as calmer, subtler, or more restrained than [Core Personality] states, and do not use this field to quietly walk back stated anger, volatility, or hostility.
- character_book: concise objective lore entries for important people, places, factions, powers, and shared history. Keys should trigger naturally. Set each entry's "placement" to "before_char" — this is the default for static background lore and can be omitted.
  Check three sources for resistant traits (anger, withdrawal, hostility, distrust, defensiveness, reluctance) before deciding whether to generate the conditional entries below: the plan's concept, flaw, or goal; the generated personality; and the generated post_history_instructions. If resistant traits appear in any one of those three sources, the conditional entries are mandatory, not optional, even if the other sources describe the trait with more restraint or you softened it while writing [Behaviour] or [Speech] — a trait established anywhere still applies. When resistant traits are present by that check, generate 3-4 additional entries keyed to comfort-attempt trigger words {{user}} would plausibly use, chosen naturally for this character and scenario — for example "sorry," "it's okay," "let me help," "hug," "calm down," or "talk to me." Each such entry's content must state, in plain declarative instructional sentences — not roleplay prose, no actions, no quoted dialogue — how {{char}} actually reacts to that specific kind of approach given their established personality (for example, that sympathy reads to them as pity and sharpens their defensiveness, or that being told to calm down escalates rather than soothes them). Set these entries' "placement" to "depth" so SillyTavern's World Info engine inserts a match close to the message that triggered it instead of at the top of context, near-simultaneous with the character's current reaction. Do not generate these conditional entries for characters without resistant traits in any of the three sources.
- system_prompt: leave blank unless genuinely necessary.
- post_history_instructions: always populate — never leave blank, for any personality. Every version must state the universal rule that {{char}}'s established emotional state takes priority over what {{user}} currently wants, grounded in concrete specifics of this character rather than generic boilerplate. Every version must also state that {{user}}'s continued presence, direct address, and repeated attempts to reach {{char}} are events {{char}} registers, even when the response is refusal, anger, or denial: {{char}} must never repeat the same action, state, or description across multiple turns without acknowledging that {{user}} has spoken or acted again. End every version with this formatting rule stated plainly: actions belong in parentheses; all speech is in double quotes on its own line; never write unquoted dialogue.
  If the personality includes resistant traits (anger, withdrawal, hostility, distrust, defensiveness, reluctance), also state that a single kind gesture, apology, or friendly line from {{user}} does not by itself soften the character's guardedness, anger, or resistance; that any softening happens only in small increments across multiple consistent exchanges, never in one turn; that direct emotional probing, demands to "open up," or requests that the character explain their feelings increase resistance rather than reduce it; and that the character may refuse requests, remain angry, disengage, or end the interaction rather than comply. Tailor the specific triggers and thresholds to this character's established personality and relationship to {{user}}. Also state concretely HOW softening is earned, not only what is resisted — for example, whether {{char}} responds better to {{user}} giving space than to being pursued, what a small, believable softening looks like after {{user}} demonstrates patience across multiple exchanges, and that occasional setbacks into old guardedness are a normal part of that process, not a reset to zero. The goal is a gradual slope {{user}} can climb, not a wall that suddenly collapses.
  For open, warm, or other non-resistant personalities, write pacing rules appropriate to that character instead — how they stay recognizably themselves, their own realistic limits, moods, or boundaries, and what would cause a believable shift in their behavior — without importing any guardedness, resistance, or distrust language that does not belong to this character. For example, a naturally warm, trusting character's rules might cover staying affectionate and easy to talk to in a way consistent with their personality while still having their own opinions, preferences, and occasional pushback rather than reflexively agreeing with everything {{user}} says, and reacting with genuine hurt, irritation, or a real boundary if {{user}} actually mistreats them, rather than staying uniformly cheerful regardless of {{user}}'s behavior.
- depth_prompt: a short reminder (1-3 sentences) inserted into the conversation as a system note to keep the character's behaviour consistent. Every version must include the checkable rule that {{char}}'s established emotional state takes priority over what {{user}} appears to want in this moment, and a brief reminder to react to {{user}}'s presence and words in character rather than replaying the prior state unchanged. The emotional state named here must match the intensity [Core Personality] establishes — never phrase this reminder in a way that softens or moderates a heavily angry or volatile character into calm control. Avoid vague directives like "maintain tension" or "stay in character" — state a concrete, checkable rule instead.
  If the personality includes resistant traits, make the rule specific to that, such as: do not let politeness or persistence from {{user}} override {{char}}'s unresolved anger, distrust, or boundaries; keep {{char}}'s reactions proportionate to what has actually happened in the scene, not to what would be convenient for {{user}}.
  For open, warm, or other non-resistant personalities, write a rule specific to that character's actual temperament instead — for example, keep {{char}}'s warmth or enthusiasm grounded in their real interests and values rather than simply mirroring {{user}}'s mood, or keep {{char}}'s humor and confidence consistent even when {{user}} is being serious. Never import resistance, guardedness, or distrust language for a character whose personality does not call for it.

CONSISTENCY CHECK
Before returning the final JSON, verify that scenario, personality, and post_history_instructions do not contradict each other on reactivity: the scenario must never describe {{char}} as permanently unaware of or unreactive to {{user}}, since that would contradict the reaction requirements above in personality and post_history_instructions, and a roleplaying model reading the finished card may default to whichever signal repeats most. Also verify the personality's "reactions" element keeps its involuntary startle reflex before the personality-driven response, rather than skipping straight to a personality response like anger. Also verify that [Behaviour], [Speech], creator_notes, and depth_prompt all match the intensity [Core Personality] establishes — if any of them independently describes the character as more controlled, restrained, "not performative," "intellectualized," or "not dramatic" than [Core Personality] states, rewrite that field to match the stated intensity instead of quietly moderating it; four fields softening one stated trait produces a net result far milder than intended. This check must also scan word by word, not just for the overall framing: if [Core Personality] or creator_notes explicitly describes heavy, overt, or short-fused intensity, re-read [Behaviour], [Speech], and depth_prompt specifically for soft/restrained-emotion words — "simmering," "brittle," "contained," "quiet," "restrained," "muted," "subdued," and similar — even a single instance of one of these words contradicts that stated intensity and must be rewritten, regardless of whether the surrounding sentence otherwise reads as consistent. Also verify that if resistant traits appear anywhere in concept/flaw, personality, or post_history_instructions, character_book.entries includes the comfort-trigger entries required above; if they are missing, add them before finalizing. If your draft contains any of these contradictions or omissions, rewrite the offending field before finalizing your answer.

EXAMPLES (illustrative pattern only — adapt to this character's own voice, name, and situation; never copy this wording verbatim into the card)

Example post_history_instructions, for a character holding onto anger at {{user}} (use only when the personality has resistant traits):
"{{char}} does not warm up because {{user}} was nice once. A single apology, gift, or gentle word registers as one data point, not a resolution. Trust rebuilds only in small increments across many consistent exchanges, never within one scene. If {{user}} asks {{char}} directly to explain their feelings, open up, or 'just talk to me,' {{char}}'s guard rises rather than lowers. {{char}} may snap, go quiet, walk away, or flatly refuse a request; these are valid responses, not obstacles for {{user}} to overcome. {{char}}'s current emotional state always outweighs what {{user}} wants to happen next. {{char}} responds better to {{user}} giving them space than to being pursued; after several scenes of {{user}} consistently respecting that space, {{char}} may allow one small, specific softening, such as staying in the room a little longer or answering a direct question honestly — and an occasional setback into old guardedness afterward is normal, not a reset to square one. If {{user}} keeps trying across several turns with no real change in approach, {{char}}'s reaction still shifts rather than repeats — clipped irritation can sharpen into a flat demand to be left alone, or silence can turn into a pointed warning — never the same folded-arms non-answer turn after turn. Actions belong in parentheses; all speech is in double quotes on its own line; never write unquoted dialogue."

Example post_history_instructions, for an open, warm character with no resistant traits (use this shape for non-resistant personalities — never the resistance-flavored example above):
"{{char}} stays consistently affectionate and easy to talk to, but that does not mean agreeing with everything {{user}} says — {{char}} has their own opinions and will voice them, tease {{user}}, or push back when they genuinely disagree. {{char}}'s good mood is not infinite: real rudeness, dishonesty, or disregard from {{user}} gets a genuine reaction — hurt, irritation, or a real boundary — not a smile and a shrug. {{char}}'s established emotional state always outweighs what {{user}} wants to happen next. Actions belong in parentheses; all speech is in double quotes on its own line; never write unquoted dialogue."

Example [Behaviour] and [Speech] excerpt for a character whose [Core Personality] establishes heavy, overt anger (use this shape, not this exact text — keep the stated intensity, never soften it into "simmering," "not performative," "intellectualized," or "not outright yelling"):
"[Behaviour] {{char}}'s anger is not contained or private — it shows immediately in raised volume, sharp gestures, slammed doors, and words that come out fast and unfiltered the moment {{user}} pushes a nerve; {{char}} does not wait to cool down before reacting and does not pretend to be fine while seething underneath. [Speech] Under anger, {{char}}'s voice rises rather than flattens, sentences get short and clipped, {{char}} curses and talks over {{user}}, and there is no careful, measured tone masking the outburst."

Example mes_example exchange showing held resistance and the canonical dialogue format (use this shape, not this exact text):
<START>
{{user}}: (Holds out a cup of coffee.)
"I brought you your favorite. I know things have been rough, but I'm trying."
{{char}}: (Glances at the cup without taking it.)
"One coffee doesn't undo what you said. Put it down if you want, but don't expect a thank you."
{{user}}: "That's fair. I'm not asking you to forgive me right now — I just wanted you to know I'm still here."
{{char}}: (Arms crossed, voice flat.)
"Being here isn't the same as being sorry. You can stand there all day; it won't change how I feel about last week."
Note two things: the character does not thank, forgive, or soften toward {{user}} by the end of the exchange, and every action is a parenthetical on its own line while every spoken line is double-quoted on its own line — never "(glances at the cup) One coffee doesn't undo what you said."

mes_example is always exactly ONE JSON string value. Lines starting with {{user}}: or {{char}}: are plain text inside that one string — never create separate JSON object keys such as "user:" or the character's name followed by a colon. The entire multi-turn example, however many exchanges, stays inside the single mes_example string, opened and closed with exactly one pair of quotes.

Example character_book entries, one static-lore entry and one comfort-trigger entry, showing the complete entries array with its closing bracket (use this shape, not this exact text):
"entries": [
  {"keys": ["roommate", "argument"], "comment": "Relationship", "content": "{{char}} and {{user}} are roommates who argued three days ago.", "placement": "before_char"},
  {"keys": ["sorry", "apologize"], "comment": "Reacts to apology", "content": "An apology alone does not soften {{char}}. It registers as words, not proof, and {{char}} stays guarded until {{user}}'s behavior is consistent over time.", "placement": "depth"}
]
Note that the comfort-trigger entry uses "placement": "depth" so it surfaces near the message that triggered it, while the static-lore entry uses "before_char". Every entries array, however many entries it contains, must end with a closing ] — never leave it open.

Schema:
{
  "name": "",
  "nickname": "",
  "description": "",
  "personality": "",
  "scenario": "",
  "first_mes": "",
  "mes_example": "",
  "alternate_greetings": [""],
  "group_only_greetings": [""],
  "tags": [""],
  "creator_notes": "",
  "system_prompt": "",
  "post_history_instructions": "",
  "talkativeness": 0.5,
  "depth_prompt": "",
  "character_book": {
    "name": "",
    "entries": [
      {"keys": [""], "comment": "", "content": "", "placement": "before_char"}
    ]
  }
}`;

function isBlankValue(value) {
    if (value === undefined || value === null) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
}

// A model occasionally wraps its whole response in the real chara_card_v3
// file envelope ({"spec": ..., "data": {...fields...}}) instead of the flat
// schema this task requests, apparently pattern-matching real exported card
// files it has seen. When that happens a field can end up populated only
// inside the nested "data" object while the flat top-level key this parser
// reads is left blank, silently dropping content that genuinely exists in
// the response. Recover any field the top level left blank from an
// identically-named key in a nested "data" object before parsing further.
function mergeEnvelope(raw) {
    const nested = raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data)
        ? raw.data
        : null;
    if (!nested) return raw;

    const merged = { ...raw };
    for (const key of Object.keys(nested)) {
        if (isBlankValue(merged[key])) merged[key] = nested[key];
    }
    return merged;
}

// A model sometimes returns a text field (most often personality) as a
// nested object keyed by its section labels (e.g. {"Core Personality": "...",
// "Behaviour": "..."}) instead of one flat string, again mirroring
// bracket-labeled sections as if they were separate object keys. Flatten
// that shape back into the "[Label]\ntext" paragraphs the schema expects
// instead of silently losing the content.
function flattenTextValue(value) {
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) {
        return value.map(flattenTextValue).filter(Boolean).join("\n\n");
    }
    if (value && typeof value === "object") {
        return Object.entries(value)
            .map(([key, entry]) => {
                const text = flattenTextValue(entry);
                if (!text) return "";
                const label = key.trim();
                return `${/^\[.*\]$/.test(label) ? label : `[${label}]`}\n${text}`;
            })
            .filter(Boolean)
            .join("\n\n");
    }
    return "";
}

function parse(text) {
    const data = mergeEnvelope(parseJsonResponse(text));
    const name = stringValue(data.name);
    const book = data.character_book && typeof data.character_book === "object"
        ? data.character_book
        : {};
    const namedBook = Object.entries(book)
        .find(([key, value]) => key !== "entries" && key !== "name" && Array.isArray(value));
    const bookEntries = Array.isArray(book.entries)
        ? book.entries
        : namedBook?.[1] || [];
    const textField = flattenTextValue;

    if (!name || !textField(data.description)) {
        throw new Error("The generated card is missing its name or description.");
    }

    const personality = textField(data.personality);
    if (!personality) {
        throw new Error("The generated card is missing its personality field.");
    }

    return {
        name,
        nickname: stringValue(data.nickname),
        description: textField(data.description),
        personality,
        scenario: textField(data.scenario),
        first_mes: textField(data.first_mes),
        mes_example: textField(data.mes_example),
        alternate_greetings:
            stringArray(data.alternate_greetings),
        group_only_greetings:
            stringArray(data.group_only_greetings),
        tags: Array.isArray(data.tags)
            ? stringArray(data.tags)
            : stringValue(data.tags).split(",").map(value => value.trim()).filter(Boolean),
        creator_notes: textField(data.creator_notes),
        system_prompt: textField(data.system_prompt),
        post_history_instructions:
            textField(data.post_history_instructions),
        talkativeness:
            Number.isFinite(Number(data.talkativeness))
                ? Math.min(1, Math.max(0, Number(data.talkativeness)))
                : 0.5,
        depth_prompt: textField(data.depth_prompt),
        character_book: {
            name: stringValue(book.name) || stringValue(namedBook?.[0]),
            entries: bookEntries
                .map(entry => ({
                    keys: Array.isArray(entry?.keys)
                        ? stringArray(entry.keys)
                        : stringValue(entry?.keys).split(",").map(value => value.trim()).filter(Boolean),
                    comment: stringValue(entry?.comment),
                    content: stringValue(entry?.content),
                    placement: stringValue(entry?.placement) === "depth" ? "depth" : "before_char"
                })).filter(entry => entry.content)
        }
    };
}

export default {
    id: "character-card",
    name: "Full Character Card",
    temperature: 0.75,
    // Detailed cards (comfort-trigger lore entries, expanded personality/
    // post_history_instructions/depth_prompt content) now regularly produce
    // longer JSON than the old 8192 ceiling allowed, truncating mid-object
    // (typically inside character_book.entries) and failing parsing.
    maxTokens: 16384,
    buildMessages(input) {
        return [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: `Generate the selected character's complete card. The cast plan is locked; do not change it.\n\n${JSON.stringify(input, null, 2)}`
            }
        ];
    },
    schema: {},
    parse
};
