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
        input
    ) {

        const isObject =
            input !== null &&
            typeof input === "object";

        const baseline =
            isObject
                ? input.baseline
                : null;

        const messages =
            isObject
                ? input.messages
                : input;

        const previousStateBlock =
            baseline
                ? `<previous_state read_only="true">\n${baseline}\n</previous_state>\n\n`
                : "";

        return [

            {
                role: "system",
                content: SYSTEM_PROMPT
            },

            {
                role: "user",
                content:
`${previousStateBlock}<recent_messages>
${messages}
</recent_messages>`
            }

        ];

    },

    schema,

    parse

};

export default stateTask;