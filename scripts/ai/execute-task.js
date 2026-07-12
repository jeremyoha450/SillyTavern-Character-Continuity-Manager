import { getCurrentDriver } from "./registry.js";
import { getAISource, getDriverSettings } from "./settings.js";
import { executeWithSillyTavern } from "./sillytavern.js";
import { recordUsage } from "../usage.js";
import {
    debugAIContent,
    debugLog,
    isDebugEnabled
} from "../debug-logger.js";
import { normalizeProviderThrownError } from "../provider-error.js";
import { maybeRecordTrainingExample } from "../training-data.js";

const CORRECTIVE_PROMPT = "Your previous response was invalid or incomplete. Return ONLY valid JSON matching the required schema. Do not explain. Do not use markdown.";
const RETRYABLE_TASKS = new Set([
    "facts",
    "state",
    "knowledge",
    "knowledge-update",
    "image-prompt",
    "character-cast-plan",
    "character-card",
    "character-card-field"
]);

function taskCategory(taskId) {
    if (taskId === "facts") return "facts";
    if (taskId === "state") return "state";
    if (String(taskId).startsWith("knowledge")) return "knowledge";
    if (taskId === "image-prompt") return "images";
    if (String(taskId).startsWith("character-")) return "creator";
    return "ai";
}

function rawOutput(error) {
    return error?.debugRawOutput ?? error?.aiOutput;
}

export function isRetryableAIOutputError(task, error) {
    if (!RETRYABLE_TASKS.has(task?.id)) return false;
    if (error?.retryableAIOutput === true || rawOutput(error) !== undefined) {
        return true;
    }
    return /invalid|not valid|incomplete|malformed|truncat|output limit|required (?:field|key)|missing (?:field|name|description)|empty (?:field|image prompt)|no message content|did not contain/i
        .test(String(error?.message || ""));
}

export function buildCorrectiveRetryTask(task, previousOutput = "") {
    const previous = String(previousOutput || "").slice(0, 50000);
    return {
        ...task,
        temperature: 0,
        buildMessages(input) {
            return [
                ...task.buildMessages(input),
                ...(previous ? [{ role: "assistant", content: previous }] : []),
                { role: "user", content: CORRECTIVE_PROMPT }
            ];
        }
    };
}

function finalRetryError(task, error) {
    const result = new Error(
        `${task.name || task.id} failed after one corrective retry: ${error?.message || "The AI response was still invalid or incomplete."}`,
        { cause: error }
    );
    result.name = "AIRetryError";
    for (const key of [
        "provider", "category", "status", "code", "errorType",
        "finishReason", "retryable", "retryAfterSeconds", "requestId"
    ]) {
        if (error?.[key] !== undefined) result[key] = error[key];
    }
    const output = rawOutput(error);
    if (output !== undefined) {
        result.debugRawOutput = output;
        result.aiOutput = output;
    }
    return result;
}

