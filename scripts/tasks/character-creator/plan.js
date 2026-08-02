import {
    firstAffirmedMatch,
    parseJsonResponse,
    stringArray,
    stringValue
} from "./parser.js";

const SYSTEM_PROMPT = `You design detailed, internally consistent casts for SillyTavern character cards.

Return only valid JSON. Do not use markdown.

Create exactly the requested number of distinct card subjects. Treat the user's shared setting, starting situation, user role, requirements, and card-type guidance as authoritative. Preserve explicitly requested events, their order, character actions, current clothing or nudity state, relationship to the user, and stated outcomes in sharedScenario; do not replace them with a vaguer or safer alternative. When the input explicitly states an awareness or perception condition — a character does or does not see, hear, or notice someone, or someone is hidden, unseen, unnoticed, or undetected — the generated sharedScenario must preserve that condition explicitly and unambiguously, in so many words: "quietly observing from the doorway" is not a substitute for "unseen and unheard," because quiet observation leaves detection ambiguous where the input made it certain. Usual clothing is a stable wardrobe preference only and must never alter the current clothing or nudity state in the starting situation. If the starting situation says the character is naked, nude, or completely naked, phrase that naturally; never write awkward constructions such as "naked from the waist up and down." Never invent a family or social relationship that conflicts with the supplied user role or character brief. Rewrite the user's wording into polished, natural prose and expand it with useful setting, atmosphere, and immediate dramatic context—do not merely quote or lightly rephrase the input. Connected characters must have reciprocal but perspective-sensitive relationships. Give every embodied character a clear dramatic function, personal goal, flaw, history, connection to the user, and relationship with every other cast member. For open-world, narrator/scenario, or tool/assistant cards, adapt these cast fields to the world's, narrator's, scenario's, or tool's function instead of inventing an embodied person. Avoid generic duplicates and do not swap traits between characters.

INTENSITY FIDELITY
When a character's userBrief states an explicit intensity, temperament, or emotional register — for example "heavily," "overtly," "explosively," or "short-fused" — carry that same intensity and register directly into concept, flaw, goal, and setName rather than reinterpreting or moderating it into a calmer, more restrained, rationalized, or intellectualized framing. Never independently soften a brief that states heavy or overt anger into words like "simmering," "brittle," "rationalized," "intellectualized," "guarded," or "contained," and never invent a softer, whimsical, or ambiguous setName or cast title (for example "The Quiet Storm") that undercuts an explicitly stated intensity. If userBrief explicitly negates a trait (for example "not withdrawn" or "not simmering quietly"), do not give the character that negated trait, or a close synonym of it, anywhere in concept, flaw, or goal. Watch the goal field especially: do not default a heavily angry character's goal to calming down, finding peace, learning to control their temper, being understood, or otherwise resolving or minimizing the stated trait — that quietly converts the trait into a problem the story exists to fix. Unless userBrief itself frames the intensity as something the character wants to change, write a goal the character actually pursues as the person they are (something they want to get, win, prove, protect, or make happen), with the stated temperament as how they pursue it, not what they are trying to escape. When userBrief states heavy, overt, or explosive anger or intensity, this is also a word-level rule, not only a framing rule: concept, flaw, goal, and setName must not use softening or restraint words — "simmering," "brittle," "contained," "quiet," "restrained," "muted," "subdued," "silent," or similar — as the framing for that temperament. "A constant state of simmering rage" fails a brief that says "very angry, always angry"; "openly, loudly angry at any provocation" carries it. Before returning the JSON, re-read those four fields for these words and rewrite any field that uses one to frame the stated temperament.

Schema:
{
  "setName": "",
  "sharedWorld": "",
  "sharedScenario": "",
  "userRole": "",
  "tone": "",
  "sharedHistory": [""],
  "cast": [
    {
      "name": "",
      "role": "",
      "age": "",
      "gender": "",
      "species": "",
      "appearance": {
        "height": "",
        "bodyType": "",
        "skin": "",
        "eyes": "",
        "hair": "",
        "face": "",
        "clothing": "",
        "distinctiveFeatures": ""
      },
      "userBrief": "",
      "personalScenario": "",
      "concept": "",
      "goal": "",
      "flaw": "",
      "connectionToUser": "",
      "relationships": [{"name": "", "dynamic": ""}]
    }
  ]
}`;

// Same soft/restrained-emotion word list card.js's consistency check scans
// for, plus "silent": these words quietly reframe an explicitly overt
// temperament into a restrained one.
const SOFT_FRAMING_WORDS =
    /\b(?:simmering|brittle|contained|quiet(?:ly)?|restrained|muted|subdued|silent(?:ly)?)\b/i;

