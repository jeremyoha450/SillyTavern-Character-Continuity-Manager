import { CCMProviderError } from "../provider-error.js";

export const DEFAULT_PROVIDER_TIMEOUT_MS = 300_000;

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS) {
    const controller = new AbortController();
    const externalSignal = options.signal;
    const onAbort = () => controller.abort(externalSignal?.reason);
    externalSignal?.addEventListener?.("abort", onAbort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, Math.max(1, Number(timeoutMs) || DEFAULT_PROVIDER_TIMEOUT_MS));

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
        if (timedOut) {
            throw new CCMProviderError("AI provider: The request timed out.", {
                category: "timeout",
                type: "TimeoutError",
                retryable: true
            }, { cause: error });
        }
        if (externalSignal?.aborted) {
            throw new CCMProviderError("AI provider: The request was cancelled.", {
                category: "cancelled",
                type: "AbortError",
                retryable: false
            }, { cause: error });
        }
        throw error;
    } finally {
        clearTimeout(timer);
        externalSignal?.removeEventListener?.("abort", onAbort);
    }
}
