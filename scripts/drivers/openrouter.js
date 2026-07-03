// scripts/drivers/openrouter.js

import {
    listOpenAIModels,
    sendOpenAIChat
} from "./openai-transport.js";

const ENDPOINT =
    "https://openrouter.ai/api/v1";

function getHeaders(settings) {

    const headers = {};

    if (settings.siteUrl) {
        headers["HTTP-Referer"] =
            settings.siteUrl;
    }

    if (settings.appName) {
        headers["X-OpenRouter-Title"] =
            settings.appName;
    }

    return headers;
}

const openRouterDriver = {

    id: "openrouter",
    name: "OpenRouter",

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
        },
        {
            id: "siteUrl",
            label: "Site URL (Optional)",
            type: "text",
            default: ""
        },
        {
            id: "appName",
            label: "App Name (Optional)",
            type: "text",
            default: ""
        }
    ],

    async listModels(settings) {
        return listOpenAIModels({
            endpoint: ENDPOINT,
            apiKey: settings.apiKey,
            headers: getHeaders(settings),
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
            headers: getHeaders(settings),
            providerName: this.name
        });
    }
};

export default openRouterDriver;
