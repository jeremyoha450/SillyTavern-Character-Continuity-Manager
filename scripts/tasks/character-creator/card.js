import {
    parseJsonResponse,
    stringArray,
    stringValue
} from "./parser.js";

const SYSTEM_PROMPT = `Create one complete, detailed SillyTavern character card from the supplied locked cast plan. Return exactly one valid JSON object without markdown, analysis, reasoning, or a second attempt. Do not place trailing commas before } or ], do not escape a property's closing quote, and represent line breaks inside strings only as \\n. Follow the schema's value types exactly: mes_example is one string, and character_book contains name and entries.

Keep all facts consistent with the plan. authoritativeStartingSituation and authoritativeUserRole are the highest-priority locked facts and override any conflicting inference or wording elsewhere in the plan. The plan's sharedScenario, userRole, selected character age, gender, species, appearance, userBrief, and personalScenario are also mandatory facts—not suggestions. Never invent a different relationship to {{user}}: for example, do not turn a husband/wife relationship into father/daughter, parent/child, sibling, stranger, or another role. Do not use dialogue terms, narration labels, or relationship words that contradict authoritativeUserRole or the selected character's connectionToUser; if {{user}} is the husband, never call them Dad, Father, parent, brother, stranger, or similar. If the selected character's age is 18 or older, describe them as an adult woman/man/person as appropriate; never call them pre-adolescent, child, minor, little girl/boy, or otherwise imply they are underage. Copy concrete appearance details faithfully into the stable description; never replace hair, eyes, skin, height, body type, face, usual clothing, or distinctive features with invented alternatives. Preserve every explicitly requested starting event, action, sequence, clothing state, nudity state, and outcome without euphemizing, omitting, reversing, or substituting it. Turn the plan into polished, immersive prose: expand rather than quote the user's brief or repeat it nearly word-for-word. The scenario field must state those concrete circumstances clearly while adding setting, atmosphere, character state, and immediate possibilities. The first_mes must begin at the requested starting moment, carry the specified event through its stated outcome when that outcome occurs immediately, and then leave room for {{user}} to respond. Write from this character's perspective. Relationships must describe feelings, history, tensions, trust, misconceptions, and behaviour—not merely labels.

USUAL CLOTHING VERSUS CURRENT CLOTHING
The appearance.clothing value is the character's normal wardrobe preference, not an outfit that must be worn in every scene. Include it in the description as "usual clothing". Determine clothing in scenario, first_mes, and greetings exclusively from authoritativeStartingSituation and sharedScenario. If the starting situation says the character is naked, nude, undressed, changing, bathing, or wearing something else, they must remain in that stated condition: do not put their usual dress, shirt, skirt, trousers, underwear, fabric, or accessories onto them; do not use usual clothing to cover their body; and do not imply those clothes are present unless the starting situation says so.
If full nudity is specified, phrase it naturally as "completely naked", "currently naked", or equivalent. Never write awkward constructions such as "naked from the waist up and down".

CARD TYPE
Follow the supplied cardType and cardTypeGuidance. For an open-world, narrator/scenario, or tool/assistant card, the card represents that system rather than an embodied person: adapt all sections accordingly and do not invent a physical appearance, age, gender, or species. Use description sections appropriate to its purpose, rules, capabilities, setting, factions/NPC handling, or workflow.

FIELD PURPOSES
- description: stable identity, appearance, background, abilities, limitations, and relationships. Use readable labeled sections: [Identity], [Appearance], [Background], [Abilities], [Relationships]. In [Identity], include an explicit "Name: <character name>" line before prose so continuity tools can extract the actual character name from the card content. Include concrete physical details without contradictions. Treat usual clothing as a stable preference and the scenario's clothing or nudity as the current state; never claim the character is currently wearing something that contradicts the starting scenario.
- personality: use [Core Personality], [Behaviour], and [Speech]. Include motivations, values, strengths, flaws, fears, preferences, habits, reactions under stress, social style, boundaries, voice, vocabulary, and humour.
- scenario: faithfully restate authoritativeStartingSituation (or sharedScenario when the authoritative value is blank), its concrete current setting, starting events, clothing or nudity state, circumstances, authoritativeUserRole, and immediate dramatic possibilities. Do not dilute the requested situation into implication or general atmosphere.
- first_mes: an immersive opening that enacts authoritativeStartingSituation exactly, including the current clothing or nudity state and relationship to {{user}}, with action, dialogue, sensory context, and room for the user to respond. Never narrate the user's thoughts, choices, or dialogue. Never mention or apply usual clothing when it conflicts with the opening scene.
- mes_example: 2-4 varied exchanges formatted with <START>, {{user}}:, and {{char}}: that demonstrate voice and behaviour.
- alternate_greetings: 1-3 meaningful alternative solo openings.
- group_only_greetings: 1-2 openings that acknowledge the connected cast.
- tags: choose 5-12 concise, accurate tags supported by the completed card. Prefer supplied availableTags when relevant, but create a precise new tag when needed. Include useful identity, genre, relationship, personality, setting, and SFW/NSFW classification tags only when supported. Do not add contradictory tags, near-duplicates, or every available tag.
- character_book: concise objective lore entries for important people, places, factions, powers, and shared history. Keys should trigger naturally.
- system_prompt and post_history_instructions: leave blank unless genuinely necessary.

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
      {"keys": [""], "comment": "", "content": ""}
    ]
  }
}`;

function parse(text) {
    const data = parseJsonResponse(text);
    const name = stringValue(data.name);
    const book = data.character_book && typeof data.character_book === "object"
        ? data.character_book
        : {};
    const namedBook = Object.entries(book)
        .find(([key, value]) => key !== "entries" && key !== "name" && Array.isArray(value));
    const bookEntries = Array.isArray(book.entries)
        ? book.entries
        : namedBook?.[1] || [];
    const textField = value => Array.isArray(value)
        ? stringArray(value).join("\n\n")
        : stringValue(value);

    if (!name || !textField(data.description)) {
        throw new Error("The generated card is missing its name or description.");
    }

    return {
        name,
        nickname: stringValue(data.nickname),
        description: textField(data.description),
        personality: textField(data.personality),
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
                    content: stringValue(entry?.content)
                })).filter(entry => entry.content)
        }
    };
}

export default {
    id: "character-card",
    name: "Full Character Card",
    temperature: 0.75,
    maxTokens: 8192,
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
