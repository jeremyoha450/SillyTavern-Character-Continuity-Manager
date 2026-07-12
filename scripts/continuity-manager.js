// scripts/continuity-manager.js

import {
    eventSource,
    event_types
} from "../../../../../script.js";

import {
    findCharacterForCard,
    getCharacter,
    getScopedCharacter,
    createCharacter,
    addCharacter,
    syncGroupContext,
    updateScopedCharacter,
    updateCharacter
} from "./database.js";

import {
    execute
} from "./ai/index.js";

import {
    extractKnowledge,
    extractState
} from "./providers/provider-manager.js";

import {
    mergeData
} from "./merge/merge-data.js";

import {
    updateCharacterStateData
} from "./state/update-state.js";

import {
    updateCharacterKnowledge
} from "./knowledge/update-knowledge.js";

import {
    renderCharacterList,
    renderCharacterDashboard,
    renderGroupDashboard,
    openDashboard
} from "./ui.js";
import { getSafeErrorMessage } from "./provider-error.js";

import {
    showCCMStatus,
    showCCMSuccess,
    showCCMError,
	showCCMToast
} from "./ui/status.js";

import {
    clearUsage
} from "./usage.js";

import {
    generateHash
} from "./hash.js";

import {
    postProcessFacts,
    postProcessState,
    enforceConsistency
} from "./extraction/post-process.js";

import {
    getHeightConfig
} from "./config/height-defaults.js";

import {
    formatChatMessages,
    getContextCharacters,
    getFirstCharacterMessage,
    getRelevantContextCharacters,
    targetCharacterConversation
} from "./group-context.js";
import { automationScopeKey } from "./automation-scope.js";


let autoStateCounter = {};

let autoKnowledgeCounter = {};

const autoUpdateInFlight = new Set();
let contextSyncInFlight = false;
let contextSyncPending = false;

export function initializeContinuityManager() {


    eventSource.on(
        event_types.CHAT_LOADED,
		
        requestContextSync
    );
	
	eventSource.on(
        event_types.CHAT_CHANGED,
        requestContextSync
    );
	
	if (event_types.GENERATION_ENDED) {

		eventSource.on(
			event_types.GENERATION_ENDED,
			(...args) => {

				const options =
					args[1];

				if (options?.dryRun) {
					return;
				}

				onAutoStateUpdate();
			}
		);

	}

	
}

async function requestContextSync() {
    contextSyncPending = true;

    if (contextSyncInFlight) return;

    contextSyncInFlight = true;

    try {
        while (contextSyncPending) {
            contextSyncPending = false;
            await onChatLoaded();
        }
    } finally {
        contextSyncInFlight = false;
    }
}

async function onChatLoaded() {

    const context =
        SillyTavern.getContext();

    const cards =
        getContextCharacters(context);

    if (!cards.length) {

        const panel =
            document.getElementById(
                "ccm-panel"
            );

        if (
            panel &&
            getComputedStyle(panel).display !== "none"
        ) {
            renderCharacterList();
        }

        return;
    }

    const records = [];
    let createdCount = 0;

    for (const card of cards) {

        let record =
            findCharacterForCard(card);

        if (record) {

            const updates = {};

            if (record.avatar !== card.avatar) {
                updates.avatar = card.avatar || "";
            }

            if (record.name !== card.name) {
                updates.name = card.name;
            }

            if (Object.keys(updates).length) {
                updateCharacter(
                    record.id,
                    updates
                );
                record =
                    getCharacter(record.id);
            }

        } else {

            record =
                await createCharacterFromCard(
                    context,
                    card
                );

            if (record) {
                createdCount++;
            }

        }

        if (record) {
            records.push(record);
        }
    }

    if (context.groupId) {

        const groups = Array.isArray(context.groups)
            ? context.groups
            : Object.values(context.groups || {});

        const group =
            groups.find(item =>
                String(item.id) === String(context.groupId)
            ) || {
                id: context.groupId,
                name: "Group"
            };

        syncGroupContext(
            group,
            records
        );

        if (createdCount) {
            showCCMSuccess(
                createdCount === 1
                    ? "Group character added to CCM"
                    : `${createdCount} group characters added to CCM`
            );
            openDashboard();
        }

        renderGroupDashboard(
            context.groupId
        );
        return;
    }

    const record = records[0];

    if (!record) return;

    if (createdCount) {
        showCCMSuccess(
            "Character added to CCM"
        );
        openDashboard();
        renderCharacterDashboard(
            record.id
        );
        return;
    }

    const panel =
        document.getElementById(
            "ccm-panel"
        );

    if (
        panel &&
        getComputedStyle(panel).display !== "none"
    ) {
        renderCharacterDashboard(
            record.id
        );
    } else {
        renderCharacterList();
    }
}

