// scripts/tasks/knowledge-update/index.js

import SYSTEM_PROMPT
from "./prompt.js";

import schema
from "./schema.js";

import {
    parse
} from "./parser.js";

const knowledgeUpdateTask = {

    id: "knowledge-update",

    name: "Knowledge Update",

    temperature: 0,

    buildMessages(
        {
            knowledge,
            conversation
        }
    ) {

        // The model only works with text and confidence.
        // Ids and timestamps are internal; sending them
        // wastes tokens and invites the model to echo them.
        const slimKnowledge =
            (knowledge || []).map(
                item => ({
                    text: item.text,
                    confidence: item.confidence
                })
            );

        return [

            {
                role: "system",
                content: SYSTEM_PROMPT
            },

            {
                role: "user",
                content:
`EXISTING KNOWLEDGE

${JSON.stringify(
    slimKnowledge,
    null,
    2
)}

RECENT CONVERSATION

${conversation}`
            }

        ];

    },

    schema,

    parse

};

export default knowledgeUpdateTask;
