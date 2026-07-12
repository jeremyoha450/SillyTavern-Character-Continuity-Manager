import {
    getGroupContext,
    getScopedCharacter,
    updateGroupContext
} from "../database.js";

import {
    escapeHtml
} from "./escape.js";

function value(character, field) {
    return character.facts?.[field]?.value || "";
}

function memberSummary(character) {
    const details = [
        value(character, "location"),
        value(character, "area"),
        value(character, "position"),
        value(character, "mood")
    ].filter(Boolean);

    return details.length
        ? details.join(" • ")
        : "No group-specific state yet";
}

export function renderGroupDashboard(
    groupId,
    actions
) {
    const container =
        document.getElementById(
            "ccm-character-list"
        );

    const group =
        getGroupContext(groupId);

    if (!container || !group) {
        actions.renderCharacterList();
        return;
    }

    document
        .getElementById("ccm-list-controls")
        ?.setAttribute("hidden", "");

    delete container.dataset.ccmCharacterId;
    container.dataset.ccmGroupId = groupId;

    const members =
        (group.memberOrder || [])
            .map(characterId =>
                getScopedCharacter(
                    characterId,
                    groupId
                )
            )
            .filter(Boolean);

    container.innerHTML = `
        <div class="ccm-dashboard-toolbar">
            <button id="ccm-group-back">← Character List</button>
            <button id="ccm-group-close-chat">Close Chat</button>
        </div>

        <section class="ccm-group-header">
            <h3>${escapeHtml(group.name || "Group")}</h3>
            <p>${members.length} tracked member${members.length === 1 ? "" : "s"}</p>
        </section>

        <section class="ccm-dashboard-action-section">
            <h4>Shared Scene</h4>
            <div class="ccm-group-scene-grid">
                <label>
                    Location
                    <input id="ccm-group-location" value="${escapeHtml(group.scene?.location || "")}">
                </label>
                <label>
                    Area
                    <input id="ccm-group-area" value="${escapeHtml(group.scene?.area || "")}">
                </label>
            </div>
            <label>
                Scene Notes
                <textarea id="ccm-group-notes">${escapeHtml(group.scene?.notes || "")}</textarea>
            </label>
            <button id="ccm-group-save-scene">Save Shared Scene</button>
        </section>

        <section class="ccm-dashboard-action-section">
            <h4>Group Members</h4>
            <div class="ccm-group-member-list">
                ${members.map(character => `
                    <article class="ccm-group-member-card">
                        <div>
                            <strong>${escapeHtml(character.name)}</strong>
                            <small>${escapeHtml(memberSummary(character))}</small>
                        </div>
                        <button
                            type="button"
                            data-ccm-group-member="${escapeHtml(character.id)}"
                        >Open Group Details</button>
                    </article>
                `).join("") || `<p class="ccm-empty-state">No enabled group members.</p>`}
            </div>
        </section>
    `;

    document
        .getElementById("ccm-group-back")
        .addEventListener(
            "click",
            actions.renderCharacterList
        );

    document
        .getElementById("ccm-group-close-chat")
        .addEventListener("click", () => {
            document
                .getElementById("option_close_chat")
                ?.click();
        });

    document
        .getElementById("ccm-group-save-scene")
        .addEventListener("click", event => {
            updateGroupContext(
                groupId,
                {
                    scene: {
                        location:
                            document.getElementById("ccm-group-location").value,
                        area:
                            document.getElementById("ccm-group-area").value,
                        notes:
                            document.getElementById("ccm-group-notes").value
                    }
                }
            );
            event.currentTarget.textContent = "Saved";
            setTimeout(() => {
                event.currentTarget.textContent = "Save Shared Scene";
            }, 1200);
        });

    container
        .querySelectorAll("[data-ccm-group-member]")
        .forEach(button => {
            button.addEventListener("click", () => {
                actions.renderCharacterDashboard(
                    button.dataset.ccmGroupMember,
                    groupId
                );
            });
        });
}