// Briefs that state overt intensity in so many words — "very angry",
// "always angry", "explosively angry", "short-fused" — rather than leaving
// temperament to inference.
const OVERT_INTENSITY_BRIEF =
    /\b(?:heavily|overtly|explosively|very|always|constantly|extremely|openly)\b[\s\w,'-]{0,40}?\b(?:angry|anger|furious|fury|rage|raging|volatile)\b|\bshort-?fused\b|\bhot-?tempered\b/i;

// The prompt-level INTENSITY FIDELITY rule alone did not stop the planner
// softening "very angry... always angry" briefs into "simmering rage"
// concepts — the same failure card generation had before its word-level
// check. Enforce the lexical rule on the output too: a thrown error here
// carries through the driver layer with the raw output attached, which
// triggers the standard one-shot corrective retry instead of handing the
// user a soft-framed plan to fix manually.
function sourceBriefs(input = {}) {
    if (Array.isArray(input.briefs)) return input.briefs;
    if (Array.isArray(input.concept)) return input.concept;
    try {
        const parsed = JSON.parse(String(input.concept || ""));
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function originalFor(planned, index, input) {
    const sources = sourceBriefs(input);
    return sources.find(item =>
        stringValue(item?.name).toLowerCase() === planned.name.toLowerCase()
    ) || sources[index] || null;
}

function authoritativeText(original, input = {}) {
    return [
        original?.brief,
        original?.scenario,
        input.setting,
        input.userRequirements
    ].filter(Boolean).join("\n");
}

function authoritativeIntensityText(planned, original, input = {}, castCount = 1) {
    const local = [original?.brief, original?.scenario].filter(Boolean);
    const global = [input.setting, input.userRequirements]
        .filter(Boolean)
        .join("\n");
    if (castCount <= 1) return [...local, global].filter(Boolean).join("\n");

    // Shared setup text can describe one member of a larger cast. Do not
    // accidentally impose that member's anger on everybody else: for a
    // multi-character plan, use only global sentences that name this member.
    const name = planned.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const namedGlobal = name
        ? global.split(/(?<=[.!?\n])/).filter(sentence =>
            new RegExp(`\\b${name}\\b`, "i").test(sentence)
        )
        : [];
    return [...local, ...namedGlobal].filter(Boolean).join("\n");
}

function hasAuthoritativeInput(input = {}) {
    return sourceBriefs(input).length > 0 ||
        [input.setting, input.userRequirements].some(value => stringValue(value));
}

function assertIntensityCarried(plan, input = {}) {
    const useOriginal = hasAuthoritativeInput(input);
    const overtCast = plan.cast.map((item, index) => ({
        item,
        source: useOriginal
            ? authoritativeIntensityText(
                item,
                originalFor(item, index, input),
                input,
                plan.cast.length
            )
            : item.userBrief
    })).filter(({ source }) => firstAffirmedMatch(source, OVERT_INTENSITY_BRIEF));
    if (!overtCast.length) return;

    const offending = [];
    for (const { item } of overtCast) {
        for (const field of ["concept", "flaw", "goal"]) {
            const match = firstAffirmedMatch(item[field], SOFT_FRAMING_WORDS);
            if (match) offending.push(`${item.name}'s ${field} uses "${match[0]}"`);
        }
    }
    const setNameMatch = firstAffirmedMatch(plan.setName, SOFT_FRAMING_WORDS);
    if (setNameMatch) offending.push(`setName uses "${setNameMatch[0]}"`);

    if (offending.length) {
        throw new Error(
            `The cast plan softens an explicitly intense userBrief: ${offending.join("; ")} despite the brief stating overt anger. Rewrite the flagged fields to carry the stated intensity instead of restraint framing.`
        );
    }
}

// Explicit awareness/perception conditions in the source input: a negated
// perception verb ("would never see or hear me", "doesn't notice") or one of
// the unambiguous state words. "Hidden" counts only when attached to a person
// or "hidden from" relationship; an unrelated hidden object does not count.
// The generated scenario must use direct perception wording rather than bare
// "hidden", which is too ambiguous to prove that the condition was retained.
const AWARENESS_CONDITION =
    /\b(?:never|not|cannot|without|\w+n't)\b[^.!?]{0,40}\b(?:sees?|seeing|hears?|hearing|notices?|noticing|detects?)\b|\b(?:unseen|unheard|unnoticed|undetected)\b|\bunaware\b[^.!?]{0,30}\b(?:of\s+(?:me|us|the user|\{\{user\}\}|the observer|the watcher|the visitor|the intruder|her husband|his wife|their partner|the presence)|that\s+(?:i|we|the user|\{\{user\}\}))\b|\b(?:i|me|we|he|she|they|someone|observer|watcher|user|character|\{\{user\}\})\b[^.!?]{0,24}\bhidden\b|\bhidden\b[^.!?]{0,24}\bfrom\b/i;

const AWARENESS_STATED =
    /\b(?:never|not|cannot|without|\w+n't)\b[^.!?]{0,40}\b(?:sees?|seeing|hears?|hearing|notices?|noticing|detects?|detecting|aware)\b|\b(?:unseen|unheard|unnoticed|undetected)\b|\bunaware\b[^.!?]{0,30}\b(?:of\s+(?:me|us|the user|\{\{user\}\}|the observer|the watcher|the visitor|the intruder|her husband|his wife|their partner|the presence)|that\s+(?:i|we|the user|\{\{user\}\}))\b/i;

// The planner paraphrases the user's starting situation into sharedScenario
// and can drop an explicitly stated awareness condition in the process —
// "so she would never see or hear me" weakening into "quietly observing
// from the doorway", which leaves detection ambiguous for the card
// generator to resolve wrongly. Same enforcement pattern as the intensity
// check: throw so the driver-attached raw output rides the corrective
// retry instead of the ambiguous plan reaching the user.
function assertAwarenessCarried(plan, input = {}) {
    const useOriginal = hasAuthoritativeInput(input);
    const sourceStatesCondition = useOriginal
        ? plan.cast.some((item, index) => AWARENESS_CONDITION.test(
            authoritativeText(originalFor(item, index, input), input)
        ))
        : plan.cast.some(item =>
            AWARENESS_CONDITION.test(item.userBrief) ||
            AWARENESS_CONDITION.test(item.personalScenario)
        );
    if (!sourceStatesCondition || AWARENESS_STATED.test(plan.sharedScenario)) return;

    throw new Error(
        "The cast plan dropped an explicitly stated awareness condition: the brief states a character cannot see, hear, or notice someone, but sharedScenario no longer says so explicitly. Rewrite sharedScenario to state the unseen/unheard/unnoticed condition unambiguously."
    );
}

function parse(text, input = {}) {
    const data = parseJsonResponse(text);
    const cast = Array.isArray(data.cast)
        ? data.cast.map(item => ({
            name: stringValue(item?.name),
            role: stringValue(item?.role),
            age: stringValue(item?.age),
            gender: stringValue(item?.gender),
            species: stringValue(item?.species),
            appearance: {
                height: stringValue(item?.appearance?.height),
                bodyType: stringValue(item?.appearance?.bodyType),
                skin: stringValue(item?.appearance?.skin),
                eyes: stringValue(item?.appearance?.eyes),
                hair: stringValue(item?.appearance?.hair),
                face: stringValue(item?.appearance?.face),
                clothing: stringValue(item?.appearance?.clothing),
                distinctiveFeatures: stringValue(item?.appearance?.distinctiveFeatures)
            },
            userBrief: stringValue(item?.userBrief),
            personalScenario: stringValue(item?.personalScenario),
            concept: stringValue(item?.concept),
            goal: stringValue(item?.goal),
            flaw: stringValue(item?.flaw),
            connectionToUser:
                stringValue(item?.connectionToUser),
            relationships:
                Array.isArray(item?.relationships)
                    ? item.relationships.map(relation => ({
                        name: stringValue(relation?.name),
                        dynamic: stringValue(relation?.dynamic)
                    })).filter(relation => relation.name)
                    : []
        })).filter(item => item.name)
        : [];

    if (!cast.length) {
        throw new Error("The cast plan did not contain any characters.");
    }

    const plan = {
        setName: stringValue(data.setName),
        sharedWorld: stringValue(data.sharedWorld),
        sharedScenario: stringValue(data.sharedScenario),
        userRole: stringValue(data.userRole),
        tone: stringValue(data.tone),
        sharedHistory: stringArray(data.sharedHistory),
        cast
    };
    assertIntensityCarried(plan, input);
    assertAwarenessCarried(plan, input);
    return plan;
}

export default {
    id: "character-cast-plan",
    name: "Character Cast Plan",
    temperature: 0.7,
    maxTokens: 8192,
    buildMessages(input) {
        return [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: `Design this cast:\n\n${JSON.stringify(input, null, 2)}`
            }
        ];
    },
    schema: {},
    parse
};
