// scripts/ui/state-actions.js

import {
    getCharacter,
    updateCharacter,
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
    showCCMStatus,
    showCCMSuccess,
    showCCMError
} from "./status.js";

import {
    renderCharacterDashboard
} from "../ui.js";

export async function updateCharacterState(
    id
) {

    console.log(
        "[CCM] Update State button clicked"
    );

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
            getCharacter(
                id
            );

        if (!character) {

            showCCMError(
                "Character not found."
            );

            return;
        }

        const ctx =
            SillyTavern.getContext();

        const messages =
            ctx.chat
                .slice(-10)
                .map(
                    x =>
                        `${x.is_user ? "User" : "Assistant"}:\n${x.mes}`
                )
                .join("\n\n");

        console.log(
            "[CCM] Messages",
            messages
        );

        const result =
			await updateCharacterStateData(
				id,
				messages
			);

		if (!result.changed) {

			console.log(
				"[CCM] No State Changes"
			);

			showCCMSuccess(
				"No state changes found"
			);

			renderCharacterDashboard(
				id
			);

			return;
		}

		console.log(
			"[CCM] State Updated",
			result.changes
		);

		showCCMSuccess(
			"Current state updated"
		);

		renderCharacterDashboard(
			id
		);

    } catch (error) {

        console.error(
            "[CCM] Failed to update current state",
            error
        );

        showCCMError(
            "Failed to update current state."
        );

    }

}

export async function reExtractCharacter(
    id
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

        const character =
            ctx?.characters?.[
                ctx.characterId
            ];

        if (!character) {

            showCCMError(
                "Character not found."
            );

            return;
        }

        const currentCharacter =
			getCharacter(
				id
			);

		const facts =
			await extractFacts(
				character.data?.description || "",
				{
					characterId: id,
					characterName:
						currentCharacter.name
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

		const mergedFacts =
			mergeData(
				existingFacts,
				facts,
				extractionLocks
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
			updateCharacter(
				id,
				{
					locks: updatedLocks
				}
			);
		}

		if (!mergedFacts.changed) {

			console.log(
				"[CCM] No Fact Changes"
			);

			showCCMSuccess(
				"No fact changes found"
			);

			renderCharacterDashboard(
				id
			);

			return;
		}

		const history =
			addHistory(
				currentCharacter,
				"facts",
				mergedFacts.changes
			);

		updateCharacter(
			id,
			{
				facts:
					mergedFacts.data,

				locks:
					updatedLocks,

				history
			}
		);

		renderCharacterDashboard(
			id
		);

        console.log(
            "[CCM] Started Manual ReExtract",
            facts
        );

        showCCMSuccess(
            "Facts re-extracted"
        );

		renderCharacterDashboard(
			id
		);

    } catch (error) {

        console.error(
            "[CCM] Failed to re-extract facts",
            error
        );

        showCCMError(
            "Failed to re-extract facts."
        );

    }

}


export async function updateCharacterKnowledge(
    id
) {

    console.log(
        "[CCM] Update Knowledge button clicked"
    );

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

        const messages =
            ctx.chat
                .slice(-30)
                .map(
                    x =>
                        `${x.is_user ? "User" : "Assistant"}:\n${x.mes}`
                )
                .join("\n\n");

        const result =
			await runKnowledgeUpdate(
				id,
				messages
			);

        if (!result.changed) {

            showCCMSuccess(
                "No knowledge changes found"
            );

            renderCharacterDashboard(
                id
            );

            return;
        }

        showCCMSuccess(
            "Knowledge updated"
        );

        renderCharacterDashboard(
            id
        );

    } catch (error) {

        console.error(
            "[CCM] Failed to update knowledge",
            error
        );

        showCCMError(
            "Failed to update knowledge."
        );

    }

}

export function changeCharacterImage(
    id
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
                id
            );

        };

        reader.readAsDataURL(
            file
        );

    };

    input.click();

}

export function removeCharacterImage(
    id
) {

    updateCharacter(
        id,
        {
            image: ""
        }
    );

    renderCharacterDashboard(
        id
    );

}
