// scripts/ui/history.js

// confidence.js
import {
    renderConfidence
} from "./confidence.js";

// section-state.js
import {
    loadSectionState
} from "./section-state.js";

import {
    escapeHtml
} from "./escape.js";

export function renderHistory(
    char
) {

    return `
        <details
            id="ccm-history-section"
            class="ccm-dashboard-section"
            ${loadSectionState(char.id, "history") ? "open" : ""}
        >

            <summary>
                <span>Recent History</span>
                <small>${(char.history || []).length} updates</small>
            </summary>

            <div id="ccm-history" class="ccm-section-content">

                ${
                    (char.history || []).length
                        ? char.history
                            .slice(0, 10)
                            .map(item => `
                                <details class="ccm-history-item">
                                    <summary>
                                        <strong>${escapeHtml(item.type)}</strong>
                                        —
                                        ${new Date(item.timestamp).toLocaleString()}
                                        —
                                        ${item.changes.length} change(s)
                                    </summary>

                                    <div class="ccm-history-changes">
                                        ${
                                            item.changes
                                                .map(change => `
                                                    <div class="ccm-history-change">
                                                        <strong>${escapeHtml(change.field)}</strong><br>
                                                        <small>
                                                            ${escapeHtml(change.old?.value || "")}
                                                            →
                                                            ${escapeHtml(change.new?.value || "")}
                                                        </small>
                                                    </div>
                                                `)
                                                .join("")
                                        }
                                    </div>
                                </details>
                            `)
                            .join("")
                        : "<p class=\"ccm-empty-state\">No history yet.</p>"
                }

            </div>

        </details>
    `;
}
