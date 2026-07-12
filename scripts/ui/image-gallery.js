import {
    updateCharacter
} from "../database.js";

import {
    getImageRecord,
    removeImageRecord
} from "../image-history.js";

import {
    openSavedImagePrompt
} from "./image-prompt.js";

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value) {
    if (!value) return "Unknown date";

    return new Date(value)
        .toLocaleString();
}

function formatStatus(record) {
    if (record.imageUrl) return "Generated";
    if (record.status === "failed") return "Failed";
    if (record.status === "generating") return "Generating";
    return "Prompt only";
}

function renderImageTile(
    record,
    className = ""
) {
    return `
        <button
            type="button"
            class="ccm-gallery-tile ${className}"
            data-ccm-image-record="${escapeHtml(record.id)}"
            title="Open image details"
        >
            <img
                src="${escapeHtml(record.imageUrl)}"
                alt="Generated image"
                loading="lazy"
            >
            <span class="ccm-gallery-missing">Image unavailable</span>
        </button>
    `;
}

export function renderImageWorkspace(
    character
) {
    const history =
        Array.isArray(character.imageHistory)
            ? character.imageHistory
            : [];

    const images =
        history.filter(record =>
            record.imageUrl
        );

    const latest = images[0];

    return `
        <section class="ccm-dashboard-action-section ccm-image-workspace">
            <h4>Latest Image</h4>
            ${latest
                ? `
                    <div class="ccm-latest-image">
                        ${renderImageTile(latest, "ccm-gallery-tile-latest")}
                        <div class="ccm-latest-image-meta">
                            <strong>${escapeHtml(latest.presetLabel || "Image Prompt")}</strong>
                            <span>${escapeHtml(formatDate(latest.generatedAt || latest.createdAt))}</span>
                        </div>
                    </div>
                `
                : `<p class="ccm-empty-message">No generated images yet.</p>`
            }

            <details class="ccm-image-subsection">
                <summary>Gallery (${images.length})</summary>
                ${images.length
                    ? `
                        <div class="ccm-gallery-grid">
                            ${images.map(record =>
                                renderImageTile(record)
                            ).join("")}
                        </div>
                    `
                    : `<p class="ccm-empty-message">No images to display.</p>`
                }
            </details>

            <details class="ccm-image-subsection">
                <summary>Prompt History (${history.length})</summary>
                ${history.length
                    ? `
                        <div class="ccm-prompt-history-list">
                            ${history.map(record => `
                                <article class="ccm-prompt-history-item">
                                    <div class="ccm-prompt-history-meta">
                                        <strong>${escapeHtml(record.presetLabel || "Saved Prompt")}</strong>
                                        <span>${escapeHtml(formatStatus(record))} • ${escapeHtml(formatDate(record.createdAt))}</span>
                                    </div>
                                    <p>${escapeHtml(record.positive || "Empty prompt")}</p>
                                    ${record.error
                                        ? `<small class="ccm-prompt-error">${escapeHtml(record.error)}</small>`
                                        : ""
                                    }
                                    <div class="ccm-prompt-history-actions">
                                        <button
                                            type="button"
                                            data-ccm-copy-record="${escapeHtml(record.id)}"
                                        >Copy Prompt</button>
                                        <button
                                            type="button"
                                            data-ccm-reuse-record="${escapeHtml(record.id)}"
                                        >Use Again</button>
                                        <button
                                            type="button"
                                            class="ccm-danger-button"
                                            data-ccm-remove-record="${escapeHtml(record.id)}"
                                        >Remove</button>
                                        ${record.imageUrl
                                            ? `
                                                <button
                                                    type="button"
                                                    data-ccm-image-record="${escapeHtml(record.id)}"
                                                >View Image</button>
                                            `
                                            : ""
                                        }
                                    </div>
                                </article>
                            `).join("")}
                        </div>
                    `
                    : `<p class="ccm-empty-message">No saved prompts yet.</p>`
                }
            </details>
        </section>
    `;
}

async function copyRecordPrompt(record) {
    const text = record.negative
        ? `${record.positive}\n\nNegative prompt:\n${record.negative}`
        : record.positive;

    if (navigator.clipboard) {
        await navigator.clipboard
            .writeText(text);
        return;
    }

    const textarea =
        document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
}

