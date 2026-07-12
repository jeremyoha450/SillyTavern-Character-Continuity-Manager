const CATEGORY_MESSAGES = Object.freeze({
    authentication: "The AI provider rejected the API key or authentication.",
    permission: "The AI provider denied access to this model or request.",
    billing: "The AI provider reports that the account has insufficient credit or has reached its usage budget.",
    rate_limit: "The AI provider's request or token rate limit was reached.",
    context_limit: "The request is too large for the selected model's context window.",
    output_limit: "The model reached its output limit before completing the response.",
    content_filter: "The AI provider blocked or filtered the response.",
    invalid_request: "The AI provider rejected the request or one of its settings.",
    model_unavailable: "The selected model is unavailable or could not be found.",
    provider_overloaded: "The AI provider is temporarily overloaded or unavailable.",
    timeout: "The AI provider did not finish the request in time.",
    cancelled: "The AI request was cancelled.",
    network: "CCM could not reach the AI provider.",
    empty_response: "The AI provider returned no usable response.",
    malformed_output: "The AI response was invalid or incomplete.",
    unknown: "The AI request failed for an unrecognized reason."
});

function text(value) {
    return String(value || "").trim();
}

export function classifyProviderError({ status = 0, code = "", type = "", finishReason = "", message = "" } = {}) {
    const signal = [code, type, finishReason, message].map(text).join(" ").toLowerCase();
    if (status === 401 || /auth|api.?key|credential/.test(signal)) return "authentication";
    if (status === 402 || /billing|balance|credit|quota.*exceed|insufficient.?quota|insufficient.*fund|usage.*limit|budget/.test(signal)) return "billing";
    if (status === 403 || /permission|forbidden|not allowed|access restricted/.test(signal)) return "permission";
    if (status === 429 || /rate.?limit|resource_exhausted|daily_(?:rpd|usd)/.test(signal)) return "rate_limit";
    if (/context.*(?:length|window|exceed)|input.*too (?:long|large)/.test(signal)) return "context_limit";
    if (/max_tokens|max.?tokens|output.?limit|finish.?reason.?length/.test(signal) || finishReason === "length") return "output_limit";
    if (/content.?filter|safety|recitation|blocklist|prohibited|spii|refusal|policy.?violation|moderation/.test(signal)) return "content_filter";
    if (status === 404 || /model_not_found|not.?found|unknown model/.test(signal)) return "model_unavailable";
    if (/cancelled|canceled|aborterror/.test(signal)) return "cancelled";
    if (status === 408 || status === 504 || /timeout|timed out|deadline_exceeded/.test(signal)) return "timeout";
    if ([500, 502, 503, 529].includes(Number(status)) || /overload|unavailable|insufficient_system_resource|provider_unavailable|all_fallbacks_failed/.test(signal)) return "provider_overloaded";
    if ([400, 409, 413, 422].includes(Number(status)) || /invalid_request|invalid.?parameter|invalid.?format|payload.?too.?large/.test(signal)) return "invalid_request";
    if (/empty.?response|no (?:message )?content|no text/.test(signal)) return "empty_response";
    if (/invalid json|malformed|incomplete|truncat/.test(signal)) return "malformed_output";
    return "unknown";
}

export class CCMProviderError extends Error {
    constructor(message, details = {}, options = {}) {
        super(message, options);
        this.name = "CCMProviderError";
        this.provider = text(details.provider);
        this.category = details.category || classifyProviderError(details);
        this.status = Number(details.status) || 0;
        this.code = text(details.code);
        this.errorType = text(details.type);
        this.finishReason = text(details.finishReason);
        this.retryAfterSeconds = Number(details.retryAfterSeconds) || 0;
        this.requestId = text(details.requestId).slice(0, 160);
        this.retryable = details.retryable === true || ["rate_limit", "provider_overloaded", "timeout", "network"].includes(this.category);
        if (details.debugRawOutput !== undefined) this.debugRawOutput = details.debugRawOutput;
    }
}

