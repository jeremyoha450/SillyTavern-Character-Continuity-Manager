// scripts/drivers/deepseek.js

import {
    listOpenAIModels,
    sendOpenAIChat
} from "./openai-transport.js";

const ENDPOINT =
    "https://api.deepseek.com";

const deepSeekDriver = {

    id: "deepseek",
    name: "DeepSeek",

    settings: [
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
            endpoint: ENDPOINT,
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
            endpoint: ENDPOINT,
            providerName: this.name
        });
    }
};

export default deepSeekDriver;
