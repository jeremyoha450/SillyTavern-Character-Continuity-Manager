// scripts/ui/state-actions.js

import {
    getCharacter,
    getScopedCharacter,
    updateCharacter,
    updateScopedCharacter,
    saveDatabase
} from "../database.js";

import {
    extractFacts
} from "../providers/provider-manager.js";

import {
    mergeData
} from "../merge/merge-data.js";

import factsSchema
from "../tasks/facts/schema.js";

import {
    addHistory
} from "../history/history.js";

import {
    updateCharacterStateData
} from "../state/update-state.js";

import {
    updateCharacterKnowledge as runKnowledgeUpdate
} from "../knowledge/update-knowledge.js";

import {
    postProcessFacts
} from "../extraction/post-process.js";

import {
    getHeightConfig
} from "../config/height-defaults.js";

import {
    showCCMStatus,
    showCCMSuccess,
    showCCMError
} from "./status.js";

import {
    renderCharacterDashboard
} from "../ui.js";

import {
    formatChatMessages,
    isCharacterInCurrentContext,
    targetCharacterConversation
} from "../group-context.js";

function recordNoChangeHistory(
    id,
    groupId,
    type,
    message
) {

    const character =
        getScopedCharacter(
            id,
            groupId
        );

    if (!character) return;

    const history =
        addHistory(
            character,
            type,
            [],
            { message }
        );

    updateScopedCharacter(
        id,
        { history },
        groupId
    );

}

export async function updateCharacterState(
    id,
    groupId = ""
) {


    showCCMStatus(`
        <div style="font-size:52px;">
            ⏳
        </div>

        <br>

        Updating Current State...

        <br><br>

        Please wait...
    `);

    try {

        const character =
            getScopedCharacter(
                id,
                groupId
            );

        if (!character) {

            showCCMError(
                "Character not found."
            );

            return;
        }

        const ctx =
            SillyTavern.getContext();

        if (
            !isCharacterInCurrentContext(
                ctx,
                character
            )
        ) {
            showCCMError(
                "Open a chat or group containing this character first."
            );
            return;
        }

        const messages =
            targetCharacterConversation(
                character,
                formatChatMessages(
                    ctx.chat.slice(-10)
                )
            );


        const result =
			await updateCharacterStateData(
				id,
				messages,
				groupId
			);

		if (!result.changed) {

            recordNoChangeHistory(
                id,
                groupId,
                "state",
                "Manual state update checked the recent chat. No state changes were found."
            );

			showCCMSuccess(
				"No state changes found"
			);

			renderCharacterDashboard(
				id,
                groupId
			);

			return;
		}


		showCCMSuccess(
			"Current state updated"
		);

		renderCharacterDashboard(
			id,
            groupId
		);

    } catch (error) {

        console.error(
            "[CCM] Failed to update current state",
            error
        );

        showCCMError(
            "Failed to update current state.",
            error,
            "Manual state update"
        );

    }

}

