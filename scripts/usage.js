// scripts/usage.js

import {
    getDatabase,
    saveDatabase
} from "./database.js";

import { debugLog } from "./debug-logger.js";

function emptyTotals() {
    return {
        requests: 0,
        reportedRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
    };
}

function emptyUsage() {
    return {
        version: 1,
        totals: emptyTotals(),
        byCharacter: {},
        byTask: {},
        byProvider: {},
        byModel: {},
        recent: []
    };
}

const sessionUsage =
    emptyUsage();

function ensureUsage(target) {

    target.usage =
        target.usage || emptyUsage();

    target.usage.totals =
        target.usage.totals || emptyTotals();
    target.usage.byCharacter =
        target.usage.byCharacter || {};
    target.usage.byTask =
        target.usage.byTask || {};
    target.usage.byProvider =
        target.usage.byProvider || {};
    target.usage.byModel =
        target.usage.byModel || {};
    target.usage.recent =
        target.usage.recent || [];

    return target.usage;
}

function addToTotals(
    totals,
    entry
) {

    totals.requests =
        (totals.requests || 0) + 1;

    if (entry.reported) {
        totals.reportedRequests =
            (totals.reportedRequests || 0) + 1;
        totals.inputTokens =
            (totals.inputTokens || 0) +
            entry.inputTokens;
        totals.outputTokens =
            (totals.outputTokens || 0) +
            entry.outputTokens;
        totals.totalTokens =
            (totals.totalTokens || 0) +
            entry.totalTokens;
    }
}

function addEntry(
    usage,
    entry
) {

    addToTotals(
        usage.totals,
        entry
    );

    const groups = [
        [usage.byTask, entry.taskId],
        [usage.byProvider, entry.providerId],
        [usage.byModel, entry.model]
    ];

    for (const [group, key] of groups) {
        if (!key) continue;
        group[key] =
            group[key] || emptyTotals();
        addToTotals(group[key], entry);
    }

    if (entry.characterId) {
        const character =
            usage.byCharacter[entry.characterId] || {
                name: entry.characterName || "",
                totals: emptyTotals(),
                byTask: {},
                byProvider: {},
                byModel: {}
            };

        character.totals =
            character.totals || emptyTotals();
        character.byTask =
            character.byTask || {};
        character.byProvider =
            character.byProvider || {};
        character.byModel =
            character.byModel || {};

        character.name =
            entry.characterName || character.name;
        addToTotals(character.totals, entry);

        character.byTask[entry.taskId] =
            character.byTask[entry.taskId] ||
            emptyTotals();
        addToTotals(
            character.byTask[entry.taskId],
            entry
        );

        character.byProvider[entry.providerId] =
            character.byProvider[entry.providerId] ||
            emptyTotals();
        addToTotals(
            character.byProvider[entry.providerId],
            entry
        );

        if (entry.model) {
            character.byModel[entry.model] =
                character.byModel[entry.model] ||
                emptyTotals();
            addToTotals(
                character.byModel[entry.model],
                entry
            );
        }

        usage.byCharacter[entry.characterId] =
            character;
    }

    usage.recent.unshift(entry);
    usage.recent =
        usage.recent.slice(0, 100);
}

function normalizeCount(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0
        ? Math.round(number)
        : null;
}

