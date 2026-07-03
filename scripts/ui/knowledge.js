// scripts/ui/knowledge.js

import {
    getCharacter,
    updateCharacter
} from "../database.js";

import {
    renderCharacterDashboard
} from "../ui.js";

import {
    loadSectionState
} from "./section-state.js";

import {
    renderConfidence
} from "./confidence.js";

import {
    escapeHtml
} from "./escape.js";

export function addKnowledge(id) {

    const text =
        prompt("Enter knowledge:");

    if (!text || !text.trim()) {
        return;
    }

    const char =
        getCharacter(id);

    if (!char) {
        return;
    }

    const knowledge =
        char.knowledge || [];

    knowledge.unshift({

        id:
            "knowledge_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 8),

        text:
            text.trim(),

        confidence:
            100,

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()

    });

    updateCharacter(
        id,
        {
            knowledge
        }
    );

    renderCharacterDashboard(
        id
    );

}

export function deleteKnowledge(
    characterId,
    knowledgeId
) {

    if (
        !confirm(
            "Delete this knowledge?"
        )
    ) {
        return;
    }

    const char =
        getCharacter(
            characterId
        );

    if (!char) {
        return;
    }

    const knowledge =
        (char.knowledge || [])
            .filter(
                item =>
                    item.id !== knowledgeId
            );

    updateCharacter(
        characterId,
        {
            knowledge
        }
    );

    renderCharacterDashboard(
        characterId
    );

}

export function editKnowledge(
    characterId,
    knowledgeId
) {

    const char =
        getCharacter(
            characterId
        );

    if (!char) {
        return;
    }

    const knowledge =
        char.knowledge || [];

    const item =
        knowledge.find(
            x => x.id === knowledgeId
        );

    if (!item) {
        return;
    }

    const text =
        prompt(
            "Edit knowledge:",
            item.text
        );

    if (
        text === null ||
        !text.trim()
    ) {
        return;
    }

    item.text =
        text.trim();

    item.updatedAt =
        Date.now();

    updateCharacter(
        characterId,
        {
            knowledge
        }
    );

    renderCharacterDashboard(
        characterId
    );

}

export function renderKnowledge(
    char
) {

    return `
        <details
            id="ccm-knowledge-section"
            class="ccm-dashboard-section"
            ${loadSectionState(char.id, "knowledge") ? "open" : ""}
        >

            <summary>
                <span>Knowledge</span>
                <small>${(char.knowledge || []).length} saved</small>
            </summary>

            <div class="ccm-section-content">
                <button id="ccm-add-knowledge" class="ccm-section-action">
                    + Add Knowledge
                </button>

            <div id="ccm-knowledge">
                ${
                    (char.knowledge || []).length
                        ? char.knowledge
                            .map(item => `
                                <div class="ccm-knowledge-card">
                                    <div class="ccm-knowledge-text">
                                        🧠 ${escapeHtml(item.text)}
                                    </div>

                                    <div class="ccm-knowledge-footer">
                                        <span class="ccm-confidence">
                                            ${renderConfidence(item.confidence)}
                                        </span>

                                        <div>
                                            <button class="ccm-edit-knowledge" data-id="${escapeHtml(item.id)}">
                                                ✏️
                                            </button>

                                            <button class="ccm-delete-knowledge" data-id="${escapeHtml(item.id)}">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `)
                            .join("")
                        : "<p class=\"ccm-empty-state\">No knowledge yet.</p>"
                }
            </div>
            </div>

        </details>
    `;
}

export function bindKnowledgeEvents(
    id
) {

    document
        .getElementById("ccm-add-knowledge")
        ?.addEventListener(
            "click",
            () => addKnowledge(id)
        );

    document
        .querySelectorAll(".ccm-delete-knowledge")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => deleteKnowledge(
                    id,
                    button.dataset.id
                )
            );
        });

    document
        .querySelectorAll(".ccm-edit-knowledge")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => editKnowledge(
                    id,
                    button.dataset.id
                )
            );
        });
}