export async function reExtractCharacter(
    id,
    groupId = ""
) {

    showCCMStatus(`
        <div style="font-size:52px;">
            ⏳
        </div>

        <br>

        Re-extracting Facts...

        <br><br>

        Please wait...
    `);

    try {

        const ctx =
            SillyTavern.getContext();

        const currentCharacter =
            getScopedCharacter(
                id,
                groupId
            );

        const character =
            ctx?.characters?.find(candidate =>
                currentCharacter?.avatar && candidate?.avatar
                    ? currentCharacter.avatar === candidate.avatar
                    : currentCharacter?.name === candidate?.name
            );

        if (!character) {

            showCCMError(
                "Character not found."
            );

            return;
        }

		const facts =
			postProcessFacts(
				await extractFacts(
					character.data?.description || "",
					{
						characterId: id,
						characterName:
							currentCharacter.name
					}
				),
				{
					gender:
						currentCharacter.facts
							?.gender?.value,
					characterId: id,
					heightConfig:
						getHeightConfig()
				}
			);

		const existingFacts = {
			...structuredClone(factsSchema),
			...structuredClone(
				currentCharacter.facts || {}
			)
		};

		const characterNameProtected =
			Boolean(
				existingFacts
					.characterName
					?.value
			) ||
			Boolean(
				currentCharacter
					.locks
					?.characterName
			);

		const extractionLocks = {
			...currentCharacter.locks,
			characterName:
				characterNameProtected
		};

		// Fields changed by a roleplay override must survive
		// a card re-extract. These act as merge-only locks:
		// they are never persisted into character.locks, so
		// future roleplay overrides still work.
		const mergeLocks = {
			...extractionLocks
		};

		for (
			const [field, overridden]
			of Object.entries(
				currentCharacter.overrides || {}
			)
		) {
			if (overridden) {
				mergeLocks[field] = true;
			}
		}

		const mergedFacts =
			mergeData(
				existingFacts,
				facts,
				mergeLocks
			);

		const updatedLocks = {
			...extractionLocks,
			characterName:
				characterNameProtected ||
				Boolean(
					mergedFacts.data
						.characterName
						?.value
				)
		};

		if (
			updatedLocks.characterName !==
			Boolean(
				currentCharacter
					.locks
					?.characterName
			)
		) {
			updateScopedCharacter(
				id,
				{
					locks: updatedLocks
				},
				groupId
			);
		}

		if (!mergedFacts.changed) {

            recordNoChangeHistory(
                id,
                groupId,
                "facts",
                "Manual facts re-extraction completed. No fact changes were found."
            );

			showCCMSuccess(
				"No fact changes found"
			);

			renderCharacterDashboard(
				id,
                groupId
			);

			return;
		}

		const history =
			addHistory(
				currentCharacter,
				"facts",
				mergedFacts.changes
			);

		updateScopedCharacter(
			id,
			{
				facts:
					mergedFacts.data,

				locks:
					updatedLocks,

				history
			},
			groupId
		);

		renderCharacterDashboard(
			id,
            groupId
		);


        showCCMSuccess(
            "Facts re-extracted"
        );

		renderCharacterDashboard(
			id,
            groupId
		);

    } catch (error) {

        console.error(
            "[CCM] Failed to re-extract facts",
            error
        );

        showCCMError(
            "Failed to re-extract facts.",
            error,
            "Fact re-extraction"
        );

    }

}


export async function updateCharacterKnowledge(
    id,
    groupId = ""
) {


    showCCMStatus(`
        <div style="font-size:52px;">
            ⏳
        </div>

        <br>

        Updating Knowledge...

        <br><br>

        Please wait...
    `);

    try {

        const ctx =
            SillyTavern.getContext();

        const character =
            getScopedCharacter(
                id,
                groupId
            );

        if (
            !character ||
            !isCharacterInCurrentContext(
                ctx,
                character
            )
        ) {
            showCCMError(
                "Open a chat or group containing this character first."
            );
            return;
        }

        const messages =
            targetCharacterConversation(
                character,
                formatChatMessages(
                    ctx.chat.slice(-30)
                )
            );

        const result =
			await runKnowledgeUpdate(
				id,
				messages,
				groupId
			);

        if (!result.changed) {

            recordNoChangeHistory(
                id,
                groupId,
                "knowledge",
                "Manual knowledge update checked the recent chat. No knowledge changes were found."
            );

            showCCMSuccess(
                "No knowledge changes found"
            );

            renderCharacterDashboard(
                id,
                groupId
            );

            return;
        }

        showCCMSuccess(
            "Knowledge updated"
        );

        renderCharacterDashboard(
            id,
            groupId
        );

    } catch (error) {

        console.error(
            "[CCM] Failed to update knowledge",
            error
        );

        showCCMError(
            "Failed to update knowledge.",
            error,
            "Manual knowledge update"
        );

    }

}

export function changeCharacterImage(
    id,
    groupId = ""
) {

    const input =
        document.createElement(
            "input"
        );

    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {

        const file =
            input.files?.[0];

        if (!file) {
            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {

            updateCharacter(
                id,
                {
                    image:
                        reader.result
                }
            );

            renderCharacterDashboard(
                id,
                groupId
            );

        };

        reader.readAsDataURL(
            file
        );

    };

    input.click();

}

export function removeCharacterImage(
    id,
    groupId = ""
) {

    updateCharacter(
        id,
        {
            image: ""
        }
    );

    renderCharacterDashboard(
        id,
        groupId
    );

}
