// scripts/drivers/openai-transport.js

import { fetchWithTimeout } from "./request.js";
import { createProviderError } from "../provider-error.js";

export function normalizeEndpoint(endpoint) {

    return String(endpoint || "")
        .replace(/\/+$/, "");
}

export async function readJsonResponse(
    response,
    providerName
) {

    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw createProviderError(providerName, response, data || {});
    }

    return data;
}

export function createBearerHeaders(
    apiKey,
    extra = {}
) {

    const headers = {
        "Content-Type": "application/json",
        ...extra
    };

    if (apiKey) {
        headers.Authorization =
            `Bearer ${apiKey}`;
    }

    return headers;
}

export async function listOpenAIModels({
    endpoint,
    apiKey,
    headers = {},
    providerName = "Provider"
}) {

    const base =
        normalizeEndpoint(endpoint);

    if (!base) {
        throw new Error(
            `Enter a ${providerName} endpoint first.`
        );
    }

    const response =
        await fetchWithTimeout(
            `${base}/models`,
            {
                headers:
                    createBearerHeaders(
                        apiKey,
                        headers
                    )
            }
        );

    const data =
        await readJsonResponse(
            response,
            providerName
        );

    const models =
        Array.isArray(data)
            ? data
            : data?.data;

    if (!Array.isArray(models)) {
        throw new Error(
            `${providerName} returned an unsupported model list.`
        );
    }

    return models
        .map(model =>
            typeof model === "string"
                ? model
                : model?.id
        )
        .filter(Boolean)
        .sort((a, b) =>
            a.localeCompare(b)
        );
}

export async function sendOpenAIChat({
    task,
    settings,
    input,
    endpoint,
    headers = {},
    providerName = "Provider"
}) {

    const base =
        normalizeEndpoint(endpoint);

    if (!base) {
        throw new Error(
            `Enter a ${providerName} endpoint first.`
        );
    }

    if (!settings.model) {
        throw new Error(
            `Select a ${providerName} model first.`
        );
    }

    const response =
        await fetchWithTimeout(
            `${base}/chat/completions`,
            {
                method: "POST",
                headers:
                    createBearerHeaders(
                        settings.apiKey,
                        headers
                    ),
                body: JSON.stringify({
                    model: settings.model,
                    // Several compatible servers default to a response limit
                    // too small for CCM's full state schema, producing JSON
                    // that simply stops halfway through an object.
                    max_tokens:
                        Number(settings.maxTokens) ||
                        Number(task.maxTokens) ||
                        4096,
                    temperature: task.temperature,
                    messages:
                        task.buildMessages(input)
                })
            }
        );

    const data =
        await readJsonResponse(
            response,
            providerName
        );

    const content =
        data?.choices?.[0]
            ?.message?.content;

    const finishReason =
        data?.choices?.[0]
            ?.finish_reason;

    if (data?.error || data?.choices?.[0]?.error || finishReason === "error") {
        throw createProviderError(providerName, response, data, {
            finishReason
        });
    }

    if (
        finishReason === "length" ||
        finishReason === "max_tokens"
    ) {
        const error = createProviderError(providerName, response, data, {
            category: "output_limit",
            finishReason,
            message: "Output limit reached."
        });
        error.retryableAIOutput = true;
        error.debugRawOutput = typeof content === "string" ? content : "";
        throw error;
    }

    if (["content_filter", "insufficient_system_resource"].includes(finishReason)) {
        throw createProviderError(providerName, response, data, {
            finishReason,
            category: finishReason === "content_filter" ? "content_filter" : "provider_overloaded"
        });
    }

    if (typeof content !== "string") {
        const error = createProviderError(providerName, response, data, {
            category: "empty_response",
            message: "No message content."
        });
        error.retryableAIOutput = true;
        throw error;
    }

    const usage = data?.usage || {};

    let parsedResult;
    try {
        parsedResult = task.parse(content);
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
                usage.prompt_tokens ??
                usage.input_tokens,
            outputTokens:
                usage.completion_tokens ??
                usage.output_tokens,
            totalTokens:
                usage.total_tokens
        }
    };
    Object.defineProperty(parsedResponse, "debugRawOutput", { value: content });
    return parsedResponse;
}
