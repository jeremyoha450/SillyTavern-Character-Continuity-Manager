// scripts/ui/settings.js

import {
    getDrivers
} from "../ai/registry.js";

import {
    getCharacterEnrollmentMode,
    setCharacterEnrollmentMode,
    getAISource,
    setAISource,
    getCurrentDriverId,
    setCurrentDriverId,
    getDriverSettings,
    setDriverSettings,
    getImageGenerationSettings,
    setImageGenerationSettings,
    getAllImagePromptPresetSettings,
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

import {
    DEBUG_CATEGORIES,
    clearDebugEntries,
    debugLog,
    setDebugSettings
} from "../debug-logger.js";

import { bindHealthPanel } from "./settings-health.js";
import { bindDebugPanel } from "./settings-debug.js";
import { bindTrainingDataPanel } from "./settings-training.js";
import { setTrainingDataSettings } from "../training-data.js";

import {
    createCustomPreset,
    createPresetExport,
    validateImportedPreset
} from "../image-preset-transfer.js";

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

    // This event contains no setting values; it only helps diagnose UI flow.
    debugLog("ui", "settings.opened", {
        operation: "open",
        status: "success"
    });

    document
        .getElementById("ccm-settings-dialog")
        ?.remove();

    const drivers =
        getDrivers();

    let imagePresets =
        getAllImagePromptPresetSettings();
    const builtInPresetIds = new Set(
        getImagePromptPresets().map(preset => preset.id)
    );

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
                    data-tab="general"
                    type="button"
                    role="tab"
                    aria-selected="true"
                >General</button>
                <button
                    class="ccm-settings-tab"
                    data-tab="provider"
                    type="button"
                    role="tab"
                    aria-selected="false"
                >AI Provider</button>
                <button
                    class="ccm-settings-tab"
                    data-tab="image"
                    type="button"
                    role="tab"
                    aria-selected="false"
                >Image Generation</button>
                <button
                    class="ccm-settings-tab"
                    data-tab="debug"
                    type="button"
                    role="tab"
                    aria-selected="false"
                >Debug / Logging</button>
                <button
                    class="ccm-settings-tab"
                    data-tab="training"
                    type="button"
                    role="tab"
                    aria-selected="false"
                >Training Data</button>
                <button
                    class="ccm-settings-tab"
                    data-tab="health"
                    type="button"
                    role="tab"
                    aria-selected="false"
                >Health</button>
            </div>

            <div class="ccm-settings-tab-panel" data-panel="general">
                <label class="ccm-settings-field">
                    ${renderHelpLabel(
                        "New Character Handling",
                        "Choose whether CCM asks before tracking an untracked character or adds them automatically when opened."
                    )}
                    <select id="ccm-settings-character-enrollment">
                        <option value="ask">Ask every time (Default)</option>
                        <option value="automatic">Add automatically</option>
                    </select>
                </label>
                <p class="ccm-settings-help">
                    This only applies to characters that have not already been added to CCM.
                </p>
            </div>

            <div
                class="ccm-settings-tab-panel"
                data-panel="provider"
                hidden
            >
                <label class="ccm-settings-field">
                    ${renderHelpLabel(
                        "Global AI Source",
                        "Choose CCM's separately configured provider or SillyTavern's currently active model. Routine State and Knowledge updates are frequent: a dedicated 7B–9B model is recommended, 4B is the practical minimum, and models below 4B are not recommended for reliable JSON."
                    )}
                    <select id="ccm-settings-ai-source">
                        <option value="ccm">CCM Provider (Recommended for routine updates)</option>
                        <option value="sillytavern">SillyTavern Active Model</option>
                    </select>
                </label>

                <p class="ccm-ai-source-note">
                    State and Knowledge automation can make many requests. Use a separate smaller CCM model when possible: 4B minimum, 7B–9B recommended. Reserve a larger SillyTavern model for detailed creation or difficult extraction.
                </p>

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
                    <div class="ccm-preset-transfer-actions">
                        <button id="ccm-preset-export" type="button">Export Selected Preset</button>
                        <button id="ccm-preset-import" type="button">Import Preset JSON</button>
                        <input id="ccm-preset-import-file" type="file" accept="application/json,.json" hidden>
                        <span id="ccm-preset-transfer-status" aria-live="polite"></span>
                    </div>
                </div>
            </div>

            <div
                class="ccm-settings-tab-panel"
                data-panel="debug"
                hidden
            >
                <div class="ccm-debug-privacy-note">
                    <strong>Local and private by design</strong>
                    <p>Debug logging is off by default. Logs stay in this browser on this SillyTavern device and are never sent anywhere by CCM. Standard logging excludes prompts, AI responses, character names, chat text, endpoints, headers, API keys and credentials.</p>
                </div>

                <details class="ccm-debug-report-help" open>
                    <summary>How to capture a useful problem report</summary>
                    <ol>
                        <li>Enable local debug logging.</li>
                        <li>Select the area where the problem occurs, or select <strong>Log all areas</strong> if you are unsure.</li>
                        <li>For AI generation, parsing, or incorrect-output problems, enable <strong>Include AI inputs and outputs</strong>. This may record private character or chat content.</li>
                        <li>Click <strong>Save Settings</strong>, then reproduce the problem.</li>
                        <li>Return here and click <strong>Download Log</strong>. Send that JSON file when asking for support.</li>
                    </ol>
                    <p><strong>Important:</strong> Logging is not retroactive. CCM cannot recover an event, AI request, or AI response that occurred while logging was disabled. Standard logging usually identifies where a failure happened; AI input/output capture is often needed to explain exactly why the model or parser failed. Visual layout problems may also require a screenshot.</p>
                </details>

                <label class="ccm-settings-checkbox">
                    <input id="ccm-debug-enabled" type="checkbox">
                    ${renderHelpLabel(
                        "Enable local debug logging",
                        "Records small structured diagnostic events locally. No prompt, response, chat, character or credential content is recorded."
                    )}
                </label>

                <label class="ccm-settings-checkbox">
                    <input id="ccm-debug-all" type="checkbox">
                    ${renderHelpLabel(
                        "Log all areas",
                        "Enables every diagnostic category. Individual category choices are ignored while this is selected."
                    )}
                </label>

                <div class="ccm-debug-sensitive-option">
                    <label class="ccm-settings-checkbox">
                        <input id="ccm-debug-ai-content" type="checkbox">
                        ${renderHelpLabel(
                            "Include AI inputs and outputs",
                            "Stores the prompts/messages sent to the AI and its returned output in the local log. This may include private character and chat content."
                        )}
                    </label>
                    <p><strong>Privacy warning:</strong> This can record character details, scenario text, chat excerpts, prompts, and generated responses. Content stays local and is limited to 20,000 characters per input/output. Recognizable API keys, authorization values, and secret tokens are redacted. Leave this off unless diagnosing an AI problem.</p>
                </div>

                <fieldset class="ccm-debug-categories">
                    <legend>Debug areas</legend>
                    ${DEBUG_CATEGORIES.map(([id, label]) => `
                        <label class="ccm-settings-checkbox">
                            <input type="checkbox" data-debug-category="${escapeAttribute(id)}">
                            ${escapeHtml(label)}
                        </label>
                    `).join("")}
                </fieldset>

                <div class="ccm-debug-options">
                    <label class="ccm-settings-field">
                        ${renderHelpLabel(
                            "Maximum saved entries",
                            "Older entries are automatically removed. Choose between 50 and 1000 entries."
                        )}
                        <input id="ccm-debug-max-entries" type="number" min="50" max="1000" step="50">
                    </label>
                    <label class="ccm-settings-checkbox">
                        <input id="ccm-debug-console" type="checkbox">
                        ${renderHelpLabel(
                            "Also show events in browser console",
                            "Mirrors the same privacy-safe structured events to the browser developer console."
                        )}
                    </label>
                </div>

                <label class="ccm-settings-field">
                    ${renderHelpLabel(
                        "Local diagnostic log",
                        "Newest entries appear first. The viewer contains the same privacy-safe information copied or downloaded below."
                    )}
                    <textarea id="ccm-debug-log-viewer" rows="12" readonly></textarea>
                </label>
                <div class="ccm-debug-log-actions">
                    <button id="ccm-debug-refresh" type="button">Refresh</button>
                    <button id="ccm-debug-copy" type="button">Copy Log</button>
                    <button id="ccm-debug-download" type="button">Download Log</button>
                    <button id="ccm-debug-clear" type="button">Clear Log</button>
                    <span id="ccm-debug-action-status" aria-live="polite"></span>
                </div>

                <div class="ccm-developer-mode-block">
                    <label class="ccm-settings-checkbox">
                        <input id="ccm-debug-developer-mode" type="checkbox">
                    ${renderHelpLabel(
                        "Developer Mode",
                        "Shows advanced troubleshooting tools for CCM development and support. Normal users should leave this off."
                    )}
                </label>
                <p class="ccm-settings-help">
                        Developer Mode is intended for focused diagnostics and request inspection. It can reveal technical metadata and may later expose private AI context only after explicit warnings.
                    </p>
                </div>

                <div
                    id="ccm-developer-tools"
                    class="ccm-developer-tools"
                    hidden
                >
                    <div class="ccm-debug-privacy-note">
                        <strong>Advanced developer tools</strong>
                        <p>Developer Mode is enabled. Advanced tools will appear here only when they are working and safe to use. No inactive placeholder buttons are shown.</p>
                    </div>

                    <div class="ccm-debug-report-help">
                        <strong>Current Developer Mode scope</strong>
                        <ul>
                            <li>Database Inspector: read-only counts and schema/storage summaries.</li>
                            <li>AI Context Viewer: captured request context and parser results when available.</li>
                            <li>Safe Debug Bundle: safe health, usage, request, retry, and log metadata export.</li>
                            <li>Advanced Health and request diagnostics/statistics.</li>
                        </ul>
                        <p><strong>Deferred:</strong> AI Benchmark and Recovery Tools are not active UI features.</p>
                    </div>
                </div>
            </div>

            <div
                class="ccm-settings-tab-panel"
                data-panel="training"
                hidden
            >
                <div class="ccm-debug-privacy-note">
                    <strong>Training Data Collection is off by default</strong>
                    <p>This is for building high-quality examples for a future CCM specialist model. If enabled, CCM stores the exact AI input messages, raw AI responses, parsed outputs, failures, and retry counts for supported AI tasks.</p>
                    <p><strong>Privacy warning:</strong> records may include private character details, scenarios, roleplay/chat text, image prompts, and generated card content. CCM redacts recognizable API keys, headers, and bearer tokens, but you should review exports before sharing them.</p>
                </div>

                <label class="ccm-settings-checkbox">
                    <input id="ccm-training-enabled" type="checkbox">
                    ${renderHelpLabel(
                        "Enable Training Data Collection",
                        "Explicit opt-in. When enabled, CCM stores AI training examples locally for supported tasks. This may include private character and chat content."
                    )}
                </label>

                <label class="ccm-settings-field">
                    ${renderHelpLabel(
                        "Maximum saved records",
                        "Older training examples are automatically removed. Choose between 10 and 2000 records."
                    )}
                    <input id="ccm-training-max-records" type="number" min="10" max="2000" step="10">
                </label>

                <p class="ccm-settings-help">
                    Collected records: <strong id="ccm-training-count">0</strong>
                </p>

                <div class="ccm-debug-log-actions">
                    <button id="ccm-training-refresh" type="button">Refresh Count</button>
                    <button id="ccm-training-export" type="button">Export Training Data JSON</button>
                    <button id="ccm-training-clear" type="button">Clear Training Data</button>
                    <span id="ccm-training-action-status" aria-live="polite"></span>
                </div>
            </div>

            <div
                class="ccm-settings-tab-panel"
                data-panel="health"
                hidden
            >
                <p class="ccm-settings-help">Compatibility and configuration information only. API keys, credentials, prompts, and character/chat content are never shown here.</p>
                <div id="ccm-health-summary" class="ccm-health-summary" aria-live="polite">Loading health information…</div>
                <div class="ccm-health-actions">
                    <button id="ccm-health-refresh" type="button">Refresh Health</button>
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

    const characterEnrollmentSelect =
        dialog.querySelector(
            "#ccm-settings-character-enrollment"
        );

    characterEnrollmentSelect.value =
        getCharacterEnrollmentMode();

    const aiSourceSelect =
        dialog.querySelector("#ccm-settings-ai-source");

    aiSourceSelect.value =
        getAISource();

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

    const debugPanel = bindDebugPanel(dialog);
    const trainingPanel = bindTrainingDataPanel(dialog);
    bindHealthPanel(dialog);

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

    const exportPresetButton = dialog.querySelector("#ccm-preset-export");
    const importPresetButton = dialog.querySelector("#ccm-preset-import");
    const importPresetFile = dialog.querySelector("#ccm-preset-import-file");
    const transferStatus = dialog.querySelector("#ccm-preset-transfer-status");

    const presetOptions = (includeNone = false) =>
        `${includeNone ? '<option value="">None</option>' : '<option value="">Select preset</option>'}` +
        imagePresets.map(preset => `
            <option value="${escapeAttribute(preset.id)}">
                ${escapeHtml(preset.label)}${preset.custom ? " (Custom)" : ""}
            </option>
        `).join("");

    const refreshPresetDropdowns = () => {
        const defaultValue = imagePresetSelect.value;
        const editValue = editingPresetId;
        imagePresetSelect.innerHTML = presetOptions(true);
        editPresetSelect.innerHTML = presetOptions(false);
        imagePresetSelect.value = presetDrafts[defaultValue] ? defaultValue : "";
        editPresetSelect.value = presetDrafts[editValue] ? editValue : "";
    };

    const setTransferStatus = message => {
        transferStatus.textContent = message;
    };

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

        restorePresetButton.disabled = !builtInPresetIds.has(id);
        exportPresetButton.disabled = false;

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

    exportPresetButton.addEventListener("click", () => {
        capturePresetEditor();
        const id = editingPresetId || imagePresetSelect.value;
        const preset = presetDrafts[id];
        if (!preset) {
            setTransferStatus("Select a preset to export.");
            return;
        }
        const blob = new Blob(
            [JSON.stringify(createPresetExport(preset), null, 2)],
            { type: "application/json" }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ccm-image-preset-${preset.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setTransferStatus(`Exported ${preset.label}.`);
    });

    importPresetButton.addEventListener("click", () => importPresetFile.click());
    importPresetFile.addEventListener("change", async () => {
        const file = importPresetFile.files?.[0];
        importPresetFile.value = "";
        if (!file) return;
        try {
            const imported = validateImportedPreset(JSON.parse(await file.text()));
            const existing = presetDrafts[imported.id];
            let preset;
            if (existing && confirm(`A preset named '${existing.label}' already uses this ID. Overwrite its saved settings?`)) {
                preset = {
                    ...imported,
                    id: existing.id,
                    label: existing.label,
                    custom: !builtInPresetIds.has(existing.id)
                };
            } else {
                const requestedName = prompt(
                    "Save imported preset as:",
                    existing ? `${imported.label} (Imported)` : imported.label
                );
                if (requestedName === null) return;
                preset = createCustomPreset(
                    imported,
                    requestedName,
                    Object.keys(presetDrafts)
                );
            }

            setImagePromptPresetSettings(preset.id, preset);
            saveSettings();
            presetDrafts[preset.id] = getImagePromptPresetSettings(preset.id);
            imagePresets = Object.values(presetDrafts)
                .sort((a, b) => a.label.localeCompare(b.label));
            editingPresetId = preset.id;
            refreshPresetDropdowns();
            editPresetSelect.value = preset.id;
            renderPresetEditor(preset.id);
            setTransferStatus(`Imported ${preset.label}.`);
        } catch (error) {
            setTransferStatus(error.message || "Preset import failed.");
        }
    });

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

                setDebugSettings({
                    enabled: false,
                    categories: [],
                    allCategories: false,
                    includeAIContent: false,
                    developerMode: false,
                    mirrorToConsole: false,
                    maxEntries: 250
                });
                clearDebugEntries();
                setTrainingDataSettings({
                    enabled: false,
                    maxRecords: 100
                });

                providerSelect.value =
                    getCurrentDriverId();

                characterEnrollmentSelect.value =
                    getCharacterEnrollmentMode();

                aiSourceSelect.value =
                    getAISource();

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

                debugPanel.renderSettings();
                debugPanel.renderLog();
                trainingPanel.renderSettings();
                trainingPanel.renderCount();

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

                setCharacterEnrollmentMode(
                    characterEnrollmentSelect.value
                );

                setAISource(
                    aiSourceSelect.value
                );

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

                setDebugSettings(debugPanel.getValues());
                setTrainingDataSettings(trainingPanel.getValues());

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
