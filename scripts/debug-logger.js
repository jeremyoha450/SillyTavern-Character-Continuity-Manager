const SETTINGS_KEY = "ccm-debug-settings-v1";
const LOG_KEY = "ccm-debug-log-v1";

export const DEBUG_CATEGORIES = Object.freeze([
    ["ai", "AI / Providers"],
    ["creator", "Character Creator"],
    ["facts", "Facts"],
    ["state", "State"],
    ["knowledge", "Knowledge"],
    ["images", "Images"],
    ["storage", "Database / Storage"],
    ["dashboard", "Dashboard / Groups"],
    ["stats", "Statistics"],
    ["ui", "General UI"]
]);

const DEFAULT_SETTINGS = Object.freeze({
    enabled: false,
    categories: [],
    allCategories: false,
    includeAIContent: false,
    mirrorToConsole: false,
    developerMode: false,
    maxEntries: 250
});

// Only these structured fields may enter the log. Deliberately excluded:
// prompts, responses, names, IDs, chat text, URLs, settings and credentials.
const SAFE_DETAIL_KEYS = new Set([
    "task", "source", "provider", "operation", "status", "stage",
    "preset", "count", "durationMs", "inputTokens", "outputTokens",
    "totalTokens", "reported", "errorType", "errorCategory", "errorCode",
    "httpStatus", "retryable", "finishReason", "attempt"
]);

let memorySettings = null;
let memoryEntries = [];

function storage() {
    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
}

function readJson(key, fallback) {
    try {
        const value = storage()?.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        const target = storage();
        if (!target) return false;
        target.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

function normalizeSettings(value = {}) {
    const validCategories = new Set(DEBUG_CATEGORIES.map(([id]) => id));
    return {
        enabled: value.enabled === true,
        categories: Array.isArray(value.categories)
            ? [...new Set(value.categories.filter(id => validCategories.has(id)))]
            : [],
        allCategories: value.allCategories === true,
        includeAIContent: value.includeAIContent === true,
        mirrorToConsole: value.mirrorToConsole === true,
        developerMode: value.developerMode === true,
        maxEntries: Math.min(1000, Math.max(50, Number(value.maxEntries) || 250))
    };
}

export function getDebugSettings() {
    const loaded = readJson(SETTINGS_KEY, memorySettings || DEFAULT_SETTINGS);
    memorySettings = normalizeSettings(loaded);
    return structuredClone(memorySettings);
}

export function setDebugSettings(value) {
    memorySettings = normalizeSettings(value);
    writeJson(SETTINGS_KEY, memorySettings);
    const entries = getDebugEntries().slice(0, memorySettings.maxEntries);
    memoryEntries = entries;
    writeJson(LOG_KEY, entries);
    return getDebugSettings();
}

export function isDebugEnabled(category) {
    const settings = getDebugSettings();
    return settings.enabled && (
        settings.allCategories || settings.categories.includes(category)
    );
}

export function isDeveloperMode() {
    return getDebugSettings().developerMode === true;
}

function safeDetails(details) {
    if (!details || typeof details !== "object") return {};
    return Object.fromEntries(
        Object.entries(details)
            .filter(([key, value]) =>
                SAFE_DETAIL_KEYS.has(key) &&
                ["string", "number", "boolean"].includes(typeof value)
            )
            .map(([key, value]) => [
                key,
                typeof value === "string" ? value.slice(0, 120) : value
            ])
    );
}

export function getDebugEntries() {
    const loaded = readJson(LOG_KEY, memoryEntries);
    memoryEntries = Array.isArray(loaded) ? loaded : [];
    return structuredClone(memoryEntries);
}

export function debugLog(category, event, details = {}) {
    if (!isDebugEnabled(category)) return null;
    const settings = getDebugSettings();
    const entry = {
        time: new Date().toISOString(),
        category,
        event: String(event || "event").slice(0, 100),
        details: safeDetails(details)
    };
    const entries = [entry, ...getDebugEntries()].slice(0, settings.maxEntries);
    memoryEntries = entries;
    writeJson(LOG_KEY, entries);
    if (settings.mirrorToConsole) console.debug("[CCM Debug]", entry);
    return structuredClone(entry);
}

function redactSensitiveText(value) {
    let text;
    try {
        text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    } catch {
        text = "[Unserializable content]";
    }
    return String(text || "")
        .replace(/(["']?(?:api[_-]?key|authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret)["']?\s*[:=]\s*["']?)[^"'\s,}\]]+/gi, "$1[REDACTED]")
        .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]")
        .replace(/\b(?:sk|pk)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_KEY]")
        .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_KEY]")
        .replace(/([?&](?:key|token|api_key|access_token)=)[^&#\s]+/gi, "$1[REDACTED]");
}

function limitContent(value) {
    const text = redactSensitiveText(value);
    const limit = 20000;
    return text.length > limit
        ? `${text.slice(0, limit)}\n[TRUNCATED: ${text.length - limit} characters omitted]`
        : text;
}

export function debugAIContent(category, event, { input, output } = {}) {
    const settings = getDebugSettings();
    if (!isDebugEnabled(category) || !settings.includeAIContent) return null;
    const entry = {
        time: new Date().toISOString(),
        category,
        event: String(event || "ai-content").slice(0, 100),
        details: { status: "captured" },
        content: {
            ...(input !== undefined ? { input: limitContent(input) } : {}),
            ...(output !== undefined ? { output: limitContent(output) } : {})
        }
    };
    const entries = [entry, ...getDebugEntries()].slice(0, settings.maxEntries);
    memoryEntries = entries;
    writeJson(LOG_KEY, entries);
    if (settings.mirrorToConsole) console.debug("[CCM Debug AI Content]", entry);
    return structuredClone(entry);
}

export function clearDebugEntries() {
    memoryEntries = [];
    writeJson(LOG_KEY, []);
}

export function createDebugReport() {
    const settings = getDebugSettings();
    return JSON.stringify({
        notice: settings.includeAIContent
            ? "CCM local diagnostic log. Optional AI input/output capture is enabled and may contain private character or chat content. Recognizable credentials are redacted."
            : "CCM local diagnostic log. AI inputs/outputs, character/chat content and credentials are not recorded.",
        exportedAt: new Date().toISOString(),
        settings,
        entries: getDebugEntries()
    }, null, 2);
}
