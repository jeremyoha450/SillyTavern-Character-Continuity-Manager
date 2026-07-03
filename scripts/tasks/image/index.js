// scripts/tasks/image/index.js

import schema
from "./schema.js";

import {
    parse
} from "./parser.js";

import {
    getImagePromptPreset
} from "./presets/registry.js";

const imagePromptTask = {

    id: "image-prompt",

    name: "Image Prompt Generator",

    temperature: 0.3,

    buildMessages(
        input
    ) {

        const suppliedPreset =
            input?.preset;

        const preset =
            suppliedPreset &&
            typeof suppliedPreset.systemPrompt === "string"
                ? suppliedPreset
                : getImagePromptPreset(
                    input?.presetId
                );

        const continuity =
            input?.continuity || input;

        return [

            {
                role: "system",
                content: preset.systemPrompt
            },

            {
                role: "user",
                content:
`Create an image prompt from these character facts and current state:

${JSON.stringify(
    continuity,
    null,
    2
)}`
            }

        ];

    },

    schema,

    parse

};

export default imagePromptTask;
