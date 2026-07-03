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
				knowledge,
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