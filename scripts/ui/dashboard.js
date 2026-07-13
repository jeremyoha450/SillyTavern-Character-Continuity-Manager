// scripts/ui/dashboard.js

import {
    getScopedCharacter,
    deleteCharacter,
    archiveCharacter,
    restoreCharacter
} from "../database.js";

import {
    renderAutomation,
    bindAutomationEvents
} from "./automation.js";

import {
    renderHistory
} from "./history.js";

import {
    renderKnowledge,
    bindKnowledgeEvents
} from "./knowledge.js";

import {
    saveSectionState
} from "./section-state.js";

import {
    renderImageWorkspace,
    bindImageWorkspaceEvents
} from "./image-gallery.js";

import {
    escapeHtml
} from "./escape.js";

import { debugLog } from "../debug-logger.js";

import {
    ensureActiveCharacterChat
} from "./image-prompt.js";

export function renderCharacterDashboard(
    id,
    actions,
    groupId = ""
) {

    debugLog("dashboard", "dashboard.opened", {
        operation: groupId ? "open-group-character" : "open-character",
        status: "started"
    });

    const container =
        document.getElementById(
            "ccm-character-list"
        );

    if (!container) return;

    const char =
        getScopedCharacter(
            id,
            groupId
        );

    if (!char) return;

    container.dataset.ccmCharacterId = id;
    container.dataset.ccmGroupId = groupId;

    document
        .getElementById("ccm-list-controls")
        ?.setAttribute("hidden", "");

    container.innerHTML = `
        <div class="ccm-dashboard-toolbar">
            <button id="ccm-back-list">← ${groupId ? "Group" : "Character List"}</button>
            <button id="ccm-dashboard-close-chat">Close Chat</button>
        </div>

        <section class="ccm-character-overview">
            <div class="ccm-character-image-wrap">
                ${
                    (char.image || char.avatar)
                        ? `
                            <img
                                class="ccm-character-image"
                                src="${escapeHtml(char.image || "/thumbnail?type=avatar&file=" + encodeURIComponent(char.avatar))}"
                                alt="Character image"
                            >
                        `
                        : `<div class="ccm-character-image-empty">No image</div>`
                }

                <div class="ccm-image-actions">
                    <button id="ccm-change-image">Change</button>
                    ${
                        char.image
                            ? `<button id="ccm-remove-image">Remove</button>`
                            : ""
                    }
                </div>
            </div>

            <div class="ccm-character-identity">
                <h3>${escapeHtml(char.name)}</h3>
                ${groupId
                    ? `<p class="ccm-scope-label">Group-specific continuity</p>`
                    : ""}
                <p class="ccm-character-meta">
                    ${escapeHtml(char.facts?.age?.value || "?")}
                    <span>•</span>
                    ${escapeHtml(char.facts?.gender?.value || "?")}
                </p>
                <button id="ccm-dashboard-edit">Edit Character</button>
            </div>
        </section>

        <section class="ccm-dashboard-action-section">
            <h4>Chat</h4>
            <div class="ccm-dashboard-button-grid">
                <button id="ccm-dashboard-new-chat">Start New Chat</button>
                <button id="ccm-dashboard-image-prompt">Image Prompt</button>
            </div>
        </section>

        <section class="ccm-dashboard-action-section">
            <h4>Continuity</h4>
            <div class="ccm-dashboard-button-grid">
                <button id="ccm-dashboard-reextract">Re-extract Facts</button>
                <button id="ccm-dashboard-update-state">Update State</button>
                <button id="ccm-dashboard-update-knowledge">Update Knowledge</button>
                <button id="ccm-dashboard-usage">Token Statistics</button>
            </div>
        </section>

        ${renderImageWorkspace(char)}

        <div class="ccm-dashboard-sections">
            ${renderAutomation(char)}
            ${renderHistory(char)}
            ${renderKnowledge(char)}
        </div>

        ${groupId ? "" : `<section class="ccm-dashboard-management">
            <h4>Character Management</h4>
            <div class="ccm-dashboard-button-grid">
                ${
                    char.status === "archived"
                        ? `<button id="ccm-dashboard-restore">Restore</button>`
                        : `<button id="ccm-dashboard-archive">Archive</button>`
                }
                <button id="ccm-dashboard-delete" class="ccm-danger-button">Delete</button>
            </div>
        </section>`}
    `;

    bindAutomationEvents(
        id,
        char,
        groupId
    );

    bindKnowledgeEvents(
        id,
        groupId
    );

    bindImageWorkspaceEvents(
        id,
        actions,
        groupId
    );

    const runWithActiveCharacterChat =
        async (
            actionLabel,
            action
        ) => {
            if (
                !await ensureActiveCharacterChat(
                    char,
                    actionLabel
                )
            ) {
                return;
            }

            await action();
        };

    document
        .getElementById("ccm-back-list")
        .addEventListener(
            "click",
            () => groupId
                ? actions.renderGroupDashboard(groupId)
                : actions.renderCharacterList()
        );

	document
		.getElementById("ccm-dashboard-close-chat")
		.addEventListener(
			"click",
			() => {
				document
					.getElementById("option_close_chat")
					?.click();
			}
		);

    document
        .getElementById("ccm-dashboard-edit")
        .addEventListener(
            "click",
			() => actions.openEditor(
				id,
				actions.renderCharacterDashboard,
				groupId
			)
        );

    document
        .getElementById("ccm-dashboard-reextract")
        .addEventListener(
            "click",
            () => runWithActiveCharacterChat(
                "Re-extracting facts",
                () => actions.reExtractCharacter(
                    id,
                    groupId
                )
            )
        );

    document
        .getElementById("ccm-dashboard-update-state")
        .addEventListener(
            "click",
            () => runWithActiveCharacterChat(
                "Updating state",
                () => actions.updateCharacterState(
                    id,
                    groupId
                )
            )
        );
	document
		.getElementById("ccm-dashboard-update-knowledge")
		.addEventListener(
			"click",
			() => runWithActiveCharacterChat(
				"Updating knowledge",
				() => actions.updateCharacterKnowledge(
					id,
					groupId
				)
			)
		);

    document
        .getElementById("ccm-dashboard-image-prompt")
        .addEventListener(
            "click",
            () => actions.createCharacterImagePrompt(
                id,
                () => actions
                    .renderCharacterDashboard(
                        id,
                        groupId
                    ),
                groupId
            )
        );

    document
        .getElementById("ccm-dashboard-usage")
        .addEventListener(
            "click",
            () => actions.openUsageStats(id)
        );

	document
		.getElementById("ccm-dashboard-new-chat")
		.addEventListener(
			"click",
			() => runWithActiveCharacterChat(
				"Starting a new chat",
				() => document
					.getElementById("option_start_new_chat")
					?.click()
			)
		);

    const archiveBtn =
        document.getElementById(
            "ccm-dashboard-archive"
        );

    if (archiveBtn) {
        archiveBtn.addEventListener(
            "click",
            () => {
                archiveCharacter(id);
                actions.renderCharacterList();
            }
        );
    }

    const restoreBtn =
        document.getElementById(
            "ccm-dashboard-restore"
        );

    if (restoreBtn) {
        restoreBtn.addEventListener(
            "click",
            () => {
                restoreCharacter(id);
                actions.renderCharacterList();
            }
        );
    }

	const changeImageBtn =
		document.getElementById(
			"ccm-change-image"
		);

	if (changeImageBtn) {

		changeImageBtn.addEventListener(
			"click",
			() => actions.changeCharacterImage(
				id,
				groupId
			)
		);

	}

	const removeImageBtn =
		document.getElementById(
			"ccm-remove-image"
		);

	if (removeImageBtn) {

		removeImageBtn.addEventListener(
			"click",
			() => actions.removeCharacterImage(
				id,
				groupId
			)
		);

	}

    document
        .getElementById("ccm-dashboard-delete")
        ?.addEventListener(
            "click",
            () => {
                if (!confirm(`Delete ${char.name}?`)) {
                    return;
                }

                deleteCharacter(id);
                actions.renderCharacterList();
            }
        );

    [
        ["automation", "ccm-automation-section"],
        ["history", "ccm-history-section"],
        ["knowledge", "ccm-knowledge-section"]
    ].forEach(([key, sectionId]) => {

        const section =
            document.getElementById(sectionId);

        if (!section) {
            return;
        }

        section.addEventListener(
            "toggle",
            () => {
                saveSectionState(
                    char.id,
                    key,
                    section.open
                );
            }
        );
    });
}
