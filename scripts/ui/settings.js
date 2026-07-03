// scripts/ui/settings.js

import {
    getDrivers
} from "../ai/registry.js";

import {
    getCurrentDriverId,
    setCurrentDriverId,
    getDriverSettings,
    setDriverSettings,
    getImageGenerationSettings,
    setImageGenerationSettings,
    getImagePromptPresetSettings,
    setImagePromptPresetSettings,
    resetImagePromptPreset,
    resetAllImagePromptPresets,
    saveSettings,
    resetSettings
} from "../ai/settings.js";

import {
    getImagePromptPresets
} from "../tasks/image/presets/registry.js";

function escapeHtml(value) {

    const element =
        document.createElement("div");

    element.textContent =
        String(value ?? "");

    return element.innerHTML;
}

function escapeAttribute(value) {

    return escapeHtml(value)
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

const SETTING_HELP = {
    endpoint:
        "The base URL CCM uses to contact this provider's API.",
    apiKey:
        "The API key used to authenticate requests with this provider. Leave it empty only when the provider allows that.",
    model:
        "The model ID CCM sends with Facts, State, Knowledge, and Image Prompt requests.",
    maxTokens:
        "Optional maximum number of tokens Anthropic may return in one response.",
    siteUrl:
        "Optional website URL sent to OpenRouter for application attribution.",
    appName:
        "Optional application name sent to OpenRouter for attribution."
};

function renderHelpLabel(
    label,
    help
) {

    return `
        <span class="ccm-settings-label">
            <span>${escapeHtml(label)}</span>
            <span
                class="ccm-settings-tooltip"
                title="${escapeAttribute(help)}"
                aria-label="${escapeAttribute(help)}"
                tabindex="0"
            >?</span>
        </span>
    `;
}

function renderProviderFields(
    container,
    driverId
) {

    const driver =
        getDrivers().find(
            item => item.id === driverId
        );

    if (!driver) {
        container.innerHTML =
            driverId
                ? "<p>The selected AI provider is unavailable.</p>"
                : "<p>Select an AI provider to configure it.</p>";
        return;
    }

    const values =
        getDriverSettings(driver.id);

    container.innerHTML =
        driver.settings.map(field => `
            <label class="ccm-settings-field">
                ${renderHelpLabel(
                    field.label,
                    SETTING_HELP[field.id] ||
                    `Configures ${field.label} for the selected AI provider.`
                )}
                <input
                    data-setting-id="${escapeAttribute(field.id)}"
                    type="${escapeAttribute(field.type || "text")}"
                    value="${escapeAttribute(values[field.id] ?? "")}"
                    autocomplete="off"
                >
            </label>
        `).join("") +
        (
            typeof driver.listModels === "function"
                ? `
                    <div class="ccm-model-discovery">
                        <label
                            class="ccm-settings-field"
                            id="ccm-available-models-field"
                        >
                            ${renderHelpLabel(
                                "Available Models",
                                "Models reported by the connected provider. Selecting one copies its ID into the Model field."
                            )}
                            <select id="ccm-available-models">
                                <option value="">None</option>
                            </select>
                        </label>

                        <button
                            id="ccm-refresh-models"
                            type="button"
                        >
                            Connect
                        </button>
                    </div>
                `
                : ""
        );

    const refreshButton =
        container.querySelector(
            "#ccm-refresh-models"
        );

    refreshButton?.addEventListener(
        "click",
        async () => {

            const status =
                container.closest(
                    "#ccm-settings-dialog"
                )?.querySelector(
                    "#ccm-settings-status"
                );

            const currentValues = {};

            container
                .querySelectorAll("[data-setting-id]")
                .forEach(input => {
                    currentValues[input.dataset.settingId] =
                        input.value.trim();
                });

            refreshButton.disabled = true;
            refreshButton.textContent =
                "Connecting...";

            if (status) {
                status.dataset.state =
                    "connecting";
                status.textContent =
                    "Connecting...";
            }

            try {

                const models =
                    await driver.listModels(
                        currentValues
                    );

                const select =
                    container.querySelector(
                        "#ccm-available-models"
                    );

                select.innerHTML =
                    `<option value="">None</option>` +
                    models.map(model => `
                        <option value="${escapeAttribute(model)}">
                            ${escapeHtml(model)}
                        </option>
                    `).join("");

                const modelInput =
                    container.querySelector(
                        '[data-setting-id="model"]'
                    );

                if (models.length === 1) {

                    select.value = models[0];

                    if (modelInput) {
                        modelInput.value = models[0];
                    }

                } else if (
                    modelInput &&
                    models.includes(modelInput.value)
                ) {
                    select.value = modelInput.value;
                }

                select.onchange = () => {
                    if (modelInput) {
                        modelInput.value = select.value;
                    }
                };

                if (status) {
                    status.dataset.state =
                        "valid";
                    status.textContent =
                        "Valid";
                }

            } catch (error) {

                console.error(
                    "[CCM] Failed To Load Models",
                    error
                );

                if (status) {
                    status.dataset.state =
                        "invalid";
                    status.textContent =
                        "Not connected";
                    status.title =
                        error.message ||
                        "Could not connect";
                }

            } finally {

                refreshButton.disabled = false;
                refreshButton.textContent =
                    "Connect";
            }
        }
    );
}

export function openSettings() {

    document
        .getElementById("ccm-settings-dialog")
        ?.remove();

    const drivers =
        getDrivers();

    const imagePresets =
        getImagePromptPresets();

    const dialog =
        document.createElement("div");

    dialog.id =
        "ccm-settings-dialog";

    dialog.innerHTML = `
        <div class="ccm-settings-card">
            <div class="ccm-settings-header">
                <h3>CCM Settings</h3>
                <button id="ccm-settings-close" type="button">✕</button>
            </div>

            <div class="ccm-settings-tabs" role="tablist">
                <button
                    class="ccm-settings-tab is-active"
                    data-tab="provider"
                    type="button"
                    role="tab"
                    aria-selected="true"
                >AI Provider</button>
                <button
                    class="ccm-settings-tab"
                    data-tab="image"
                    type="button"
                    role="tab"
                    aria-selected="false"
                >Image Generation</button>
            </div>

            <div class="ccm-settings-tab-panel" data-panel="provider">
                <label class="ccm-settings-field">
                    ${renderHelpLabel(
                        "Default AI Provider",
                        "The provider CCM uses for all AI tasks, including Facts, State, Knowledge, and Image Prompt generation."
                    )}
                    <select id="ccm-settings-provider">
                        <option value="">Select Provider</option>
                        ${drivers.map(driver => `
                            <option value="${escapeAttribute(driver.id)}">
                                ${escapeHtml(driver.name)}
                            </option>
                        `).join("")}
                    </select>
                </label>

                <div id="ccm-settings-provider-fields"></div>

                <span
                    id="ccm-settings-status"
                    data-state="invalid"
                    aria-live="polite"
                >Not connected</span>
            </div>

            <div
                class="ccm-settings-tab-panel"
                data-panel="image"
                hidden
            >
                <label class="ccm-settings-field">
                    ${renderHelpLabel(
                        "Default Prompt Preset",
                        "The saved image prompt preset CCM uses automatically when Image Prompt is clicked."
                    )}
                    <select id="ccm-settings-image-preset">
                        <option value="">None</option>
                        ${imagePresets.map(preset => `
                            <option value="${escapeAttribute(preset.id)}">
                                ${escapeHtml(preset.label)}
                            </option>
                        `).join("")}
                    </select>
                </label>
                <p class="ccm-settings-help">
                    This preset is used automatically when generating an image prompt.
                </p>

                <div class="ccm-preset-editor">
                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Preset to Edit",
                            "Chooses which saved preset copy is displayed in the editor below. This does not change the default generation preset."
                        )}
                        <select id="ccm-settings-edit-preset">
                            <option value="">Select preset</option>
                            ${imagePresets.map(preset => `
                                <option value="${escapeAttribute(preset.id)}">
                                    ${escapeHtml(preset.label)}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <div class="ccm-preset-editor-grid">
                        <label class="ccm-settings-field">
                            ${renderHelpLabel(
                                "Formatting Mode",
                                "Tags produces comma-separated prompt components. Natural Language combines the generated prompt, prefix, and suffix as prose."
                            )}
                            <select id="ccm-preset-mode">
                                <option value=""></option>
                                <option value="tags">Tags</option>
                                <option value="natural-language">Natural Language</option>
                            </select>
                        </label>

                        <label class="ccm-settings-checkbox">
                            <input id="ccm-preset-preserve-underscores" type="checkbox">
                            ${renderHelpLabel(
                                "Preserve underscores",
                                "Keeps underscores in tags such as score_9 and source_anime. Disable it for models that expect spaces instead."
                            )}
                        </label>
                    </div>

                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "System Prompt — sent to the AI",
                            "Instructions sent to the selected AI provider describing how it should build this model's image prompt."
                        )}
                        <textarea id="ccm-preset-system-prompt" rows="12"></textarea>
                    </label>

                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Prefix",
                            "Fixed text CCM inserts at the beginning of every final prompt made with this preset."
                        )}
                        <textarea id="ccm-preset-prefix" rows="2"></textarea>
                    </label>

                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Suffix",
                            "Fixed text CCM appends to the end of every final prompt made with this preset."
                        )}
                        <textarea id="ccm-preset-suffix" rows="2"></textarea>
                    </label>

                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Quality Tags",
                            "Fixed model-specific quality tags CCM inserts locally into tag-formatted prompts."
                        )}
                        <textarea id="ccm-preset-quality-tags" rows="2"></textarea>
                    </label>

                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Score Tags",
                            "Fixed score tags inserted before quality and style tags. Primarily used by Pony models."
                        )}
                        <textarea id="ccm-preset-score-tags" rows="2"></textarea>
                    </label>

                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Style Tags",
                            "Fixed style or source tags CCM adds after score and quality tags."
                        )}
                        <textarea id="ccm-preset-style-tags" rows="2"></textarea>
                    </label>

                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Required Tags",
                            "Tags CCM always adds to the final tag-formatted prompt, even if the AI omits them."
                        )}
                        <textarea id="ccm-preset-required-tags" rows="2"></textarea>
                    </label>

                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Negative Prompt",
                            "Default negative prompt shown separately in the image prompt preview. It is not sent to the prompt-writing AI."
                        )}
                        <textarea id="ccm-preset-negative-prompt" rows="3"></textarea>
                    </label>

                    <p class="ccm-settings-help">
                        Tag fields accept comma-separated values. Prefix, suffix, tags, and negative prompts are applied locally after the AI responds.
                    </p>

                    <div class="ccm-preset-restore-actions">
                        <button id="ccm-preset-restore" type="button">Restore This Preset</button>
                        <button id="ccm-preset-restore-all" type="button">Restore All Presets</button>
                    </div>
                </div>
            </div>

            <div class="ccm-settings-actions">
                <div class="ccm-settings-action-buttons">
                    <button
                        id="ccm-settings-reset"
                        type="button"
                    >Clear Settings</button>

                    <button
                        id="ccm-settings-save"
                        type="button"
                    >Save Settings</button>
                </div>
            </div>
        </div>
    `;

    (SillyTavern.getContext()
        ?.Popup?.util?.getTopmostModalLayer?.()
        || document.body).appendChild(dialog);

    const providerSelect =
        dialog.querySelector("#ccm-settings-provider");

    const fieldsContainer =
        dialog.querySelector(
            "#ccm-settings-provider-fields"
        );

    const imagePresetSelect =
        dialog.querySelector(
            "#ccm-settings-image-preset"
        );

    imagePresetSelect.value =
        getImageGenerationSettings()
            .preset || "";

    const editPresetSelect =
        dialog.querySelector(
            "#ccm-settings-edit-preset"
        );

    const createPresetDrafts = () =>
        Object.fromEntries(
            imagePresets.map(preset => [
                preset.id,
                getImagePromptPresetSettings(
                    preset.id
                )
            ])
        );

    let presetDrafts =
        createPresetDrafts();

    let editingPresetId = "";

    editPresetSelect.value =
        editingPresetId;

    const parseTagList = value =>
        String(value || "")
            .split(/,|\r?\n/)
            .map(tag => tag.trim())
            .filter(Boolean);

    const presetEditorFields = [
        "#ccm-preset-mode",
        "#ccm-preset-preserve-underscores",
        "#ccm-preset-system-prompt",
        "#ccm-preset-prefix",
        "#ccm-preset-suffix",
        "#ccm-preset-quality-tags",
        "#ccm-preset-score-tags",
        "#ccm-preset-style-tags",
        "#ccm-preset-required-tags",
        "#ccm-preset-negative-prompt"
    ].map(selector =>
        dialog.querySelector(selector)
    );

    const restorePresetButton =
        dialog.querySelector(
            "#ccm-preset-restore"
        );

    const clearPresetEditor = () => {
        for (const field of presetEditorFields) {
            if (field.type === "checkbox") {
                field.checked = false;
            } else {
                field.value = "";
            }
            field.disabled = true;
        }

        restorePresetButton.disabled = true;
    };

    const renderPresetEditor = id => {

        const preset =
            presetDrafts[id];

        if (!preset) {
            clearPresetEditor();
            return;
        }

        for (const field of presetEditorFields) {
            field.disabled = false;
        }

        restorePresetButton.disabled = false;

        dialog.querySelector(
            "#ccm-preset-mode"
        ).value =
            preset.mode || "tags";

        dialog.querySelector(
            "#ccm-preset-preserve-underscores"
        ).checked =
            !!preset.preserveUnderscores;

        dialog.querySelector(
            "#ccm-preset-system-prompt"
        ).value =
            preset.systemPrompt || "";

        dialog.querySelector(
            "#ccm-preset-prefix"
        ).value =
            preset.prefix || "";

        dialog.querySelector(
            "#ccm-preset-suffix"
        ).value =
            preset.suffix || "";

        [
            ["quality", "qualityTags"],
            ["score", "scoreTags"],
            ["style", "styleTags"],
            ["required", "requiredTags"]
        ].forEach(([elementName, field]) => {
            dialog.querySelector(
                `#ccm-preset-${elementName}-tags`
            ).value =
                (preset[field] || [])
                    .join(", ");
        });

        dialog.querySelector(
            "#ccm-preset-negative-prompt"
        ).value =
            preset.negativePrompt || "";
    };

    const capturePresetEditor = () => {

        const current =
            presetDrafts[editingPresetId];

        if (!current) return;

        presetDrafts[editingPresetId] = {
            ...current,
            mode:
                dialog.querySelector(
                    "#ccm-preset-mode"
                ).value,
            preserveUnderscores:
                dialog.querySelector(
                    "#ccm-preset-preserve-underscores"
                ).checked,
            systemPrompt:
                dialog.querySelector(
                    "#ccm-preset-system-prompt"
                ).value,
            prefix:
                dialog.querySelector(
                    "#ccm-preset-prefix"
                ).value,
            suffix:
                dialog.querySelector(
                    "#ccm-preset-suffix"
                ).value,
            qualityTags:
                parseTagList(
                    dialog.querySelector(
                        "#ccm-preset-quality-tags"
                    ).value
                ),
            scoreTags:
                parseTagList(
                    dialog.querySelector(
                        "#ccm-preset-score-tags"
                    ).value
                ),
            styleTags:
                parseTagList(
                    dialog.querySelector(
                        "#ccm-preset-style-tags"
                    ).value
                ),
            requiredTags:
                parseTagList(
                    dialog.querySelector(
                        "#ccm-preset-required-tags"
                    ).value
                ),
            negativePrompt:
                dialog.querySelector(
                    "#ccm-preset-negative-prompt"
                ).value
        };
    };

    renderPresetEditor(
        editingPresetId
    );

    editPresetSelect.addEventListener(
        "change",
        () => {
            capturePresetEditor();
            editingPresetId =
                editPresetSelect.value;
            renderPresetEditor(
                editingPresetId
            );
        }
    );

    dialog
        .querySelector("#ccm-preset-restore")
        .addEventListener("click", () => {

            if (!editingPresetId) {
                return;
            }

            if (!confirm(
                `Restore ${presetDrafts[editingPresetId]?.label || editingPresetId} to its built-in default?`
            )) {
                return;
            }

            resetImagePromptPreset(
                editingPresetId
            );

            presetDrafts[editingPresetId] =
                getImagePromptPresetSettings(
                    editingPresetId
                );

            renderPresetEditor(
                editingPresetId
            );

            saveSettings();
        });

    dialog
        .querySelector("#ccm-preset-restore-all")
        .addEventListener("click", () => {

            if (!confirm(
                "Restore every image prompt preset to its built-in default?"
            )) {
                return;
            }

            resetAllImagePromptPresets();
            presetDrafts =
                createPresetDrafts();
            renderPresetEditor(
                editingPresetId
            );
            saveSettings();
        });

    dialog
        .querySelectorAll(".ccm-settings-tab")
        .forEach(button => {
            button.addEventListener("click", () => {
                dialog
                    .querySelectorAll(".ccm-settings-tab")
                    .forEach(tab => {
                        const active =
                            tab === button;

                        tab.classList.toggle(
                            "is-active",
                            active
                        );
                        tab.setAttribute(
                            "aria-selected",
                            String(active)
                        );
                    });

                dialog
                    .querySelectorAll(".ccm-settings-tab-panel")
                    .forEach(panel => {
                        panel.hidden =
                            panel.dataset.panel !==
                            button.dataset.tab;
                    });
            });
        });

    providerSelect.value =
        getCurrentDriverId();

    renderProviderFields(
        fieldsContainer,
        providerSelect.value
    );

    const selectedSettings =
        providerSelect.value
            ? getDriverSettings(
                providerSelect.value
            )
            : {};

    if (
        selectedSettings.endpoint ||
        selectedSettings.apiKey
    ) {
        fieldsContainer
            .querySelector("#ccm-refresh-models")
            ?.click();
    }

    providerSelect.addEventListener(
        "change",
        () => {

            renderProviderFields(
                fieldsContainer,
                providerSelect.value
            );

            const status =
                dialog.querySelector(
                    "#ccm-settings-status"
                );

            status.dataset.state =
                "invalid";
            status.textContent =
                "Not connected";
            status.removeAttribute("title");
        }
    );

    const close =
        () => dialog.remove();

    dialog
        .querySelector("#ccm-settings-close")
        .addEventListener("click", close);

    dialog.addEventListener(
        "click",
        event => {
            if (event.target === dialog) close();
        }
    );

    dialog
        .querySelector("#ccm-settings-reset")
        .addEventListener(
            "click",
            () => {

                if (!confirm(
                    "Clear all saved CCM settings?"
                )) {
                    return;
                }

                resetSettings();

                providerSelect.value =
                    getCurrentDriverId();

                renderProviderFields(
                    fieldsContainer,
                    providerSelect.value
                );

                imagePresetSelect.value =
                    getImageGenerationSettings()
                        .preset || "";

                presetDrafts =
                    createPresetDrafts();

                editingPresetId = "";

                editPresetSelect.value =
                    editingPresetId;

                renderPresetEditor(
                    editingPresetId
                );

                const status =
                    dialog.querySelector(
                        "#ccm-settings-status"
                    );

                status.dataset.state =
                    "invalid";
                status.textContent =
                    "Not connected";
                status.removeAttribute("title");
            }
        );

    dialog
        .querySelector("#ccm-settings-save")
        .addEventListener(
            "click",
            () => {

                capturePresetEditor();

                for (
                    const [presetId, preset]
                    of Object.entries(
                        presetDrafts
                    )
                ) {
                    setImagePromptPresetSettings(
                        presetId,
                        preset
                    );
                }

                const driverId =
                    providerSelect.value;

                const values = {};

                fieldsContainer
                    .querySelectorAll("[data-setting-id]")
                    .forEach(input => {
                        values[input.dataset.settingId] =
                            input.value.trim();
                    });

                setCurrentDriverId(driverId);

                if (driverId) {
                    setDriverSettings(
                        driverId,
                        values
                    );
                }

                setImageGenerationSettings({
                    preset:
                        imagePresetSelect.value
                });

                const saved =
                    saveSettings();

                const saveButton =
                    dialog.querySelector(
                        "#ccm-settings-save"
                    );

                saveButton.textContent =
                    saved
                        ? "Saved"
                        : "Could Not Save";

                setTimeout(
                    () => {
                        if (saveButton.isConnected) {
                            saveButton.textContent =
                                "Save Settings";
                        }
                    },
                    1500
                );
            }
        );
}
