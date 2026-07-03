// scripts/drivers/gemini.js

import {
    readJsonResponse
} from "./openai-transport.js";

const ENDPOINT =
    "https://generativelanguage.googleapis.com/v1beta";

function getHeaders(apiKey) {

    return {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey || ""
    };
}

function normalizeModel(model) {

    return String(model || "")
        .replace(/^models\//, "");
}

function buildGeminiContent(
    task,
    input
) {

    const source =
        task.buildMessages(input);

    const system =
        source
            .filter(message =>
                message.role === "system"
            )
            .map(message =>
                String(message.content || "")
            )
            .join("\n\n");

    const contents =
        source
            .filter(message =>
                message.role !== "system"
            )
            .map(message => ({
                role:
                    message.role === "assistant"
                        ? "model"
                        : "user",
                parts: [
                    {
                        text:
                            String(message.content || "")
                    }
                ]
            }));

    return {
        system,
        contents
    };
}

const geminiDriver = {

    id: "gemini",
    name: "Gemini",

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

        const response =
            await fetch(
                `${ENDPOINT}/models?pageSize=1000`,
                {
                    headers:
                        getHeaders(settings.apiKey)
                }
            );

        const data =
            await readJsonResponse(
                response,
                this.name
            );

        if (!Array.isArray(data?.models)) {
            throw new Error(
                "Gemini returned an unsupported model list."
            );
        }

        return data.models
            .filter(model =>
                model?.supportedGenerationMethods
                    ?.includes("generateContent")
            )
            .map(model =>
                normalizeModel(model.name)
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

        const model =
            normalizeModel(settings.model);

        if (!model) {
            throw new Error(
                "Select a Gemini model first."
            );
        }

        const built =
            buildGeminiContent(
                task,
                input
            );

        const body = {
            contents: built.contents,
            generationConfig: {
                temperature: task.temperature
            }
        };

        if (built.system) {
            body.systemInstruction = {
                parts: [
                    { text: built.system }
                ]
            };
        }

        const response =
            await fetch(
                `${ENDPOINT}/models/${encodeURIComponent(model)}:generateContent`,
                {
                    method: "POST",
                    headers:
                        getHeaders(settings.apiKey),
                    body: JSON.stringify(body)
                }
            );

        const data =
            await readJsonResponse(
                response,
                this.name
            );

        const content =
            data?.candidates?.[0]
                ?.content?.parts
                ?.map(part => part?.text || "")
                .join("") || "";

        if (!content) {
            const reason =
                data?.promptFeedback?.blockReason;

            throw new Error(
                reason
                    ? `Gemini blocked the request: ${reason}.`
                    : "Gemini returned no message content."
            );
        }

        return {
            result: task.parse(content),
            model:
                data?.modelVersion || model,
            usage: {
                inputTokens:
                    data?.usageMetadata
                        ?.promptTokenCount,
                outputTokens:
                    data?.usageMetadata
                        ?.candidatesTokenCount,
                totalTokens:
                    data?.usageMetadata
                        ?.totalTokenCount
            }
        };
    }
};

export default geminiDriver;
