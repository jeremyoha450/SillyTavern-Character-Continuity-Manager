// scripts/drivers/openai-transport.js

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
        const detail =
            data?.error?.message ||
            (
                typeof data?.error === "string"
                    ? data.error
                    : ""
            ) ||
            data?.message ||
            response.statusText ||
            "Request failed";

        throw new Error(
            `${providerName}: ${detail} (${response.status})`
        );
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
        await fetch(
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
        await fetch(
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

    if (typeof content !== "string") {
        throw new Error(
            `${providerName} returned no message content.`
        );
    }

    const usage = data?.usage || {};

    return {
        result: task.parse(content),
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
}
