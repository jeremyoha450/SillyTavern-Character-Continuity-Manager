import {
    parseJsonResponse,
    stringValue
} from "./parser.js";

function parse(text) {
    const data = parseJsonResponse(text);
    const result = stringValue(data.text);
    if (!result) throw new Error("The AI returned an empty field.");
    return result;
}

export default {
    id: "character-card-field",
    name: "Character Card Field",
    temperature: 0.7,
    maxTokens: 4096,
    buildMessages(input) {
        return [
            {
                role: "system",
                content: `Write or revise one SillyTavern character-card field. Preserve all established facts, names, relationships, appearance, and voice. Follow the user's instruction exactly. Avoid repetition and contradictions. Return only valid JSON: {"text":"complete field text"}`
            },
            {
                role: "user",
                content: JSON.stringify(input, null, 2)
            }
        ];
    },
    schema: { text: "" },
    parse
};
