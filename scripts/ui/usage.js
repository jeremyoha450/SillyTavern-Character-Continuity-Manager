// scripts/ui/usage.js

import {
    getUsageStats,
    clearUsage
} from "../usage.js";

import {
    getCharacter
} from "../database.js";

function escapeHtml(value) {
    const element =
        document.createElement("div");
    element.textContent =
        String(value ?? "");
    return element.innerHTML;
}

function formatNumber(value) {
    return Number(value || 0)
        .toLocaleString();
}

function renderTotals(
    label,
    totals
) {
    return `
        <div class="ccm-usage-total-card">
            <strong>${label}</strong>
            <span>${formatNumber(totals.totalTokens)} tokens</span>
            <small>
                ${formatNumber(totals.inputTokens)} input ·
                ${formatNumber(totals.outputTokens)} output ·
                ${formatNumber(totals.requests)} requests
            </small>
            <small>
                ${formatNumber(totals.reportedRequests)} requests reported token counts
            </small>
        </div>
    `;
}

function renderBreakdown(
    title,
    values
) {

    const rows =
        Object.entries(values || {})
            .sort((a, b) =>
                (b[1].totalTokens || 0) -
                (a[1].totalTokens || 0)
            );

    return `
        <h4>${title}</h4>
        <div class="ccm-usage-breakdown">
            ${rows.length
                ? rows.map(([name, totals]) => `
                    <div>
                        <span>${escapeHtml(name)}</span>
                        <span>
                            ${formatNumber(totals.totalTokens)} tokens ·
                            ${formatNumber(totals.requests)} requests
                        </span>
                    </div>
                `).join("")
                : "<i>No usage recorded.</i>"
            }
        </div>
    `;
}

function renderRecent(entries) {
    return `
        <h4>Recent Requests</h4>
        <div class="ccm-usage-breakdown">
            ${entries.length
                ? entries.slice(0, 20).map(entry => `
                    <div>
                        <span>
                            ${escapeHtml(entry.taskName)} ·
                            ${escapeHtml(entry.providerName)}
                            ${entry.model ? ` · ${escapeHtml(entry.model)}` : ""}
                        </span>
                        <span>
                            ${entry.reported
                                ? `${formatNumber(entry.totalTokens)} tokens`
                                : "Usage not reported"}
                        </span>
                    </div>
                `).join("")
                : "<i>No usage recorded.</i>"
            }
        </div>
    `;
}

export function openUsageStats(
    characterId = ""
) {

    document
        .getElementById("ccm-usage-dialog")
        ?.remove();

    const character =
        characterId
            ? getCharacter(characterId)
            : null;

    const stats =
        getUsageStats(characterId);

    const dialog =
        document.createElement("div");

    dialog.id = "ccm-usage-dialog";
    dialog.innerHTML = `
        <div class="ccm-usage-card">
            <div class="ccm-usage-header">
                <h3>
                    Token Statistics${character ? `: ${escapeHtml(character.name)}` : ""}
                </h3>
                <button id="ccm-usage-close" type="button">✕</button>
            </div>

            <p class="ccm-usage-note">
                Counts come from normal CCM responses. No separate usage queries are made.
            </p>

            <div class="ccm-usage-totals">
                ${renderTotals("Lifetime", stats.lifetime)}
                ${renderTotals("This Session", stats.session)}
            </div>

            ${renderBreakdown("By Provider", stats.byProvider)}
            ${renderBreakdown("By Model", stats.byModel)}
            ${renderBreakdown("By Task", stats.byTask)}
            ${renderRecent(stats.recent)}

            <div class="ccm-usage-actions">
                <button id="ccm-usage-clear" type="button">
                    ${characterId
                        ? "Clear Character Statistics"
                        : "Clear All Statistics"}
                </button>
            </div>
        </div>
    `;

    (SillyTavern.getContext()
        ?.Popup?.util?.getTopmostModalLayer?.()
        || document.body).appendChild(dialog);

    const close = () => dialog.remove();

    dialog
        .querySelector("#ccm-usage-close")
        .addEventListener("click", close);

    dialog.addEventListener(
        "click",
        event => {
            if (event.target === dialog) close();
        }
    );

    dialog
        .querySelector("#ccm-usage-clear")
        .addEventListener(
            "click",
            () => {
                const scope = characterId
                    ? "this character's"
                    : "all";

                if (!confirm(
                    `Clear ${scope} token statistics?`
                )) {
                    return;
                }

                clearUsage(characterId);
                close();
                openUsageStats(characterId);
            }
        );
}