export function createProviderError(provider, response, data = {}, overrides = {}) {
    const source = data?.error && typeof data.error === "object" ? data.error : data;
    const choiceError = data?.choices?.[0]?.error || {};
    const status = Number(overrides.status ?? response?.status ?? source?.status ?? choiceError?.code) || 0;
    const code = overrides.code ?? source?.code ?? choiceError?.code ?? "";
    const type = overrides.type ?? source?.type ?? source?.status ?? choiceError?.metadata?.error_type ?? choiceError?.type ?? "";
    const finishReason = overrides.finishReason ?? data?.choices?.[0]?.finish_reason ?? "";
    const providerMessage = text(overrides.message ?? source?.message ?? (typeof data?.error === "string" ? data.error : "") ?? response?.statusText);
    const details = {
        provider,
        status,
        code,
        type,
        finishReason,
        message: providerMessage,
        retryAfterSeconds: Number(response?.headers?.get?.("Retry-After")) || 0,
        requestId: response?.headers?.get?.("x-request-id") || response?.headers?.get?.("request-id") || data?.request_id || "",
        ...overrides
    };
    const category = overrides.category || classifyProviderError(details);
    return new CCMProviderError(
        `${provider}: ${CATEGORY_MESSAGES[category] || CATEGORY_MESSAGES.unknown}${status ? ` (${status})` : ""}`,
        { ...details, category }
    );
}

export function normalizeProviderThrownError(error, provider = "AI provider") {
    if (error instanceof CCMProviderError) return error;
    const message = text(error?.message);
    if (/fetch failed|failed to fetch|networkerror|network request|connection (?:refused|reset)|econnrefused|enotfound/i.test(message)) {
        return new CCMProviderError(`${provider}: ${CATEGORY_MESSAGES.network}`, {
            provider,
            category: "network",
            type: error?.name || "NetworkError",
            retryable: true
        }, { cause: error });
    }
    const category = classifyProviderError({
        status: error?.status,
        code: error?.code,
        type: error?.errorType || error?.name,
        finishReason: error?.finishReason,
        message
    });
    if (category !== "unknown") {
        const normalized = new CCMProviderError(`${provider}: ${CATEGORY_MESSAGES[category]}`, {
            provider,
            category,
            status: error?.status,
            code: error?.code,
            type: error?.errorType || error?.name,
            finishReason: error?.finishReason,
            retryable: error?.retryable === true,
            debugRawOutput: error?.debugRawOutput ?? error?.aiOutput
        }, { cause: error });
        if (error?.retryableAIOutput === true) normalized.retryableAIOutput = true;
        return normalized;
    }
    return error;
}

export function getSafeErrorMessage(error, fallback = "The operation failed.") {
    if (!error) return fallback;
    const category = error.category || classifyProviderError({
        status: error.status,
        code: error.code,
        type: error.errorType || error.name,
        finishReason: error.finishReason,
        message: error.message
    });
    if (category === "unknown" && !(error instanceof CCMProviderError)) return fallback;
    const provider = text(error.provider);
    const prefix = provider ? `${provider}: ` : "";
    const retry = error.retryAfterSeconds ? ` Try again in about ${error.retryAfterSeconds} seconds.` : "";
    return `${prefix}${CATEGORY_MESSAGES[category] || CATEGORY_MESSAGES.unknown}${retry}`;
}

export function createSafeErrorReport(error, context = "CCM operation") {
    const category = error?.category || classifyProviderError({
        status: error?.status,
        code: error?.code,
        type: error?.errorType || error?.name,
        finishReason: error?.finishReason,
        message: error?.message
    });
    return JSON.stringify({
        notice: "Privacy-safe CCM error details. Prompts, AI output, chat content, character names, endpoints, headers and API keys are excluded.",
        context,
        time: new Date().toISOString(),
        provider: text(error?.provider) || "Unknown",
        category,
        httpStatus: Number(error?.status) || null,
        code: text(error?.code) || null,
        errorType: text(error?.errorType || error?.name) || "Error",
        finishReason: text(error?.finishReason) || null,
        retryable: error?.retryable === true,
        retryAfterSeconds: Number(error?.retryAfterSeconds) || null,
        requestId: text(error?.requestId) || null
    }, null, 2);
}
