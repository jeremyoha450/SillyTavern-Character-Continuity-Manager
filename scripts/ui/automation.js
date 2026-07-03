// scripts/ui/automation.js

import {
    updateCharacter
} from "../database.js";

import {
    loadSectionState
} from "./section-state.js";

export function renderAutomation(
    char
) {

    return `
        <details 
            id="ccm-automation-section"
            class="ccm-dashboard-section"
            ${loadSectionState(char.id, "automation") ? "open" : ""}
        >

            <summary>
                <span>Automation</span>
                <small>State and knowledge updates</small>
            </summary>

            <div class="ccm-section-content ccm-automation-grid">
                <div class="ccm-automation-card">
                    <h5>State Updates</h5>

                <label class="ccm-toggle-row">
                    <input
                        type="checkbox"
                        id="ccm-auto-state"
                        ${char.settings?.autoState ? "checked" : ""}
                    >
                    Enable automatic updates
                </label>

                <label class="ccm-field-row">
                    <span>Frequency</span>

                    <select id="ccm-auto-frequency">
                        <option value="1">Every Reply</option>
                        <option value="3">Every 3 Replies</option>
                        <option value="5">Every 5 Replies</option>
                        <option value="10">Every 10 Replies</option>
                    </select>
                </label>

                <label class="ccm-field-row">
                    <span>Messages</span>

                    <select id="ccm-auto-message-count">
                        <option value="5">Last 5</option>
                        <option value="10">Last 10</option>
                        <option value="15">Last 15</option>
                        <option value="20">Last 20</option>
                        <option value="25">Last 25</option>
                        <option value="30">Last 30</option>
                    </select>
                </label>
                </div>

                <div class="ccm-automation-card">
                    <h5>Knowledge Updates</h5>

                <label class="ccm-toggle-row">
                    <input
                        type="checkbox"
                        id="ccm-auto-knowledge"
                        ${char.settings?.autoKnowledge ? "checked" : ""}
                    >
                    Enable automatic updates
                </label>

                <label class="ccm-field-row">
                    <span>Frequency</span>

                    <select id="ccm-auto-knowledge-frequency">
                        <option value="10">Every 10 Replies</option>
						<option value="20">Every 20 Replies</option>
                        <option value="25">Every 25 Replies</option>
                        <option value="30">Every 30 Replies</option>
                        <option value="35">Every 35 Replies</option>
						<option value="40">Every 40 Replies</option>
                    </select>
                </label>

                <label class="ccm-field-row">
                    <span>Messages</span>

                    <select id="ccm-auto-knowledge-messages">
                        <option value="10">Last 10</option>
						<option value="20">Last 20</option>
                        <option value="25">Last 25</option>
                        <option value="30">Last 30</option>
                        <option value="35">Last 35</option>
                        <option value="40">Last 40</option>
                        <option value="45">Last 45</option>
						<option value="50">Last 50</option>
                    </select>
                </label>
                </div>
            </div>

        </details>
    `;
}

export function bindAutomationEvents(
    id,
    char
) {

    const autoState =
        document.getElementById(
            "ccm-auto-state"
        );

    const autoFrequency =
        document.getElementById(
            "ccm-auto-frequency"
        );

    const autoMessageCount =
        document.getElementById(
            "ccm-auto-message-count"
        );

	    const autoKnowledge =
        document.getElementById(
            "ccm-auto-knowledge"
        );

    const autoKnowledgeFrequency =
        document.getElementById(
            "ccm-auto-knowledge-frequency"
        );

    const autoKnowledgeMessages =
        document.getElementById(
            "ccm-auto-knowledge-messages"
        );

    if (autoMessageCount) {
        autoMessageCount.value =
            String(
                char.settings?.autoStateMessageCount || 10
            );
    }
	
	    if (autoKnowledge) {
        autoKnowledge.addEventListener(
            "change",
            saveAutomationSettings
        );
    }

    if (autoKnowledgeFrequency) {
        autoKnowledgeFrequency.addEventListener(
            "change",
            saveAutomationSettings
        );
    }

    if (autoKnowledgeMessages) {
        autoKnowledgeMessages.addEventListener(
            "change",
            saveAutomationSettings
        );
    }

    if (autoFrequency) {
        autoFrequency.value =
            String(
                char.settings?.autoStateFrequency || 1
            );
    }
	
	    if (autoKnowledgeFrequency) {
        autoKnowledgeFrequency.value =
            String(
                char.settings?.autoKnowledgeFrequency || 20
            );
    }

    if (autoKnowledgeMessages) {
        autoKnowledgeMessages.value =
            String(
                char.settings?.autoKnowledgeMessageCount || 30
            );
    }

    function saveAutomationSettings() {

        updateCharacter(
            id,
            {
                settings: {
                    ...char.settings,

                    autoState:
                        autoState.checked,

                    autoStateFrequency:
                        Number(
                            autoFrequency.value
                        ),

                    autoStateMessageCount:
                        Number(
                            autoMessageCount.value
                        ),

                    autoKnowledge:
                        autoKnowledge.checked,

                    autoKnowledgeFrequency:
                        Number(
                            autoKnowledgeFrequency.value
                        ),

                    autoKnowledgeMessageCount:
                        Number(
                            autoKnowledgeMessages.value
                        )
                }
            }
        );
    }

    if (autoState) {
        autoState.addEventListener(
            "change",
            saveAutomationSettings
        );
    }

    if (autoFrequency) {
        autoFrequency.addEventListener(
            "change",
            saveAutomationSettings
        );
    }

    if (autoMessageCount) {
        autoMessageCount.addEventListener(
            "change",
            saveAutomationSettings
        );
    }
}
