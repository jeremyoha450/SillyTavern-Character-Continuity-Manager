// scripts/drivers/ollama.js

import {
    createBearerHeaders,
    normalizeEndpoint,
    readJsonResponse,
    sendOpenAIChat
} from "./openai-transport.js";
import { fetchWithTimeout } from "./request.js";

function getRoot(endpoint) {

    return normalizeEndpoint(endpoint)
        .replace(/\/v1$/i, "");
}

const ollamaDriver = {

    id: "ollama",
    name: "Ollama",

    settings: [
        {
            id: "endpoint",
            label: "Ollama Endpoint",
            type: "text",
            default: ""
        },
        {
            id: "apiKey",
            label: "API Key (Optional)",
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

        const root =
            getRoot(settings.endpoint);

        if (!root) {
            throw new Error(
                "Enter an Ollama endpoint first."
            );
        }

        const response =
            await fetchWithTimeout(
                `${root}/api/tags`,
                {
                    headers:
                        createBearerHeaders(
                            settings.apiKey
                        )
                }
            );

        const data =
            await readJsonResponse(
                response,
                this.name
            );

        if (!Array.isArray(data?.models)) {
            throw new Error(
                "Ollama returned an unsupported model list."
            );
        }

        return data.models
            .map(model =>
                model?.model || model?.name
            )
            .filter(Boolean)
            .sort((a, b) =>
                a.localeCompare(b)
            );
    },

    async sendRequest(
        task,
        settings,
        input
    ) {

        const root =
            getRoot(settings.endpoint);

        if (!root) {
            throw new Error(
                "Enter an Ollama endpoint first."
            );
        }

        return sendOpenAIChat({
            task,
            settings,
            input,
            endpoint:
                `${root}/v1`,
            providerName: this.name
        });
    }
};

export default ollamaDriver;
