// scripts/continuity-manager.js

import {
    eventSource,
    event_types
} from "../../../../../script.js";

import {
    findCharacterByName,
    getCharacter,
    createCharacter,
    addCharacter,
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
    renderCharacterDashboard
} from "./ui.js";

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


let lastAutoStateText = "";
let autoStateCounter = {};

let lastAutoKnowledgeText = "";
let autoKnowledgeCounter = {};

const autoUpdateInFlight = new Set();

export function initializeContinuityManager() {

    console.log(
        "[CCM] Continuity Manager Ready"
    );

    eventSource.on(
        event_types.CHAT_LOADED,
		
        onChatLoaded
    );
	
	eventSource.on(
        event_types.CHAT_CHANGED,
        () => {

            const ctx =
                SillyTavern.getContext();

            const character =
                ctx?.characters?.[
                    ctx.characterId
                ];

            const panel =
                document.getElementById(
                    "ccm-panel"
                );

            if (!character) {

                if (
                    panel &&
                    getComputedStyle(panel).display !== "none"
                ) {
                    renderCharacterList();
                }

                return;

            }

			console.log(
				"[CCM] Avatar",
				character.avatar
			);
        }
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

async function onChatLoaded() {

    const ctx =
        SillyTavern.getContext();

    const character =
        ctx?.characters?.[
            ctx.characterId
        ];

    const characterName =
        character?.name;

    console.log(
        "[CCM] Character Name",
        characterName
    );

	if (!characterName) {

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

    const existing =
		findCharacterByName(
			characterName
		);

	if (existing) {

		if (
			existing.avatar !== character.avatar
		) {

			updateCharacter(
				existing.id,
				{
					avatar:
						character.avatar || ""
				}
			);

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
				existing.id
			);

		} else {

			renderCharacterList();

		}

		return;

	}

    console.log(
		"[CCM] Creating Character",
		characterName
	);

	showCCMStatus(`
		<div style="font-size:52px;">
			⏳
		</div>

		<br>

		Adding character to CCM...

		<br><br>

		Please wait...
	`);

	const knowledgeText =
    [
        character.data?.description,
        character.data?.personality
    ]
        .filter(Boolean)
        .join("\n\n");

    const characterNote =
        character.data
            ?.extensions
            ?.depth_prompt
            ?.prompt ||
        character.data?.character_note ||
        character.character_note ||
        "";

    const firstChatMessage =
        ctx.chat?.find(
            message =>
                !message.is_user &&
                typeof message.mes === "string" &&
                message.mes.trim()
        )?.mes ||
        character.data?.first_mes ||
        character.first_mes ||
        "";

    const initialStateText =
        [
            character.data?.description
                ? `Character Description:\n${character.data.description}`
                : "",

            characterNote
                ? `Character Note:\n${characterNote}`
                : "",

            character.data?.personality
                ? `Personality Summary:\n${character.data.personality}`
                : "",

            firstChatMessage
                ? `First Chat Message:\nAssistant:\n${firstChatMessage}`
                : ""
        ]
            .filter(Boolean)
            .join("\n\n");

	const newCharacter =
		createCharacter(
			characterName
		);

	newCharacter.avatar =
		character.avatar || "";

    let facts;
	let knowledge = [];
    let initialState = null;

	try {

		facts =
			await execute(
				"facts",
				character.data?.description || "",
				{
					characterId:
						newCharacter.id,
					characterName
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
                    `CREATION STATE SOURCES

Use the First Chat Message as the highest-priority source for current state when sources conflict.

${initialStateText}`,
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
			"[CCM] Failed to extract facts for new character",
			error
		);

		showCCMError(
			"Failed to add character to CCM."
		);

		return;
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
                initialState,
                newCharacter.locks
            )
            : {
                data: mergedFacts.data
            };

    newCharacter.facts =
		mergedInitialState.data;

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

	showCCMSuccess(
		"Character added to CCM"
	);

	const panel =
		document.getElementById(
			"ccm-panel"
		);

	if (panel) {
		panel.style.display =
			"block";
	}

	setTimeout(
		() => {
			renderCharacterDashboard(
				newCharacter.id
			);
		},
		50
	);

	/* console.log(
		"[CCM] Extracted Facts",
		facts
	); */

    renderCharacterList();
}

async function onAutoStateUpdate() {

    const ctx =
        SillyTavern.getContext();

    if (!ctx.chat || ctx.chat.length === 0) {
        return;
    }

    const lastMessage =
        ctx.chat[
            ctx.chat.length - 1
        ];

    if (lastMessage.is_user) {
        return;
    }

    const stCharacter =
        ctx?.characters?.[
            ctx.characterId
        ];

    const characterName =
        stCharacter?.name;

    if (!characterName) {
        return;
    }

    const ccmCharacter =
        findCharacterByName(
            characterName
        );

    if (!ccmCharacter) {
        return;
    }

    // A previous auto update for this character is still
    // awaiting its AI response; running a second one
    // alongside it would race on the same character data.
    if (
        autoUpdateInFlight.has(
            ccmCharacter.id
        )
    ) {
        return;
    }

    const settings =
        ccmCharacter.settings || {};

    const autoStateEnabled =
        !!settings.autoState;

    const autoKnowledgeEnabled =
        !!settings.autoKnowledge;

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

    if (autoStateEnabled) {

        autoStateCounter[ccmCharacter.id] =
            (autoStateCounter[ccmCharacter.id] || 0) + 1;

    } else {

        autoStateCounter[ccmCharacter.id] = 0;

    }

    if (autoKnowledgeEnabled) {

        autoKnowledgeCounter[ccmCharacter.id] =
            (autoKnowledgeCounter[ccmCharacter.id] || 0) + 1;

    } else {

        autoKnowledgeCounter[ccmCharacter.id] = 0;

    }

    const shouldRunState =
        autoStateEnabled &&
        autoStateCounter[ccmCharacter.id] >= stateFrequency;

    const shouldRunKnowledge =
        autoKnowledgeEnabled &&
        autoKnowledgeCounter[ccmCharacter.id] >= knowledgeFrequency;

    if (
        !shouldRunState &&
        !shouldRunKnowledge
    ) {
        return;
    }

    if (shouldRunState) {
        autoStateCounter[ccmCharacter.id] = 0;
    }

    if (shouldRunKnowledge) {
        autoKnowledgeCounter[ccmCharacter.id] = 0;
    }

    autoUpdateInFlight.add(
        ccmCharacter.id
    );

    try {

        await runAutoUpdates(
            ctx,
            ccmCharacter,
            settings,
            shouldRunState,
            shouldRunKnowledge
        );

    } finally {

        autoUpdateInFlight.delete(
            ccmCharacter.id
        );

    }

}

async function runAutoUpdates(
    ctx,
    ccmCharacter,
    settings,
    shouldRunState,
    shouldRunKnowledge
) {

    const stateMessageCount =
        settings.autoStateMessageCount || 10;

    const knowledgeMessageCount =
        settings.autoKnowledgeMessageCount || 30;

    const messages =
        ctx.chat
            .slice(-stateMessageCount)
            .map(
                x =>
                    `${x.is_user ? "User" : "Assistant"}:\n${x.mes}`
            )
            .join("\n\n");

    const knowledgeMessages =
        ctx.chat
            .slice(-knowledgeMessageCount)
            .map(
                x =>
                    `${x.is_user ? "User" : "Assistant"}:\n${x.mes}`
            )
            .join("\n\n");

    const hashUpdates = {};

    let settingsChanged =
        false;

    let shouldRefresh =
        false;

    if (shouldRunState) {

        const stateHash =
            await generateHash(
                messages
            );

        if (
            settings.lastStateHash === stateHash
        ) {

            console.log(
                "[CCM] State window unchanged"
            );

        } else if (
            messages !== lastAutoStateText
        ) {

            lastAutoStateText =
                messages;

            console.log(
                "[CCM] Auto State Update"
            );

            showCCMToast(
                "Auto state update in progress..."
            );

            try {

                const result =
                    await updateCharacterStateData(
                        ccmCharacter.id,
                        messages
                    );

                hashUpdates.lastStateHash =
                    stateHash;

                settingsChanged =
                    true;

                shouldRefresh =
                    true;

                if (result.changed) {

                    showCCMToast(
                        "Auto state updated",
                        "success"
                    );

                } else {

                    showCCMToast(
                        "No state changes",
                        "success"
                    );

                }

            } catch (error) {

                console.error(
                    "[CCM] Auto State Update Failed",
                    error
                );

                showCCMToast(
                    "Auto state update failed",
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
            settings.lastKnowledgeHash === knowledgeHash
        ) {

            console.log(
                "[CCM] Knowledge window unchanged"
            );

        } else if (
            knowledgeMessages !== lastAutoKnowledgeText
        ) {

            lastAutoKnowledgeText =
                knowledgeMessages;

            console.log(
                "[CCM] Auto Knowledge Update"
            );

            showCCMToast(
                "Auto knowledge update in progress..."
            );

            try {

                const knowledgeResult =
                    await updateCharacterKnowledge(
                        ccmCharacter.id,
                        knowledgeMessages
                    );

                hashUpdates.lastKnowledgeHash =
                    knowledgeHash;

                settingsChanged =
                    true;

                shouldRefresh =
                    true;

                if (knowledgeResult.changed) {

                    showCCMToast(
                        "Knowledge updated",
                        "success"
                    );

                } else {

                    showCCMToast(
                        "No knowledge changes",
                        "success"
                    );

                }

            } catch (error) {

                console.error(
                    "[CCM] Auto Knowledge Update Failed",
                    error
                );

                showCCMToast(
                    "Auto knowledge update failed",
                    "error"
                );

            }

        }

    }

    if (settingsChanged) {

        // Re-read settings before saving: the awaited AI
        // calls above give the user time to change them,
        // and saving a stale snapshot would revert that.
        const current =
            getCharacter(
                ccmCharacter.id
            );

        if (current) {

            updateCharacter(
                ccmCharacter.id,
                {
                    settings: {
                        ...current.settings,
                        ...hashUpdates
                    }
                }
            );

        }

    }

    if (shouldRefresh) {

        const panel =
            document.getElementById(
                "ccm-panel"
            );

        const dashboardOpen =
            document.getElementById(
                "ccm-dashboard-edit"
            );

        if (
            panel &&
            getComputedStyle(panel).display !== "none" &&
            dashboardOpen
        ) {

            renderCharacterDashboard(
                ccmCharacter.id
            );

        } else {

            renderCharacterList();

        }

    }

}