async function createCharacterFromCard(
    context,
    card
) {

    const characterName =
        card?.name;

    if (!characterName) return null;

    showCCMStatus(`
        <div style="font-size:52px;">
            ⏳
        </div>

        <br>

        Adding ${escapeStatusText(characterName)} to CCM...

        <br><br>

        Please wait...
    `);

    const knowledgeText = [
        card.data?.description,
        card.data?.personality
    ]
        .filter(Boolean)
        .join("\n\n");

    const characterNote =
        card.data
            ?.extensions
            ?.depth_prompt
            ?.prompt ||
        card.data?.character_note ||
        card.character_note ||
        "";

    const firstChatMessage =
        getFirstCharacterMessage(
            context.chat,
            card
        ) ||
        (
            !context.groupId
                ? context.chat?.find(
                    message =>
                        !message.is_user &&
                        typeof message.mes === "string" &&
                        message.mes.trim()
                )?.mes
                : ""
        ) ||
        card.data?.first_mes ||
        card.first_mes ||
        "";

    const initialStateText = [
        card.data?.description
            ? `Character Description:\n${card.data.description}`
            : "",

        characterNote
            ? `Character Note:\n${characterNote}`
            : "",

        card.data?.personality
            ? `Personality Summary:\n${card.data.personality}`
            : "",

        firstChatMessage
            ? `First Chat Message:\n${characterName}:\n${firstChatMessage}`
            : ""
    ]
        .filter(Boolean)
        .join("\n\n");

    const newCharacter =
        createCharacter(characterName);

    newCharacter.avatar =
        card.avatar || "";

    let facts;
    let knowledge = [];
    let initialState = null;

    try {

        facts =
            postProcessFacts(
                await execute(
                    "facts",
                    card.data?.description || "",
                    {
                        characterId:
                            newCharacter.id,
                        characterName
                    }
                ),
                {
                    characterId:
                        newCharacter.id,
                    heightConfig:
                        getHeightConfig()
                }
            );

        knowledge =
            await extractKnowledge(
                knowledgeText,
                {
                    characterId:
                        newCharacter.id,
                    characterName
                }
            );

        if (initialStateText.trim()) {

            initialState =
                await extractState(
                    targetCharacterConversation(
                        newCharacter,
                        `CREATION STATE SOURCES

Use the First Chat Message as the highest-priority source for current state when sources conflict.

${initialStateText}`
                    ),
                    {
                        characterId:
                            newCharacter.id,
                        characterName
                    }
                );
        }

    } catch (error) {

        clearUsage(
            newCharacter.id
        );

        console.error(
            "[CCM] Failed to create character record",
            error
        );

        showCCMError(
            `Failed to add ${characterName} to CCM.`,
            error,
            "Initial character extraction"
        );

        return null;
    }

    const mergedFacts =
        mergeData(
            newCharacter.facts,
            facts,
            newCharacter.locks
        );

    if (
        mergedFacts.data
            ?.characterName
            ?.value
    ) {
        newCharacter.locks.characterName =
            true;
    }

    const mergedInitialState =
        initialState
            ? mergeData(
                mergedFacts.data,
                postProcessState(
                    initialState,
                    {
                        gender:
                            mergedFacts.data
                                .gender?.value,
                        previousFacts:
                            mergedFacts.data
                    }
                ),
                newCharacter.locks
            )
            : {
                data: mergedFacts.data
            };

    newCharacter.facts =
        enforceConsistency(
            mergedInitialState.data
        );

    newCharacter.knowledge =
        knowledge.map(
            item => ({
                id:
                    "knowledge_" +
                    Date.now() +
                    "_" +
                    Math.random()
                        .toString(36)
                        .slice(2, 8),

                text:
                    item.text,

                confidence:
                    item.confidence,

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()
            })
        );

    addCharacter(
        newCharacter
    );

    return newCharacter;
}

function escapeStatusText(value) {
    const element =
        document.createElement("div");

    element.textContent =
        String(value ?? "");

    return element.innerHTML;
}

async function onAutoStateUpdate() {

    const context =
        SillyTavern.getContext();

    if (!context.chat?.length) {
        return;
    }

    const lastMessage =
        context.chat[
            context.chat.length - 1
        ];

    if (
        lastMessage.is_user ||
        lastMessage.is_system
    ) {
        return;
    }

    const cards =
        getRelevantContextCharacters(
            context,
            [lastMessage]
        );

    for (const card of cards) {

        const baseCharacter =
            findCharacterForCard(card);

        if (!baseCharacter) continue;

        const character =
            getScopedCharacter(
                baseCharacter.id,
                context.groupId || ""
            );

        if (!character) continue;

        await runAutoUpdateForCharacter(
            context,
            character,
            card
        );
    }
}

