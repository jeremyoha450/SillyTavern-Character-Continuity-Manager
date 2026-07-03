// scripts/drivers/openai-compatible.js

import {
    listOpenAIModels,
    sendOpenAIChat
} from "./openai-transport.js";

const openAICompatibleDriver = {

    id: "openai-compatible",
    name: "OpenAI Compatible",

    settings: [
        {
            id: "endpoint",
            label: "Endpoint",
            type: "text",
            default: ""
        },
        {
            id: "apiKey",
            label: "API Key",
            type: "password",
            default: ""
        },
        {
            id: "model",
            label: "Model",
            type: "text",
            default: ""
        }
    ],

    async listModels(settings) {
        return listOpenAIModels({
            endpoint: settings.endpoint,
            apiKey: settings.apiKey,
            providerName: this.name
        });
    },

    async sendRequest(
        task,
        settings,
        input
    ) {
        return sendOpenAIChat({
            task,
            settings,
            input,
            endpoint: settings.endpoint,
            providerName: this.name
        });
    }
};

export default openAICompatibleDriver;
