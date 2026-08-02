// scripts/drivers/anthropic.js

import {
    readJsonResponse
} from "./openai-transport.js";
import { createProviderError } from "../provider-error.js";
import { fetchWithTimeout } from "./request.js";

const ENDPOINT =
    "https://api.anthropic.com/v1";

function getHeaders(apiKey) {

    return {
        "Content-Type": "application/json",
        "x-api-key": apiKey || "",
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
    };
}

function buildAnthropicMessages(
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

    const messages =
        source
            .filter(message =>
                message.role !== "system"
            )
            .map(message => ({
                role:
                    message.role === "assistant"
                        ? "assistant"
                        : "user",
                content:
                    String(message.content || "")
            }));

    return {
        system,
        messages
    };
}

const anthropicDriver = {

    id: "anthropic",
    name: "Anthropic",

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
            id: "maxTokens",
            label: "Maximum Output Tokens (Optional)",
            type: "number",
            default: ""
        }
    ],

    async listModels(settings) {

        const response =
            await fetchWithTimeout(
                `${ENDPOINT}/models?limit=1000`,
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

        if (!Array.isArray(data?.data)) {
            throw new Error(
                "Anthropic returned an unsupported model list."
            );
        }

        return data.data
            .map(model => model?.id)
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

        if (!settings.model) {
            throw new Error(
                "Select an Anthropic model first."
            );
        }

        const built =
            buildAnthropicMessages(
                task,
                input
            );

        const body = {
            model: settings.model,
            max_tokens:
                Number(settings.maxTokens) ||
                Number(task.maxTokens) ||
                4096,
            temperature: task.temperature,
            messages: built.messages
        };

        if (built.system) {
            body.system = built.system;
        }

        const response =
            await fetchWithTimeout(
                `${ENDPOINT}/messages`,
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
            data?.content
                ?.filter(block =>
                    block?.type === "text"
                )
                .map(block => block.text)
                .join("") || "";

        const stopReason = data?.stop_reason || "";

        if (["max_tokens", "model_context_window_exceeded"].includes(stopReason)) {
            const error = createProviderError(this.name, response, data, {
                category: stopReason === "max_tokens" ? "output_limit" : "context_limit",
                finishReason: stopReason
            });
            error.retryableAIOutput = true;
            error.debugRawOutput = content;
            throw error;
        }

        if (stopReason === "refusal") {
            throw createProviderError(this.name, response, data, {
                category: "content_filter",
                finishReason: stopReason
            });
        }

        if (!content) {
            throw createProviderError(this.name, response, data, {
                category: "empty_response",
                finishReason: stopReason
            });
        }

        let parsedResult;
        try {
            parsedResult = task.parse(content, input);
        } catch (error) {
            error.debugRawOutput = content;
            throw error;
        }

        const parsedResponse = {
            result: parsedResult,
            model:
                data?.model || settings.model,
            usage: {
                inputTokens:
                    data?.usage?.input_tokens,
                outputTokens:
                    data?.usage?.output_tokens,
                totalTokens:
                    data?.usage
                        ? (
                            Number(data.usage.input_tokens) || 0
                        ) +
                        (
                            Number(data.usage.output_tokens) || 0
                        )
                        : undefined
            }
        };
        Object.defineProperty(parsedResponse, "debugRawOutput", { value: content });
        return parsedResponse;
    }
};

export default anthropicDriver;