export function recordUsage({
    usage,
    task,
    provider,
    model,
    metadata = {}
}) {

    const inputTokens =
        normalizeCount(usage?.inputTokens);
    const outputTokens =
        normalizeCount(usage?.outputTokens);
    const suppliedTotal =
        normalizeCount(usage?.totalTokens);

    const reported =
        inputTokens !== null ||
        outputTokens !== null ||
        suppliedTotal !== null;

    const entry = {
        id:
            "usage_" + Date.now() + "_" +
            Math.random().toString(36).slice(2, 8),
        timestamp: Date.now(),
        characterId:
            metadata.characterId || "",
        characterName:
            metadata.characterName || "",
        taskId: task.id,
        taskName: task.name,
        providerId: provider.id,
        providerName: provider.name,
        model: model || "",
        reported,
        inputTokens: inputTokens ?? 0,
        outputTokens: outputTokens ?? 0,
        totalTokens:
            suppliedTotal ??
            ((inputTokens ?? 0) +
            (outputTokens ?? 0))
    };

    const database =
        getDatabase();

    addEntry(
        ensureUsage(database),
        entry
    );

    addEntry(
        sessionUsage,
        entry
    );

    debugLog("stats", "usage.recorded", {
        task: task.id,
        provider: provider.id,
        reported,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        totalTokens: entry.totalTokens,
        status: "success"
    });

    saveDatabase();
}

export function getUsageStats(
    characterId = ""
) {
    const usage =
        ensureUsage(getDatabase());

    const character =
        characterId
            ? usage.byCharacter[characterId]
            : null;

    return {
        lifetime:
            characterId
                ? usage.byCharacter[characterId]?.totals || emptyTotals()
                : usage.totals,
        session:
            characterId
                ? sessionUsage.byCharacter[characterId]?.totals || emptyTotals()
                : sessionUsage.totals,
        byTask:
            characterId
                ? character?.byTask || {}
                : usage.byTask,
        byProvider:
            characterId
                ? character?.byProvider || {}
                : usage.byProvider,
        byModel:
            characterId
                ? character?.byModel || {}
                : usage.byModel,
        recent:
            usage.recent.filter(entry =>
                !characterId ||
                entry.characterId === characterId
            )
    };
}

export function clearUsage(
    characterId = ""
) {

    const database =
        getDatabase();
    const usage =
        ensureUsage(database);

    if (!characterId) {
        database.usage = emptyUsage();
        Object.assign(
            sessionUsage,
            emptyUsage()
        );
        saveDatabase();
        return;
    }

    removeCharacterFromUsage(
        usage,
        characterId
    );

    removeCharacterFromUsage(
        sessionUsage,
        characterId
    );

    saveDatabase();
}

function subtractTotals(
    target,
    removed
) {
    for (const key of [
        "requests",
        "reportedRequests",
        "inputTokens",
        "outputTokens",
        "totalTokens"
    ]) {
        target[key] = Math.max(
            0,
            (target[key] || 0) -
            (removed[key] || 0)
        );
    }
}

export function removeCharacterFromUsage(
    usage,
    characterId
) {

    const character =
        usage?.byCharacter?.[characterId];

    if (!character) return;

    subtractTotals(
        usage.totals,
        character.totals
    );

    for (
        const [taskId, totals]
        of Object.entries(character.byTask || {})
    ) {
        if (usage.byTask[taskId]) {
            subtractTotals(
                usage.byTask[taskId],
                totals
            );
            if (!usage.byTask[taskId].requests) {
                delete usage.byTask[taskId];
            }
        }
    }

    for (
        const [providerId, totals]
        of Object.entries(character.byProvider || {})
    ) {
        if (usage.byProvider[providerId]) {
            subtractTotals(
                usage.byProvider[providerId],
                totals
            );
            if (!usage.byProvider[providerId].requests) {
                delete usage.byProvider[providerId];
            }
        }
    }

    for (
        const [model, totals]
        of Object.entries(character.byModel || {})
    ) {
        if (usage.byModel[model]) {
            subtractTotals(
                usage.byModel[model],
                totals
            );
            if (!usage.byModel[model].requests) {
                delete usage.byModel[model];
            }
        }
    }

    usage.recent =
        (usage.recent || []).filter(
            entry =>
                entry.characterId !== characterId
        );

    delete usage.byCharacter[characterId];
}

document.addEventListener(
    "ccm-character-deleted",
    event => {
        removeCharacterFromUsage(
            sessionUsage,
            event.detail?.characterId
        );
    }
);
