// scripts/tasks/facts/index.js

import SYSTEM_PROMPT
from "./prompt.js";

import schema
from "./schema.js";

import {
    parse
} from "./parser.js";

const factsTask = {

    id: "facts",

    name: "Character Facts",

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
`Character Description:

${text}`
            }

        ];

    },

    schema,

    parse

};

export default factsTask;