const NAMESPACE = "characterContinuityManager";
const FALLBACK_KEY = "ccm-training-data-v1";

const COLLECTED_TASKS = new Set([
    "facts",
    "state",
    "knowledge",
    "knowledge-update",
    "image-prompt",
    "character-cast-plan",
    "character-card",
    "character-card-field"
]);

const DEFAULT_SETTINGS = Object.freeze({
    enabled: false,
    maxRecords: 100
});

let memoryStore = null;

function getContext() {
    return globalThis.SillyTavern?.getContext?.();
}

function getServerStore() {
    const context = getContext();
    const extensionSettings =
        context?.extensionSettings ||
        context?.extension_settings;

    if (!extensionSettings) return null;
    if (!extensionSettings[NAMESPACE] || typeof extensionSettings[NAMESPACE] !== "object") {
        extensionSettings[NAMESPACE] = {};
    }
    return extensionSettings[NAMESPACE];
}

function saveServerStore() {
    const save = getContext()?.saveSettingsDebounced;
    if (typeof save !== "function") return false;
    save();
    return true;
}

function storage() {
    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
}

function readFallback() {
    try {
        const value = storage()?.getItem(FALLBACK_KEY);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function writeFallback(value) {
    try {
        storage()?.setItem(FALLBACK_KEY, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

function normalizeSettings(value = {}) {
    return {
        enabled: value.enabled === true,
        maxRecords: Math.min(2000, Math.max(10, Number(value.maxRecords) || 100))
    };
}

function normalizeStore(value = {}) {
    return {
        settings: normalizeSettings(value.settings),
        records: Array.isArray(value.records) ? value.records : []
    };
}

function readStore() {
    const server = getServerStore();
    if (server?.trainingData) {
        memoryStore = normalizeStore(server.trainingData);
        return structuredClone(memoryStore);
    }

    const fallback = readFallback();
    memoryStore = normalizeStore(fallback || memoryStore || {});

    if (server) {
        server.trainingData = structuredClone(memoryStore);
        saveServerStore();
    }

    return structuredClone(memoryStore);
}

function writeStore(store) {
    memoryStore = normalizeStore(store);
    const server = getServerStore();
    if (server) {
        server.trainingData = structuredClone(memoryStore);
        if (saveServerStore()) return true;
    }
    return writeFallback(memoryStore);
}

function redactSensitiveText(value) {
    return String(value ?? "")
        .replace(/(["']?authorization["']?\s*:\s*["'])[^"']+(["'])/gi, "$1[REDACTED]$2")
        .replace(/(["']?(?:api[_-]?key|authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret|headers?)["']?\s*[:=]\s*["']?)[^"'\s,}\]]+/gi, "$1[REDACTED]")
        .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]")
        .replace(/\b(?:sk|pk)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_KEY]")
        .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_KEY]")
        .replace(/([?&](?:key|token|api_key|access_token)=)[^&#\s]+/gi, "$1[REDACTED]");
}

function sanitize(value, depth = 0) {
    if (depth > 8) return "[Max depth reached]";
    if (value === null || value === undefined) return value;
    if (typeof value === "string") return redactSensitiveText(value);
    if (["number", "boolean"].includes(typeof value)) return value;
    if (Array.isArray(value)) return value.map(item => sanitize(item, depth + 1));
    if (typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => !/api[_-]?key|authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret|headers?/i.test(key))
                .map(([key, item]) => [key, sanitize(item, depth + 1)])
        );
    }
    return String(value);
}

function createId() {
    const random =
        globalThis.crypto?.randomUUID?.() ||
        `training-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return String(random);
}

export function getTrainingDataSettings() {
    return readStore().settings;
}

export function setTrainingDataSettings(value) {
    const store = readStore();
    store.settings = normalizeSettings(value);
    store.records = store.records.slice(0, store.settings.maxRecords);
    writeStore(store);
    return getTrainingDataSettings();
}

export function getTrainingDataRecords() {
    return readStore().records;
}

export function getTrainingDataCount() {
    return getTrainingDataRecords().length;
}

export function clearTrainingData() {
    const store = readStore();
    store.records = [];
    writeStore(store);
}

export function maybeRecordTrainingExample(example = {}) {
    const store = readStore();
    if (!store.settings.enabled || !COLLECTED_TASKS.has(example.taskId)) {
        return null;
    }

    const record = {
        id: createId(),
        timestamp: new Date().toISOString(),
        taskId: String(example.taskId || ""),
        provider: sanitize(example.provider || ""),
        source: sanitize(example.source || ""),
        model: sanitize(example.model || ""),
        characterId: sanitize(example.characterId || ""),
        scope: sanitize(example.scope || null),
        group: sanitize(example.group || null),
        inputMessages: sanitize(example.inputMessages || []),
        rawAIResponse: sanitize(example.rawAIResponse ?? ""),
        parsedOutput: sanitize(example.parsedOutput ?? null),
        parseSuccess: example.parseSuccess === true,
        retryCount: Math.max(0, Number(example.retryCount) || 0),
        errorDetails: sanitize(example.errorDetails || null),
        userCorrectionStatus: sanitize(example.userCorrectionStatus || "unknown")
    };

    store.records = [record, ...store.records].slice(0, store.settings.maxRecords);
    writeStore(store);
    return structuredClone(record);
}

export function createTrainingDataExport() {
    const store = readStore();
    return JSON.stringify({
        format: "ccm-training-data-v1",
        exportedAt: new Date().toISOString(),
        notice: "Opt-in CCM training data export. Records may include private character, scenario, and chat content. Recognizable credentials are redacted, but review before sharing.",
        settings: store.settings,
        count: store.records.length,
        records: store.records
    }, null, 2);
}