export async function executeTask(task, input, metadata = {}, options = {}) {
    const startedAt = performance.now();
    const category = taskCategory(task.id);
    const source = options.source || getAISource();
    const maxRetries = Math.min(1, Math.max(0,
        options.maxRetries === undefined ? 1 : Number(options.maxRetries) || 0
    ));
    const contentCategory = isDebugEnabled(category) ? category : "ai";
    let lastInputMessages = [];

    const modelFor = (provider, response = {}) => response?.model || (
        provider?.id === "sillytavern"
            ? ""
            : getDriverSettings().model
    ) || "";

    const errorDetails = error => error
        ? {
            name: error.name || "Error",
            message: error.message || "Unknown error",
            provider: error.provider || "",
            category: error.category || "",
            status: Number(error.status) || 0,
            code: error.code || "",
            errorType: error.errorType || "",
            finishReason: error.finishReason || "",
            retryable: error.retryable === true,
            retryAfterSeconds: Number(error.retryAfterSeconds) || 0,
            requestId: error.requestId || ""
        }
        : null;

    const recordTraining = ({
        provider,
        response,
        result,
        error,
        attempt,
        parseSuccess
    }) => maybeRecordTrainingExample({
        taskId: task.id,
        source,
        provider: provider?.id || provider?.name || error?.provider || source,
        model: modelFor(provider, response),
        characterId: metadata.characterId || metadata.id || "",
        scope: metadata.scope || metadata.contextScope || "",
        group: metadata.group || metadata.groupId || "",
        inputMessages: lastInputMessages,
        rawAIResponse: response?.debugRawOutput ?? rawOutput(error) ?? "",
        parsedOutput: parseSuccess ? result : null,
        parseSuccess,
        retryCount: Math.max(0, Number(attempt) || 0),
        errorDetails: errorDetails(error),
        userCorrectionStatus: "unknown"
    });

    const log = (event, details = {}) => {
        const safe = {
            task: task.id,
            source,
            durationMs: Math.round(performance.now() - startedAt),
            ...details
        };
        debugLog(category, event, safe);
        if (category !== "ai") debugLog("ai", event, safe);
    };

    const executeOnce = async attemptTask => {
        if (source === "sillytavern") {
            try {
                return {
                    response: await executeWithSillyTavern(attemptTask, input),
                    provider: { id: "sillytavern", name: "SillyTavern Active Model" }
                };
            } catch (error) {
                throw normalizeProviderThrownError(error, "SillyTavern Active Model");
            }
        }

        const driver = getCurrentDriver();
        if (!driver) throw new Error("No AI driver selected.");
        try {
            return {
                response: await driver.sendRequest(attemptTask, getDriverSettings(), input),
                provider: driver
            };
        } catch (error) {
            throw normalizeProviderThrownError(error, driver.name);
        }
    };

    log("task.started", { status: "started", attempt: 1 });
    let attemptTask = task;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        lastInputMessages = attemptTask.buildMessages(input);
        debugAIContent(contentCategory, attempt ? "ai.retry-input" : "ai.input", {
            input: lastInputMessages
        });

        try {
            const { response, provider } = await executeOnce(attemptTask);
            const wrapped = response && typeof response === "object" && "result" in response;
            const result = wrapped ? response.result : response;

            if (wrapped) {
                recordUsage({
                    usage: response.usage || {},
                    task,
                    provider,
                    model: response.model || (provider.id === "sillytavern"
                        ? ""
                        : getDriverSettings().model),
                    metadata
                });
            }

            recordTraining({
                provider,
                response,
                result,
                attempt,
                parseSuccess: true
            });

            debugAIContent(contentCategory, attempt ? "ai.retry-output" : "ai.output", {
                output: response?.debugRawOutput ?? result
            });
            if (attempt) {
                log("retry.succeeded", {
                    status: "success",
                    provider: provider.id,
                    attempt: attempt + 1
                });
            }
            log("task.completed", {
                status: "success",
                provider: provider.id,
                attempt: attempt + 1,
                inputTokens: Number(response?.usage?.inputTokens) || 0,
                outputTokens: Number(response?.usage?.outputTokens) || 0,
                totalTokens: Number(response?.usage?.totalTokens) || 0
            });
            return result;
        } catch (error) {
            const output = rawOutput(error);
            if (output !== undefined) {
                debugAIContent(contentCategory, attempt ? "ai.retry-output.failed" : "ai.output.failed", {
                    output
                });
            }

            if (attempt < maxRetries && isRetryableAIOutputError(task, error)) {
                log("retry.started", {
                    status: "retrying",
                    errorType: error?.name || "Error",
                    attempt: attempt + 2
                });
                attemptTask = buildCorrectiveRetryTask(task, output || "");
                continue;
            }

            const finalError = attempt > 0 ? finalRetryError(task, error) : error;
            recordTraining({
                provider: { id: finalError?.provider || source, name: finalError?.provider || source },
                response: null,
                result: null,
                error: finalError,
                attempt,
                parseSuccess: false
            });
            log(attempt > 0 ? "retry.failed" : "task.failed", {
                status: "failed",
                errorType: finalError?.name || "Error",
                errorCategory: finalError?.category || "unknown",
                errorCode: finalError?.code || "",
                httpStatus: Number(finalError?.status) || 0,
                retryable: finalError?.retryable === true,
                attempt: attempt + 1
            });
            throw finalError;
        }
    }
}
