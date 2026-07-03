// scripts/tasks/knowledge/index.js

import SYSTEM_PROMPT
from "./prompt.js";

import schema
from "./schema.js";

import {
    parse
} from "./parser.js";

const knowledgeTask = {

    id: "knowledge",

    name: "Character Knowledge",

    temperature: 0,

    buildMessages(
        text
    ) {

        return [

            {
                role: "system",
                content: SYSTEM_PROMPT
            },

            {
                role: "user",
                content:
`Recent Messages:

${text}`
            }

        ];

    },

    schema,

    parse

};

export default knowledgeTask;