function showImageDetails(
    characterId,
    record,
    actions,
    groupId = ""
) {
    document
        .getElementById(
            "ccm-image-details-dialog"
        )
        ?.remove();

    const dialog =
        document.createElement("div");

    dialog.id =
        "ccm-image-details-dialog";

    dialog.innerHTML = `
        <div class="ccm-image-details-card">
            <div class="ccm-image-prompt-header">
                <h3>Image Details</h3>
                <button id="ccm-image-details-close" type="button">✕</button>
            </div>

            <div class="ccm-image-details-preview">
                <img src="${escapeHtml(record.imageUrl)}" alt="Generated image">
                <span class="ccm-gallery-missing">Image unavailable</span>
            </div>

            <p class="ccm-image-details-meta">
                ${escapeHtml(record.presetLabel || "Saved Prompt")}
                • ${escapeHtml(formatDate(record.generatedAt || record.createdAt))}
            </p>

            <label for="ccm-image-details-positive">Positive Prompt</label>
            <textarea id="ccm-image-details-positive" readonly></textarea>

            ${record.negative
                ? `
                    <label for="ccm-image-details-negative">Negative Prompt</label>
                    <textarea id="ccm-image-details-negative" readonly></textarea>
                `
                : ""
            }

            <div class="ccm-image-details-actions">
                <button id="ccm-image-details-copy" type="button">Copy Prompt</button>
                <button id="ccm-image-details-reuse" type="button">Use Again</button>
                <button id="ccm-image-details-character" type="button">Set as Character Image</button>
                <button id="ccm-image-details-open" type="button">Open SillyTavern Image</button>
                <button id="ccm-image-details-remove" class="ccm-danger-button" type="button">Remove from CCM History</button>
            </div>
        </div>
    `;

    (SillyTavern.getContext()
        ?.Popup?.util?.getTopmostModalLayer?.()
        || document.body).appendChild(dialog);

    dialog.querySelector(
        "#ccm-image-details-positive"
    ).value = record.positive || "";

    const negative = dialog.querySelector(
        "#ccm-image-details-negative"
    );
    if (negative) {
        negative.value = record.negative;
    }

    const preview = dialog.querySelector(
        ".ccm-image-details-preview"
    );
    preview.querySelector("img")
        .addEventListener("error", () => {
            preview.classList.add(
                "is-missing"
            );
        });

    const close = () => {
        document.removeEventListener(
            "keydown",
            onKeyDown
        );
        dialog.remove();
    };

    const onKeyDown = event => {
        if (event.key === "Escape") {
            close();
        }
    };

    document.addEventListener(
        "keydown",
        onKeyDown
    );

    dialog.querySelector(
        "#ccm-image-details-close"
    ).addEventListener("click", close);

    dialog.addEventListener("click", event => {
        if (event.target === dialog) close();
    });

    dialog.querySelector(
        "#ccm-image-details-copy"
    ).addEventListener("click", async event => {
        await copyRecordPrompt(record);
        event.currentTarget.textContent = "Copied";
    });

    dialog.querySelector(
        "#ccm-image-details-reuse"
    ).addEventListener("click", () => {
        close();
        openSavedImagePrompt(
            characterId,
            record,
            () => actions.renderCharacterDashboard(
                characterId,
                groupId
            ),
            groupId
        );
    });

    dialog.querySelector(
        "#ccm-image-details-character"
    ).addEventListener("click", () => {
        updateCharacter(characterId, {
            image: record.imageUrl
        });
        close();
        actions.renderCharacterDashboard(
            characterId,
            groupId
        );
    });

    dialog.querySelector(
        "#ccm-image-details-open"
    ).addEventListener("click", () => {
        window.open(
            record.imageUrl,
            "_blank",
            "noopener,noreferrer"
        );
    });

    dialog.querySelector(
        "#ccm-image-details-remove"
    ).addEventListener("click", () => {
        if (!confirm(
            "Remove this image and prompt from CCM history? The SillyTavern image file will not be deleted."
        )) {
            return;
        }

        removeImageRecord(
            characterId,
            record.id,
            groupId
        );
        close();
        actions.renderCharacterDashboard(
            characterId,
            groupId
        );
    });
}

export function bindImageWorkspaceEvents(
    characterId,
    actions,
    groupId = ""
) {
    const workspace =
        document.querySelector(
            ".ccm-image-workspace"
        );

    if (!workspace) return;

    workspace.querySelectorAll(
        ".ccm-gallery-tile img"
    ).forEach(image => {
        image.addEventListener("error", () => {
            image.closest(
                ".ccm-gallery-tile"
            )?.classList.add("is-missing");
        });
    });

    workspace.addEventListener(
        "click",
        async event => {
            const imageButton =
                event.target.closest(
                    "[data-ccm-image-record]"
                );

            if (imageButton) {
                const record =
                    getImageRecord(
                        characterId,
                        imageButton.dataset
                            .ccmImageRecord,
                        groupId
                    );

                if (record) {
                    showImageDetails(
                        characterId,
                        record,
                        actions,
                        groupId
                    );
                }
                return;
            }

            const copyButton =
                event.target.closest(
                    "[data-ccm-copy-record]"
                );

            if (copyButton) {
                const record =
                    getImageRecord(
                        characterId,
                        copyButton.dataset
                            .ccmCopyRecord,
                        groupId
                    );

                if (record) {
                    await copyRecordPrompt(record);
                    copyButton.textContent =
                        "Copied";
                }
                return;
            }

            const reuseButton =
                event.target.closest(
                    "[data-ccm-reuse-record]"
                );

            if (reuseButton) {
                const record =
                    getImageRecord(
                        characterId,
                        reuseButton.dataset
                            .ccmReuseRecord,
                        groupId
                    );

                if (record) {
                    openSavedImagePrompt(
                        characterId,
                        record,
                        () => actions
                            .renderCharacterDashboard(
                                characterId,
                                groupId
                            ),
                        groupId
                    );
                }
                return;
            }

            const removeButton =
                event.target.closest(
                    "[data-ccm-remove-record]"
                );

            if (removeButton) {
                const recordId =
                    removeButton.dataset
                        .ccmRemoveRecord;

                if (!confirm(
                    "Remove this prompt from CCM history? The SillyTavern image file will not be deleted."
                )) {
                    return;
                }

                removeImageRecord(
                    characterId,
                    recordId,
                    groupId
                );

                actions.renderCharacterDashboard(
                    characterId,
                    groupId
                );
            }
        }
    );
}
