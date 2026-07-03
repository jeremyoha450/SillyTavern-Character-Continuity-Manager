// scripts/tasks/state/index.js

import SYSTEM_PROMPT
from "./prompt.js";

import schema
from "./schema.js";

import {
    parse
} from "./parser.js";

const stateTask = {

    id: "state",

    name: "Character State",

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
`Recent Chat:

${text}`
            }

        ];

    },

    schema,

    parse

};

export default stateTask;