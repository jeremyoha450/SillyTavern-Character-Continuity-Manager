import {
    parseJsonResponse,
    stringArray,
    stringValue
} from "./parser.js";

const SYSTEM_PROMPT = `You design detailed, internally consistent casts for SillyTavern character cards.

Return only valid JSON. Do not use markdown.

Create exactly the requested number of distinct card subjects. Treat the user's shared setting, starting situation, user role, requirements, and card-type guidance as authoritative. Preserve explicitly requested events, their order, character actions, current clothing or nudity state, relationship to the user, and stated outcomes in sharedScenario; do not replace them with a vaguer or safer alternative. Usual clothing is a stable wardrobe preference only and must never alter the current clothing or nudity state in the starting situation. If the starting situation says the character is naked, nude, or completely naked, phrase that naturally; never write awkward constructions such as "naked from the waist up and down." Never invent a family or social relationship that conflicts with the supplied user role or character brief. Rewrite the user's wording into polished, natural prose and expand it with useful setting, atmosphere, and immediate dramatic context—do not merely quote or lightly rephrase the input. Connected characters must have reciprocal but perspective-sensitive relationships. Give every embodied character a clear dramatic function, personal goal, flaw, history, connection to the user, and relationship with every other cast member. For open-world, narrator/scenario, or tool/assistant cards, adapt these cast fields to the world's, narrator's, scenario's, or tool's function instead of inventing an embodied person. Avoid generic duplicates and do not swap traits between characters.

INTENSITY FIDELITY
When a character's userBrief states an explicit intensity, temperament, or emotional register — for example "heavily," "overtly," "explosively," or "short-fused" — carry that same intensity and register directly into concept, flaw, goal, and setName rather than reinterpreting or moderating it into a calmer, more restrained, rationalized, or intellectualized framing. Never independently soften a brief that states heavy or overt anger into words like "simmering," "brittle," "rationalized," "intellectualized," "guarded," or "contained," and never invent a softer, whimsical, or ambiguous setName or cast title (for example "The Quiet Storm") that undercuts an explicitly stated intensity. If userBrief explicitly negates a trait (for example "not withdrawn" or "not simmering quietly"), do not give the character that negated trait, or a close synonym of it, anywhere in concept, flaw, or goal.

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

function parse(text) {
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

    return {
        setName: stringValue(data.setName),
        sharedWorld: stringValue(data.sharedWorld),
        sharedScenario: stringValue(data.sharedScenario),
        userRole: stringValue(data.userRole),
        tone: stringValue(data.tone),
        sharedHistory: stringArray(data.sharedHistory),
        cast
    };
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