async function runAutoUpdateForCharacter(
    context,
    character,
    card
) {
    const groupId = context.groupId || "";
    const scopeKey = automationScopeKey(character.id, groupId);

    if (autoUpdateInFlight.has(scopeKey)) {
        return;
    }

    const settings =
        character.settings || {};

    const autoStateEnabled =
        Boolean(settings.autoState);

    const autoKnowledgeEnabled =
        Boolean(settings.autoKnowledge);

    if (
        !autoStateEnabled &&
        !autoKnowledgeEnabled
    ) {
        return;
    }

    const stateFrequency =
        settings.autoStateFrequency || 1;

    const knowledgeFrequency =
        settings.autoKnowledgeFrequency || 20;

    autoStateCounter[scopeKey] =
        autoStateEnabled
            ? (autoStateCounter[scopeKey] || 0) + 1
            : 0;

    autoKnowledgeCounter[scopeKey] =
        autoKnowledgeEnabled
            ? (autoKnowledgeCounter[scopeKey] || 0) + 1
            : 0;

    const shouldRunState =
        autoStateEnabled &&
        autoStateCounter[scopeKey] >= stateFrequency;

    const shouldRunKnowledge =
        autoKnowledgeEnabled &&
        autoKnowledgeCounter[scopeKey] >= knowledgeFrequency;

    if (
        !shouldRunState &&
        !shouldRunKnowledge
    ) {
        return;
    }

    if (shouldRunState) {
        autoStateCounter[scopeKey] = 0;
    }

    if (shouldRunKnowledge) {
        autoKnowledgeCounter[scopeKey] = 0;
    }

    autoUpdateInFlight.add(scopeKey);

    try {

        await runAutoUpdates(
            context,
            character,
            card,
            settings,
            shouldRunState,
            shouldRunKnowledge
        );

    } finally {

        autoUpdateInFlight.delete(scopeKey);
    }
}

async function runAutoUpdates(
    context,
    character,
    card,
    settings,
    shouldRunState,
    shouldRunKnowledge
) {

    const stateMessageCount =
        settings.autoStateMessageCount || 10;

    const knowledgeMessageCount =
        settings.autoKnowledgeMessageCount || 30;

    const messages =
        targetCharacterConversation(
            card,
            formatChatMessages(
                context.chat.slice(
                    -stateMessageCount
                )
            )
        );

    const knowledgeMessages =
        targetCharacterConversation(
            card,
            formatChatMessages(
                context.chat.slice(
                    -knowledgeMessageCount
                )
            )
        );

    const hashUpdates = {};
    let settingsChanged = false;
    let shouldRefresh = false;

    if (shouldRunState) {

        const stateHash =
            await generateHash(
                messages
            );

        if (
            settings.lastStateHash !== stateHash
        ) {

            showCCMToast(
                `Updating ${card.name}'s state...`
            );

            try {

                const result =
                    await updateCharacterStateData(
                        character.id,
                        messages,
                        context.groupId || ""
                    );

                hashUpdates.lastStateHash =
                    stateHash;

                settingsChanged = true;
                shouldRefresh = true;

                showCCMToast(
                    result.changed
                        ? `${card.name}'s state updated`
                        : `No state changes for ${card.name}`,
                    "success"
                );

            } catch (error) {

                console.error(
                    `[CCM] Auto state update failed for ${card.name}`,
                    error
                );

                showCCMToast(
                    `${card.name}'s state update failed: ${getSafeErrorMessage(error, "The AI request failed.")}`,
                    "error"
                );
            }
        }
    }

    if (shouldRunKnowledge) {

        const knowledgeHash =
            await generateHash(
                knowledgeMessages
            );

        if (
            settings.lastKnowledgeHash !== knowledgeHash
        ) {

            showCCMToast(
                `Updating ${card.name}'s knowledge...`
            );

            try {

                const result =
                    await updateCharacterKnowledge(
                        character.id,
                        knowledgeMessages,
                        context.groupId || ""
                    );

                hashUpdates.lastKnowledgeHash =
                    knowledgeHash;

                settingsChanged = true;
                shouldRefresh = true;

                showCCMToast(
                    result.changed
                        ? `${card.name}'s knowledge updated`
                        : `No knowledge changes for ${card.name}`,
                    "success"
                );

            } catch (error) {

                console.error(
                    `[CCM] Auto knowledge update failed for ${card.name}`,
                    error
                );

                showCCMToast(
                    `${card.name}'s knowledge update failed: ${getSafeErrorMessage(error, "The AI request failed.")}`,
                    "error"
                );
            }
        }
    }

    if (settingsChanged) {

        const current =
            getScopedCharacter(
                character.id,
                context.groupId || ""
            );

        if (current) {

            updateScopedCharacter(
                character.id,
                {
                    settings: {
                        ...current.settings,
                        ...hashUpdates
                    }
                },
                context.groupId || ""
            );
        }
    }

    if (shouldRefresh) {

        const container =
            document.getElementById(
                "ccm-character-list"
            );

        if (
            container?.dataset
                ?.ccmCharacterId === character.id
        ) {
            renderCharacterDashboard(
                character.id,
                context.groupId || ""
            );
        } else if (
            container &&
            !container.dataset
                ?.ccmCharacterId
        ) {
            if (context.groupId) {
                renderGroupDashboard(
                    context.groupId
                );
            } else {
                renderCharacterList();
            }
        }
    }
}
