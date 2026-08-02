import { execute } from "../ai/index.js";
import {
    createSillyTavernCharacter,
    createSillyTavernGroup,
    getSillyTavernCharacter,
    refreshSillyTavernCharacters
} from "../sillytavern-characters.js";
import { escapeHtml } from "./escape.js";
import {
    normalizeImportedCard,
    readCharacterCardFile
} from "../character-card-import.js";
import {
    CARD_LENGTHS,
    CARD_TYPES,
    COMMON_CHARACTER_TAGS,
    applyLockedCardDetails,
    buildCreatorImageContinuity,
    buildRelationshipSummaries,
    compareCreatorModels,
    estimateTokens,
    formatModelSpecs,
    filterTagSuggestions,
    generateCreatorClothing,
    lockCreatorPlan,
    mergeTagSuggestions,
    validateCreatorCard
} from "../character-creator-tools.js";
import {
    getAISource,
    getCurrentDriverId,
    getDriverSettings
} from "../ai/settings.js";
import { getDriver } from "../ai/registry.js";
import { getSillyTavernModelInfo } from "../ai/sillytavern.js";
import {
    getImageGenerationSettings,
    getImagePromptPresetSettings
} from "../ai/settings.js";
import { formatImagePrompt } from "../tasks/image/formatter.js";
import {
    generatedImageToFile,
    generateWithSillyTavernImage,
    getSillyTavernImageSetupError
} from "../sillytavern-image.js";
import { debugLog } from "../debug-logger.js";
import { showCCMError } from "./status.js";
import {
    combineClothingParts,
    creatorExample,
    parseClothingParts
} from "./character-creator-examples.js";

const splitLines = value => String(value || "").split("\n").map(x => x.trim()).filter(Boolean);
const CREATOR_DRAFT_KEY = "ccm-character-creator-draft-v1";

function helpTip(text) {
    return `<span class="ccm-creator-help" tabindex="0" title="${escapeHtml(text)}">?</span>`;
}

function labelText(label, tip = label) {
    return `<span>${escapeHtml(label)} ${helpTip(tip)}</span>`;
}

function exampleHint(value) {
    if (!value) return "";
    return `<small class="ccm-creator-example"><span>Example: ${escapeHtml(value)}</span><button type="button" data-use-example data-example-value="${escapeHtml(value)}">Use Example</button></small>`;
}

function textarea(label, name, value, rows = 5, tip = label, ai = false, example = "") {
    return `<label class="ccm-creator-field">${labelText(label, tip)}${ai ? `<button type="button" class="ccm-field-ai" data-ai-field="${name}">✨ AI</button>` : ""}<textarea name="${name}" rows="${rows}">${escapeHtml(value || "")}</textarea>${exampleHint(example)}</label>`;
}

function blankCard(index, type = "character") {
    const nonCharacter = type === "world" || type === "narrator" || type === "tool";
    return {
        name: `Character ${index + 1}`,
        nickname: "",
        description: nonCharacter
            ? "[Purpose]\n\n[Core Concept]\n\n[Rules]\n\n[Capabilities]\n\n[User Experience]\n"
            : "[Identity]\n\n[Appearance]\n\n[Background]\n\n[Abilities]\n\n[Relationships]\n",
        personality: nonCharacter
            ? "[Operating Style]\n\n[Voice]\n\n[Boundaries]\n"
            : "[Core Personality]\n\n[Behaviour]\n\n[Speech]\n",
        scenario: "",
        first_mes: "",
        mes_example: "",
        alternate_greetings: [],
        group_only_greetings: [],
        tags: [],
        creator_notes: "",
        system_prompt: "",
        post_history_instructions: "",
        talkativeness: 0.5,
        depth_prompt: "",
        character_book: { name: "", entries: [] }
    };
}

function getCreatorModelLabels() {
    const driverId = getCurrentDriverId();
    const driver = getDriver(driverId);
    const settings = driverId ? getDriverSettings(driverId) : {};
    const st = getSillyTavernModelInfo();

    return {
        ccm: `${driver?.name || "CCM Provider"} — ${settings.model || "No model selected"}`,
        sillytavern: `${st.provider} — ${st.model}${st.contextTokens ? ` — ${st.contextTokens.toLocaleString()} token context` : ""}`
    };
}

export function openCharacterCreator(onCreated = null) {
    debugLog("creator", "creator.opened", {
        operation: "open",
        status: "success"
    });
    document.getElementById("ccm-character-creator-dialog")?.remove();

    const state = {
        count: 1,
        cardType: "character",
        creatorSource: getAISource(),
        mode: "",
        length: "standard",
        setup: {},
        briefs: [],
        relationships: {},
        plan: null,
        cards: [],
        active: 0,
        creatorName: "",
        createGroup: true,
        groupName: ""
    };
    const avatarSelections = new Map();
    const dialog = document.createElement("div");
    dialog.id = "ccm-character-creator-dialog";
    dialog.innerHTML = `<div class="ccm-creator-window">
        <header class="ccm-creator-header"><div><h3>Create New Character(s)</h3><p>Build one character or a connected cast of separate cards.</p></div><button data-close>✕</button></header>
        <div class="ccm-creator-progress"><span>1. Setup</span><span>2. Cast</span><span>3. Cards</span><span>4. Create</span></div>
        <main class="ccm-creator-content"></main>
        <div class="ccm-creator-wait" data-creator-wait hidden>
            <div class="ccm-creator-wait-card" role="status" aria-live="polite">
                <div class="ccm-creator-spinner" aria-hidden="true"></div>
                <h4>Please wait</h4>
                <p data-creator-wait-message>The AI is processing your request…</p>
            </div>
        </div>
    </div>`;

    const content = dialog.querySelector(".ccm-creator-content");
    const steps = [...dialog.querySelectorAll(".ccm-creator-progress span")];
    const waitOverlay = dialog.querySelector("[data-creator-wait]");
    const step = index => {
        waitOverlay.hidden = true;
        steps[1].textContent = state.count > 1 ? "2. Cast" : "2. Plan";
        steps[2].textContent = state.count > 1 ? "3. Cards" : "3. Card";
        steps.forEach((item, i) => {
            item.classList.toggle("is-active", i === index);
            item.classList.toggle("is-complete", i < index);
        });
    };
    const status = (message, busy = false, showWait = busy) => {
        const output = content.querySelector("[data-status]");
        if (output) output.textContent = message || "";
        content.querySelectorAll("button").forEach(button => button.disabled = busy);
        waitOverlay.hidden = !showWait;
        if (showWait) {
            waitOverlay.querySelector("[data-creator-wait-message]").textContent =
                message || "The AI is processing your request…";
        }
    };
    const showCardGenerationError = (error, selectedCharacter, cardIndex) => {
        waitOverlay.hidden = true;
        const labels = getCreatorModelLabels();
        const debugInfo = [
            "CCM Character Creator Debug Report",
            `Time: ${new Date().toISOString()}`,
            `Stage: Full card generation (${cardIndex + 1} of ${state.plan?.cast?.length || state.count})`,
            `AI source: ${state.creatorSource === "sillytavern" ? "SillyTavern Active Model" : "CCM Provider"}`,
            `Provider / model: ${labels[state.creatorSource] || "Unknown"}`,
            `Card type: ${state.cardType || "character"}`,
            `Detail level: ${state.length || "standard"}`,
            "",
            "Error:",
            error?.stack || error?.message || String(error),
            "",
            "Character being generated:",
            JSON.stringify(selectedCharacter || {}, null, 2),
            "",
            "Locked cast plan:",
            JSON.stringify(state.plan || {}, null, 2),
            "",
            "AI output:",
            error?.aiOutput || "(The provider did not return output, or the failure occurred after parsing.)"
        ].join("\n");

        const panel = document.createElement("div");
        panel.className = "ccm-creator-error-overlay";
        panel.innerHTML = `<div class="ccm-creator-error-card" role="alertdialog" aria-modal="true" aria-labelledby="ccm-creator-error-title">
            <h4 id="ccm-creator-error-title">Full card generation failed</h4>
            <p>${escapeHtml(error?.message || "Card generation failed.")}</p>
            <p class="ccm-creator-error-hint">Copy the debug report when asking for help. It contains the AI output but no API keys.</p>
            <textarea readonly data-debug-report>${escapeHtml(debugInfo)}</textarea>
            <footer class="ccm-creator-actions"><span data-copy-status></span><button type="button" data-copy-debug>Copy Debug Info</button><button type="button" data-close-error>Close</button></footer>
        </div>`;
        dialog.querySelector(".ccm-creator-window").appendChild(panel);
        panel.querySelector("[data-close-error]").addEventListener("click", () => panel.remove());
        panel.querySelector("[data-copy-debug]").addEventListener("click", async () => {
            const copyStatus = panel.querySelector("[data-copy-status]");
            try {
                await navigator.clipboard.writeText(debugInfo);
                copyStatus.textContent = "Copied.";
            } catch {
                const report = panel.querySelector("[data-debug-report]");
                report.focus();
                report.select();
                copyStatus.textContent = "Clipboard access was blocked. The report is selected—press Ctrl+C.";
            }
        });
    };
    const saveDraft = () => {
        try {
            localStorage.setItem(CREATOR_DRAFT_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn("[CCM] Could not save character creator draft", error);
        }
    };
    const clearDraft = () => localStorage.removeItem(CREATOR_DRAFT_KEY);

    function renderCount() {
        step(0);
        dialog.querySelector(".ccm-creator-window").classList.add("is-compact");
        const installed = SillyTavern.getContext()?.characters || [];
        content.innerHTML = `<section class="ccm-creator-section ccm-creator-choice">
            <h4>How many characters?</h4>
            <p>Each character will be created as a separate SillyTavern card.</p>
            <label class="ccm-creator-field">${labelText("Number of characters", "Choose 1 to 8. Multiple characters can be connected and placed into one group.")}<input name="count" type="number" min="1" max="8" value="${state.count}"></label>
            <details class="ccm-import-card">
                <summary>Improve an existing card</summary>
                ${installed.length ? `<label class="ccm-creator-field">${labelText("Installed SillyTavern card", "Loads a copy into the creator. The original card will not be overwritten.")}<select name="existingAvatar"><option value="">Choose a card…</option>${installed.map(character => `<option value="${escapeHtml(character.avatar || "")}">${escapeHtml(character.name || character.avatar)}</option>`).join("")}</select></label><button type="button" data-load-existing>Load Installed Card</button>` : ""}
                <label class="ccm-creator-field">${labelText("Character-card file", "Load a V2 or V3 JSON/PNG card as a new editable starting point.")}<input type="file" name="cardFile" accept=".json,.png,application/json,image/png"></label>
                <span data-import-status></span>
            </details>
            <footer class="ccm-creator-actions">
                ${localStorage.getItem(CREATOR_DRAFT_KEY) ? `<button data-resume>Resume Draft</button><button data-clear-draft>Clear Draft</button>` : ""}
                <span data-status></span><button data-next>Next</button>
            </footer>
        </section>`;
        const openImportedCard = card => {
            state.count = 1;
            state.cardType = "character";
            state.mode = "guided";
            state.cards = [card];
            state.active = 0;
            state.plan = {
                setName: "",
                cast: [{ name: card.name }]
            };
            saveDraft();
            renderCards();
        };
        content.querySelector("[data-load-existing]")?.addEventListener("click", async () => {
            const avatar = content.querySelector('[name="existingAvatar"]').value;
            const output = content.querySelector("[data-import-status]");
            if (!avatar) {
                output.textContent = "Choose an installed card first.";
                return;
            }
            output.textContent = "Loading card…";
            try {
                openImportedCard(normalizeImportedCard(
                    await getSillyTavernCharacter(avatar)
                ));
            } catch (error) {
                output.textContent = error.message || "Could not load the card.";
            }
        });
        content.querySelector('[name="cardFile"]').addEventListener("change", async event => {
            const output = content.querySelector("[data-import-status]");
            const file = event.target.files?.[0];
            if (!file) return;
            output.textContent = "Reading card…";
            try {
                openImportedCard(await readCharacterCardFile(file));
            } catch (error) {
                output.textContent = error.message || "Could not read the card.";
            }
        });
        content.querySelector("[data-resume]")?.addEventListener("click", () => {
            try {
                Object.assign(state, JSON.parse(localStorage.getItem(CREATOR_DRAFT_KEY)));
                state.cardType ||= state.count > 1 ? "connected" : "character";
                state.length ||= "standard";
                if (state.cards?.length) renderCards();
                else if (state.plan) renderPlan();
                else if (state.mode === "ai") renderAIBriefs();
                else renderMode();
            } catch {
                clearDraft();
                status("The saved draft could not be loaded.");
            }
        });
        content.querySelector("[data-clear-draft]")?.addEventListener("click", () => {
            clearDraft();
            renderCount();
        });
        content.querySelector("[data-next]").addEventListener("click", () => {
            state.count = Math.min(8, Math.max(1,
                Number(content.querySelector('[name="count"]').value) || 1
            ));
            state.cardType = state.count > 1
                ? "connected"
                : state.cardType === "connected"
                    ? "character"
                    : state.cardType;
            saveDraft();
            state.count > 1
                ? renderMode()
                : renderCardType();
        });
    }

    function renderCardType() {
        step(0);
        dialog.querySelector(".ccm-creator-window").classList.remove("is-compact");
        const choices = ["character", "world", "narrator", "tool"];
        content.innerHTML = `<section class="ccm-creator-section ccm-creator-choice">
            <h4>What kind of card?</h4>
            <div class="ccm-card-type-grid">
                ${choices.map(id => `<button type="button" data-card-type="${id}" class="${state.cardType === id ? "is-active" : ""}"><strong>${escapeHtml(CARD_TYPES[id].label)}</strong><span>${escapeHtml(CARD_TYPES[id].description)}</span></button>`).join("")}
            </div>
            <footer class="ccm-creator-actions"><button data-back>Back</button><span data-status></span></footer>
        </section>`;
        content.querySelector("[data-back]").addEventListener("click", renderCount);
        content.querySelectorAll("[data-card-type]").forEach(button => button.addEventListener("click", () => {
            state.cardType = button.dataset.cardType;
            saveDraft();
            renderMode();
        }));
    }

    function renderMode() {
        step(0);
        state.cardType ||= state.count > 1 ? "connected" : "character";
        dialog.querySelector(".ccm-creator-window").classList.add("is-compact");
        content.innerHTML = `<section class="ccm-creator-section ccm-creator-choice">
            <h4>How would you like to create ${state.count === 1 ? `this ${CARD_TYPES[state.cardType].subjectLabel}` : `these ${state.count} characters`}?</h4>
            <div class="ccm-creator-mode-grid">
                <button data-mode="guided"><strong>Follow the steps</strong><span>Fill in every card field yourself with guidance and tips.</span></button>
                <button data-mode="ai"><strong>Have AI create it</strong><span>Give the important details and let AI write the complete card${state.count === 1 ? "" : "s and relationships"}.</span></button>
            </div>
            <footer class="ccm-creator-actions"><button data-back>Back</button><span data-status></span></footer>
        </section>`;
        content.querySelector("[data-back]").addEventListener(
            "click",
            state.count > 1 ? renderCount : renderCardType
        );
        content.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
            state.mode = button.dataset.mode;
            saveDraft();
            if (state.mode === "guided") {
                state.cards = Array.from({ length: state.count }, (_, index) => blankCard(index, state.cardType));
                state.plan = { setName: "", cast: state.cards.map(card => ({ name: card.name })) };
                state.active = 0;
                renderCards();
            } else {
                renderAIBriefs();
            }
        }));
    }

    function renderAIBriefs() {
        step(0);
        dialog.querySelector(".ccm-creator-window").classList.remove("is-compact");
        const preset = CARD_TYPES[state.cardType];
        const modelLabels = getCreatorModelLabels();
        const modelComparison = compareCreatorModels(
            modelLabels.ccm,
            modelLabels.sillytavern,
            state.count
        );
        const setupExample = creatorExample(state.cardType, 0);
        content.innerHTML = `<section class="ccm-creator-section">
            <div class="ccm-creator-example-heading"><h4>Tell the AI about ${state.count === 1 ? `your ${preset.subjectLabel}` : "each character"}</h4><button type="button" data-fill-complete-example>Fill Complete Example</button></div>
            <section class="ccm-creator-model-choice">
                <h4>Choose the AI for this creation ${helpTip("This choice applies only to this creator project. It does not change CCM's global AI setting.")}</h4>
                <div class="ccm-creator-model-options">
                    <label class="ccm-creator-model-option">
                        <input type="radio" name="creatorSource" value="ccm" ${state.creatorSource !== "sillytavern" ? "checked" : ""}>
                        <span><strong>CCM Provider</strong><small>${escapeHtml(modelLabels.ccm)}</small><small>${escapeHtml(formatModelSpecs(modelLabels.ccm))}</small></span>
                    </label>
                    <label class="ccm-creator-model-option">
                        <input type="radio" name="creatorSource" value="sillytavern" ${state.creatorSource === "sillytavern" ? "checked" : ""}>
                        <span><strong>SillyTavern Active Model</strong><small>${escapeHtml(modelLabels.sillytavern)}</small><small>${escapeHtml(formatModelSpecs(modelLabels.sillytavern))}</small></span>
                    </label>
                </div>
                <p>${escapeHtml(modelComparison.recommendation)}</p>
                <p class="ccm-creator-model-note">Routine State and Knowledge updates are high-volume. A separate 7B–9B CCM model is recommended; 4B is the practical minimum, and models below 4B are not recommended for reliable structured output.</p>
            </section>
            <div class="${state.count > 1 ? "ccm-creator-grid" : ""}">
                ${state.count > 1 ? `<label class="ccm-creator-field">${labelText("Set or group name", "A shared name for this connected cast.")}<input name="setName" value="${escapeHtml(state.setup.setName || "")}">${exampleHint("The Archive Circle")}</label>` : ""}
                <label class="ccm-creator-field">${labelText("Genre and tone", "Combine a genre with an emotional style. Examples: modern romance — intimate and tender; domestic drama — emotionally charged; dark fantasy — ominous and tragic; epic fantasy — adventurous and hopeful; science fiction — cerebral and tense; cyberpunk — gritty and paranoid; mystery — suspenseful and clever; horror — unsettling and claustrophobic; gothic romance — melancholic and passionate; slice of life — cozy and playful; comedy — light and chaotic; thriller — urgent and dangerous; historical drama — grounded and serious; supernatural — eerie and seductive; action adventure — energetic and heroic.")}<input name="tone" list="ccm-creator-tone-examples" placeholder="e.g. Domestic romance — intimate and playful" value="${escapeHtml(state.setup.tone || "")}">${exampleHint(state.cardType === "character" || state.cardType === "connected" ? "Modern mystery — intimate, suspenseful, and character-driven" : "Atmospheric adventure — mysterious and hopeful")}</label>
                <datalist id="ccm-creator-tone-examples">
                    <option value="Modern romance — intimate and tender">
                    <option value="Domestic drama — emotionally charged and realistic">
                    <option value="Dark fantasy — ominous and tragic">
                    <option value="Epic fantasy — adventurous and hopeful">
                    <option value="Science fiction — cerebral and tense">
                    <option value="Cyberpunk — gritty and paranoid">
                    <option value="Mystery — suspenseful and clever">
                    <option value="Horror — unsettling and claustrophobic">
                    <option value="Gothic romance — melancholic and passionate">
                    <option value="Slice of life — cozy and playful">
                    <option value="Comedy — light and chaotic">
                    <option value="Thriller — urgent and dangerous">
                    <option value="Historical drama — grounded and serious">
                    <option value="Supernatural romance — eerie and seductive">
                    <option value="Action adventure — energetic and heroic">
                    <option value="Adult domestic romance — explicit and emotionally intimate">
                </datalist>
            </div>
            <label class="ccm-creator-field">${labelText("Card detail level", "Compact saves context tokens; Standard balances detail and size; Detailed creates deeper behaviour, dialogue, relationships, and lore.")}
                <select name="length">${Object.entries(CARD_LENGTHS).map(([id, option]) => `<option value="${id}" ${state.length === id ? "selected" : ""}>${option.label}</option>`).join("")}</select>
            </label>
            ${textarea(state.count > 1 ? "Shared setting and starting situation" : "Setting and starting situation", "setting", state.setup.setting, 4, "Where the story happens and exactly what is occurring when the chat begins.", false, state.count > 1 ? "The group meets after closing in a museum archive, where a damaged journal reveals a map hidden beneath its binding." : setupExample.scenario)}
            <label class="ccm-creator-field">${labelText("User's role", state.count > 1 ? "Who {{user}} is in relation to the connected cast." : "Who {{user}} is in relation to this character.")}<input name="userRole" value="${escapeHtml(state.setup.userRole || "")}">${exampleHint(state.count > 1 ? "A trusted researcher newly invited into the group" : "A trusted colleague and longtime friend")}</label>
            <div class="ccm-creator-brief-list">
                ${Array.from({ length: state.count }, (_, index) => {
                    const item = state.briefs[index] || {};
                    const example = creatorExample(state.cardType, index);
                    const clothing = item.clothingParts || parseClothingParts(item.appearance?.clothing || "");
                    return `<fieldset data-brief="${index}"><legend>${state.count > 1 ? `Character ${index + 1}` : escapeHtml(preset.label)}</legend>
                        <div class="ccm-creator-grid">
                            <label class="ccm-creator-field">${labelText("Name", `The display name for this ${preset.subjectLabel}.`)}<input name="name" value="${escapeHtml(item.name || "")}">${exampleHint(example.name)}</label>
                            ${preset.showAppearance ? `<label class="ccm-creator-field">${labelText("Age", "The character's age or age range.")}<input name="age" value="${escapeHtml(item.age || "")}">${exampleHint(example.age)}</label>
                            <label class="ccm-creator-field">${labelText("Gender", "The character's gender identity, if relevant.")}<input name="gender" value="${escapeHtml(item.gender || "")}">${exampleHint(example.gender)}</label>
                            <label class="ccm-creator-field">${labelText("Species", "Human or another species, ancestry, or character type.")}<input name="species" value="${escapeHtml(item.species || "Human")}">${exampleHint(example.species)}</label>` : ""}
                        </div>
                        ${preset.showAppearance ? `<h5>Appearance</h5>
                        <div class="ccm-creator-grid ccm-creator-appearance-grid">
                            <label class="ccm-creator-field">${labelText("Height", "Exact height or a description such as short, average, or tall.")}<input name="height" value="${escapeHtml(item.appearance?.height || "")}">${exampleHint(example.height)}</label>
                            <label class="ccm-creator-field">${labelText("Body type", "The character's build, proportions, or physique.")}<input name="bodyType" value="${escapeHtml(item.appearance?.bodyType || "")}">${exampleHint(example.bodyType)}</label>
                            <label class="ccm-creator-field">${labelText("Skin", "Skin tone, complexion, fur, scales, or other body covering.")}<input name="skin" value="${escapeHtml(item.appearance?.skin || "")}">${exampleHint(example.skin)}</label>
                            <label class="ccm-creator-field">${labelText("Eyes", "Eye colour, shape, and any distinctive qualities.")}<input name="eyes" value="${escapeHtml(item.appearance?.eyes || "")}">${exampleHint(example.eyes)}</label>
                            <label class="ccm-creator-field">${labelText("Hair", "Hair colour, length, texture, and usual style.")}<input name="hair" value="${escapeHtml(item.appearance?.hair || "")}">${exampleHint(example.hair)}</label>
                            <label class="ccm-creator-field">${labelText("Face", "Facial shape, features, expression, makeup, facial hair, or other details.")}<input name="face" value="${escapeHtml(item.appearance?.face || "")}">${exampleHint(example.face)}</label>
                            <label class="ccm-creator-field">${labelText("Usual top or dress", "The top, shirt, dress, uniform upper layer, or similar item they commonly wear. Leave all usual-clothing fields blank for a stable random outfit.")}<input name="clothingTop" placeholder="Leave all clothing fields blank for random" value="${escapeHtml(clothing.top)}">${exampleHint(example.top)}</label>
                            <label class="ccm-creator-field">${labelText("Usual bottom", "The trousers, jeans, skirt, shorts, or similar lower garment they commonly wear.")}<input name="clothingBottom" value="${escapeHtml(clothing.bottom)}">${exampleHint(example.bottom)}</label>
                            <label class="ccm-creator-field">${labelText("Usual footwear", "Shoes, boots, sandals, slippers, or other footwear they commonly wear.")}<input name="clothingFootwear" value="${escapeHtml(clothing.footwear)}">${exampleHint(example.footwear)}</label>
                            <label class="ccm-creator-field">${labelText("Usual undergarments", "Their ordinary undergarments, if this detail matters to the card. This describes normal preference, not the opening scene.")}<input name="clothingUnderwear" value="${escapeHtml(clothing.underwear)}">${exampleHint(example.underwear)}</label>
                            <label class="ccm-creator-field">${labelText("Other clothing details", "Fashion style, outer layers, uniform details, jewellery, accessories, or other recurring clothing information.")}<input name="clothingOther" value="${escapeHtml(clothing.other)}">${exampleHint(example.clothingOther)}</label>
                            <label class="ccm-creator-field">${labelText("Distinctive features", "Scars, tattoos, horns, wings, jewellery, posture, scent, voice, or anything visually memorable.")}<input name="features" value="${escapeHtml(item.appearance?.distinctiveFeatures || "")}">${exampleHint(example.features)}</label>
                        </div>` : ""}
                        ${textarea(preset.briefLabel, "brief", item.brief, 5, preset.guidance, false, example.brief)}
                        ${state.count > 1 ? `${textarea("Brief personal scenario", "scenario", item.scenario, 4, "How this character enters the story, their current circumstances, and their connection to {{user}}.", false, example.scenario)}
                        <label class="ccm-creator-checkbox">
                            <input type="checkbox" name="inventScenario" ${item.inventScenario !== false ? "checked" : ""}>
                            Let the AI invent this character's personal scenario details
                            ${helpTip("When selected, the AI may add personal context, but the shared setting and starting situation remain mandatory and must not be changed.")}
                        </label>` : ""}
                    </fieldset>`;
                }).join("")}
            </div>
            ${state.count > 1 ? `<section class="ccm-relationship-matrix">
                <h4>Relationship matrix ${helpTip("Define every pair once. CCM supplies the relationship to both cards while each final card is still written from its own perspective.")}</h4>
                ${Array.from({ length: state.count }, (_, first) =>
                    Array.from({ length: state.count - first - 1 }, (_, offset) => {
                        const second = first + offset + 1;
                        const firstName = state.briefs[first]?.name || `Character ${first + 1}`;
                        const secondName = state.briefs[second]?.name || `Character ${second + 1}`;
                        const key = `${first}:${second}`;
                        return textarea(`${firstName} ↔ ${secondName}`, `relationship-${key}`, state.relationships[key], 3, "Their shared history and current dynamic: trust, affection, rivalry, tension, hierarchy, secrets, and how they behave together.", false, "They trust each other's expertise but disagree about how much risk the group should take; their arguments are candid and grounded in mutual respect.");
                    }).join("")
                ).join("")}
            </section>` : ""}
            ${textarea("Other required details", "requirements", state.setup.userRequirements ?? state.setup.requirements, 4, "Anything that must appear in the final cards or must not be changed.", false, "Keep the mystery grounded, preserve each character's established appearance, and leave the user's decisions open.")}
            <footer class="ccm-creator-actions"><button data-back>Back</button><span data-status></span><button data-next>${state.count > 1 ? "Next: Design Cast" : "Next: Design Character"}</button></footer>
        </section>`;
        const applyExample = button => {
            const field = button.closest("label")?.querySelector("input:not([type=checkbox]):not([type=radio]), textarea");
            if (!field) return;
            field.value = button.dataset.exampleValue || "";
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
        };
        content.querySelectorAll("[data-use-example]").forEach(button => {
            button.addEventListener("click", () => applyExample(button));
        });
        content.querySelector("[data-fill-complete-example]").addEventListener("click", () => {
            const hasEnteredValues = [...content.querySelectorAll('input:not([type]), input[type="text"], textarea')]
                .some(field =>
                    field.value.trim() &&
                    !(field.name === "species" && field.value.trim().toLowerCase() === "human")
                );
            if (hasEnteredValues && !confirm("Replace the current creator fields with one complete, consistent example?")) return;
            content.querySelectorAll('[name="inventScenario"]').forEach(checkbox => {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event("change", { bubbles: true }));
            });
            content.querySelectorAll("[data-use-example]").forEach(applyExample);
            status("Complete example filled. Every value remains editable.");
        });
        content.querySelector("[data-back]").addEventListener("click", renderMode);
        content.querySelectorAll("[data-brief]").forEach(fieldset => {
            const checkbox = fieldset.querySelector('[name="inventScenario"]');
            const scenario = fieldset.querySelector('[name="scenario"]');
            if (!checkbox || !scenario) return;
            const syncScenario = () => {
                scenario.disabled = checkbox.checked;
                scenario.placeholder = checkbox.checked
                    ? "The AI will create this scenario."
                    : "Describe this character's starting situation…";
            };
            checkbox.addEventListener("change", syncScenario);
            syncScenario();
        });
        content.querySelector("[data-next]").addEventListener("click", async () => {
            const get = name => content.querySelector(`[name="${name}"]`)?.value.trim() || "";
            state.creatorSource = content.querySelector('[name="creatorSource"]:checked')?.value || "ccm";
            state.briefs = [...content.querySelectorAll("[data-brief]")].map(fieldset => {
                const value = name => fieldset.querySelector(`[name="${name}"]`)?.value.trim() || "";
                const inventScenario = state.count > 1
                    ? fieldset.querySelector('[name="inventScenario"]')?.checked !== false
                    : false;
                const clothingParts = {
                    top: value("clothingTop"),
                    bottom: value("clothingBottom"),
                    footwear: value("clothingFootwear"),
                    underwear: value("clothingUnderwear"),
                    other: value("clothingOther")
                };
                const hasClothingParts = Object.values(clothingParts).some(Boolean);
                return {
                    name: value("name"),
                    age: value("age"),
                    gender: value("gender"),
                    species: value("species"),
                    appearance: {
                        height: value("height"),
                        bodyType: value("bodyType"),
                        skin: value("skin"),
                        eyes: value("eyes"),
                        hair: value("hair"),
                        face: value("face"),
                        clothing: hasClothingParts
                            ? combineClothingParts(clothingParts)
                            : "",
                        distinctiveFeatures: value("features")
                    },
                    ...(hasClothingParts ? { clothingParts } : {}),
                    brief: value("brief"),
                    scenario: state.count === 1
                        ? "Use the shared setting and starting situation exactly."
                        : inventScenario
                        ? "AI should invent a suitable personal scenario."
                        : value("scenario"),
                    inventScenario
                };
            });
            state.briefs.forEach((item, index) => {
                if (!item.appearance.clothing) {
                    item.appearance.clothing = generateCreatorClothing(item, index);
                }
            });
            state.length = get("length") || "standard";
            if (state.count > 1) {
                state.relationships = {};
                for (let first = 0; first < state.count; first++) {
                    for (let second = first + 1; second < state.count; second++) {
                        const key = `${first}:${second}`;
                        state.relationships[key] = get(`relationship-${key}`);
                    }
                }
                const summaries = buildRelationshipSummaries(
                    state.briefs.map(item => item.name),
                    state.relationships
                );
                state.briefs.forEach((item, index) => {
                    item.relationships = summaries[index];
                });
            }
            if (state.briefs.some(item => !item.name || !item.brief)) return status("Give every character a name and brief description.");
            if (state.count > 1 && Object.values(state.relationships).some(value => !value)) return status("Complete every relationship in the matrix.");
            if (state.briefs.some(item => !item.inventScenario && !item.scenario)) return status("Give each character a brief scenario or let the AI invent it.");
            const userRequirements = get("requirements");
            state.setup = {
                count: state.count,
                setName: get("setName"), tone: get("tone"), userRole: get("userRole"), setting: get("setting"),
                userRequirements,
                requirements: [
                    userRequirements,
                    CARD_TYPES[state.cardType].guidance,
                    CARD_LENGTHS[state.length].guidance
                ].filter(Boolean).join("\n\n"),
                concept: JSON.stringify(state.briefs, null, 2)
            };
            saveDraft();
            status(state.count > 1 ? "Designing the cast…" : "Designing the character…", true);
            try {
                state.plan = await execute(
                    "character-cast-plan",
                    state.setup,
                    { feature: "character-creator" },
                    { source: state.creatorSource }
                );
                if (state.plan.cast.length !== state.count) throw new Error(`The AI returned ${state.plan.cast.length} characters instead of ${state.count}. Please try again.`);
                state.plan = lockCreatorPlan(
                    state.plan,
                    state.setup,
                    state.briefs,
                    state.relationships
                );
                saveDraft();
                renderPlan();
            } catch (error) {
                status(error.message || "Cast generation failed.");
                showCCMError("Cast generation failed.", error, "Character creator cast planning");
            }
        });
    }

    function renderPlan() {
        step(1);
        content.innerHTML = `<section class="ccm-creator-section">
            <h4>${state.count > 1 ? "Review the connected cast" : "Review the character plan"}</h4><p>Edit anything that should change. This plan stays locked while ${state.count > 1 ? "the individual cards are" : "the card is"} written.</p>
            <textarea class="ccm-creator-plan" data-plan>${escapeHtml(JSON.stringify(state.plan, null, 2))}</textarea>
            <footer class="ccm-creator-actions"><button data-back>Back</button><span data-status></span><button data-next>${state.count > 1 ? "Generate Full Cards" : "Generate Full Card"}</button></footer>
        </section>`;
        content.querySelector("[data-back]").addEventListener("click", renderAIBriefs);
        content.querySelector("[data-next]").addEventListener("click", async () => {
            try { state.plan = JSON.parse(content.querySelector("[data-plan]").value); }
            catch { return status("The cast plan is not valid JSON."); }
            if (!Array.isArray(state.plan.cast) || !state.plan.cast.length) return status("The plan needs at least one character.");
            state.cards = [];
            saveDraft();
            status("Preparing full cards…", true);
            try {
                for (let i = 0; i < state.plan.cast.length; i++) {
                    status(`Writing ${state.plan.cast[i].name} (${i + 1} of ${state.plan.cast.length})…`, true);
                    const selectedCharacter = state.plan.cast[i];
                    const generatedCard = await execute("character-card", {
                        plan: state.plan,
                        selectedCharacter,
                        authoritativeStartingSituation: state.setup.setting,
                        authoritativeUserRole: state.setup.userRole,
                        requirements: state.setup.requirements,
                        cardType: state.cardType,
                        cardTypeGuidance: CARD_TYPES[state.cardType].guidance,
                        availableTags: mergeTagSuggestions(
                            (SillyTavern.getContext()?.tags || []).map(tag =>
                                typeof tag === "string" ? tag : tag?.name || tag?.label || ""
                            ),
                            COMMON_CHARACTER_TAGS
                        ).slice(0, 200)
                    }, { feature: "character-creator" }, { source: state.creatorSource });
                    state.cards.push(applyLockedCardDetails(
                        generatedCard,
                        state.plan,
                        selectedCharacter
                    ));
                }
                state.active = 0;
                saveDraft();
                renderCards();
            } catch (error) {
                status(error.message || "Card generation failed.");
                const failedIndex = state.cards.length;
                showCardGenerationError(error, state.plan.cast[failedIndex], failedIndex);
            }
        });
    }

    function collectCard() {
        const form = content.querySelector("[data-card-form]");
        if (!form) return;
        const card = state.cards[state.active];
        const get = name => form.querySelector(`[name="${name}"]`)?.value || "";
        Object.assign(card, {
            name: get("name").trim(), nickname: get("nickname").trim(),
            description: get("description").trim(), personality: get("personality").trim(),
            scenario: get("scenario").trim(), first_mes: get("first_mes").trim(),
            mes_example: get("mes_example").trim(),
            alternate_greetings: splitLines(get("alternate_greetings")),
            group_only_greetings: splitLines(get("group_only_greetings")),
            tags: get("tags").split(",").map(x => x.trim()).filter(Boolean),
            creator_notes: get("creator_notes").trim(), depth_prompt: get("depth_prompt").trim(),
            system_prompt: get("system_prompt").trim(),
            post_history_instructions: get("post_history_instructions").trim(),
            talkativeness: card.talkativeness
        });
        const talkativeness = form.querySelector('[name="talkativeness"]');
        if (talkativeness && Number.isFinite(Number(talkativeness.value))) {
            card.talkativeness = Number(talkativeness.value);
        }
        const lorebook = form.querySelector("[data-lorebook]");
        card.character_book = {
            name: lorebook?.querySelector('[name="lorebook_name"]')?.value.trim() || "",
            entries: [...(lorebook?.querySelectorAll("[data-lore-entry]") || [])]
                .map(entry => ({
                    keys: entry.querySelector('[name="lore_keys"]').value
                        .split(",").map(value => value.trim()).filter(Boolean),
                    comment: entry.querySelector('[name="lore_comment"]').value.trim(),
                    content: entry.querySelector('[name="lore_content"]').value.trim()
                }))
                .filter(entry => entry.content)
        };
        saveDraft();
    }

    function renderCards() {
        step(2);
        const card = state.cards[state.active];
        content.innerHTML = `<section class="ccm-creator-section">
            <h4>${state.count > 1 ? "Review every character card" : "Review character card"}</h4>
            ${state.count > 1 ? `<nav class="ccm-creator-tabs">${state.cards.map((item, i) => `<button data-index="${i}" class="${i === state.active ? "is-active" : ""}">${escapeHtml(item.name)}</button>`).join("")}</nav>` : ""}
            <div data-card-form>
                <div class="ccm-creator-grid"><label class="ccm-creator-field">${labelText("Name", "The primary name displayed by SillyTavern and used by {{char}}.")}<input name="name" value="${escapeHtml(card.name)}"></label><label class="ccm-creator-field">${labelText("Nickname", "An optional shorter in-chat name distinct from the card's full name.")}<input name="nickname" value="${escapeHtml(card.nickname)}"></label></div>
                ${textarea("Description — identity, appearance, background, abilities and relationships", "description", card.description, 16, "Stable facts about who the character is. Include concrete looks, clothing, history, skills, limits, and relationship perspectives.", true)}
                ${textarea("Personality — traits, behaviour and speech", "personality", card.personality, 13, "Motivations, values, strengths, flaws, fears, habits, emotional reactions, social behaviour, boundaries, and speaking style.", true)}
                ${textarea("Scenario", "scenario", card.scenario, 7, "The current setting, the user's role, starting circumstances, and immediate story possibilities.", true)}
                ${textarea("First message", "first_mes", card.first_mes, 10, "The opening scene shown when a new chat starts. Include action, dialogue, and room for the user to respond.", true)}
                ${textarea("Example dialogue", "mes_example", card.mes_example, 12, "Examples that teach voice and behaviour. Use <START>, {{user}}:, and {{char}}: formatting.", true)}
                <div class="${state.count > 1 ? "ccm-creator-grid" : ""}">${textarea("Alternative greetings — one per line", "alternate_greetings", (card.alternate_greetings || []).join("\n"), 6, "Alternative solo-chat opening messages that users can swipe between.")}${state.count > 1 ? textarea("Group-only greetings — one per line", "group_only_greetings", (card.group_only_greetings || []).join("\n"), 6, "Opening messages used only when this card appears in a group chat.") : ""}</div>
                <section class="ccm-creator-tag-picker" data-tag-picker>
                    <label>${labelText("Tags", "Search existing SillyTavern tags, choose a common tag, or create a new tag. Tags organize cards and normally do not affect character behaviour.")}</label>
                    <div class="ccm-creator-selected-tags" data-selected-tags></div>
                    <div class="ccm-creator-tag-search">
                        <input type="search" data-tag-search placeholder="Search or type a new tag…">
                        <button type="button" data-add-tag>Add New Tag</button>
                    </div>
                    <div class="ccm-creator-tag-suggestions" data-tag-suggestions></div>
                    <input type="hidden" name="tags" value="${escapeHtml((card.tags || []).join(", "))}">
                </section>
                <details class="ccm-creator-advanced"><summary>Advanced card fields</summary>
                    ${textarea("Creator notes", "creator_notes", card.creator_notes, 4, "Human-facing information about the card. It is not normally sent as character instructions.")}
                    ${textarea("Character note / depth prompt", "depth_prompt", card.depth_prompt, 4, "A short reminder inserted into chat context. Use only for important traits that need reinforcement.")}
                    ${textarea("System prompt", "system_prompt", card.system_prompt, 4, "Overrides the user's normal system prompt. Leave blank unless the character truly requires one.")}
                    ${textarea("Post-history instructions", "post_history_instructions", card.post_history_instructions, 4, "Instructions placed after chat history. Keep short and leave blank unless necessary.")}
                    ${state.count > 1 ? `<label class="ccm-creator-field">${labelText("Talkativeness (0–1)", "Group-chat response tendency: 0 is very quiet, 0.5 is normal, and 1 is very talkative.")}<input name="talkativeness" type="number" min="0" max="1" step="0.1" value="${card.talkativeness}"></label>` : ""}
                    <section class="ccm-lorebook-editor" data-lorebook>
                        <h5>Character lorebook ${helpTip("Triggered world knowledge for important people, places, factions, powers, and shared history.")}</h5>
                        <label class="ccm-creator-field">${labelText("Lorebook name", "A human-readable title for this card's embedded lorebook.")}<input name="lorebook_name" value="${escapeHtml(card.character_book?.name || "")}"></label>
                        <div class="ccm-lore-entry-list">
                            ${(card.character_book?.entries || []).map((entry, loreIndex) => `<fieldset data-lore-entry="${loreIndex}">
                                <legend>Entry ${loreIndex + 1}</legend>
                                <label class="ccm-creator-field">${labelText("Trigger keys", "Comma-separated words or phrases that activate this lore entry.")}<input name="lore_keys" value="${escapeHtml((entry.keys || []).join(", "))}"></label>
                                <label class="ccm-creator-field">${labelText("Entry label", "A short editor-only name explaining what this entry describes.")}<input name="lore_comment" value="${escapeHtml(entry.comment || "")}"></label>
                                ${textarea("Lore content", "lore_content", entry.content, 6, "Objective information injected when a trigger key appears in recent context.")}
                                <button type="button" data-remove-lore="${loreIndex}">Remove Entry</button>
                            </fieldset>`).join("") || `<p class="ccm-empty-state">No lore entries yet.</p>`}
                        </div>
                        <button type="button" data-add-lore>Add Lore Entry</button>
                    </section>
                </details>
            </div>
            <section class="ccm-card-health" data-card-health></section>
            <footer class="ccm-creator-actions"><button data-back>Back to Cast</button><button type="button" data-preview>Preview</button><span data-status>Everything remains editable.</span><button data-next>Next: Create</button></footer>
        </section>`;
        content.querySelectorAll("[data-index]").forEach(button => button.addEventListener("click", () => {
            try { collectCard(); state.active = Number(button.dataset.index); renderCards(); }
            catch (error) { status(error.message); }
        }));
        const tagPicker = content.querySelector("[data-tag-picker]");
        const tagInput = tagPicker.querySelector('[name="tags"]');
        const tagSearch = tagPicker.querySelector("[data-tag-search]");
        const selectedTags = [...new Set(card.tags || [])];
        const sillyTavernTags = (SillyTavern.getContext()?.tags || [])
            .map(tag => typeof tag === "string" ? tag : tag?.name || tag?.label || "");
        const availableTags = mergeTagSuggestions(
            sillyTavernTags,
            COMMON_CHARACTER_TAGS,
            selectedTags
        );
        const syncTags = () => {
            card.tags = [...selectedTags];
            tagInput.value = selectedTags.join(", ");
            saveDraft();
        };
        const addTag = value => {
            const tag = String(value || "").trim();
            if (!tag || selectedTags.some(item => item.toLowerCase() === tag.toLowerCase())) return;
            selectedTags.push(tag);
            tagSearch.value = "";
            syncTags();
            renderTags();
        };
        const renderTags = () => {
            tagPicker.querySelector("[data-selected-tags]").innerHTML = selectedTags.length
                ? selectedTags.map((tag, index) => `<button type="button" data-remove-tag="${index}" title="Remove ${escapeHtml(tag)}"><span>${escapeHtml(tag)}</span><b>×</b></button>`).join("")
                : `<small>No tags selected.</small>`;
            const suggestions = filterTagSuggestions(
                availableTags,
                tagSearch.value,
                selectedTags
            ).slice(0, 30);
            tagPicker.querySelector("[data-tag-suggestions]").innerHTML = suggestions.length
                ? suggestions.map(tag => `<button type="button" data-select-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")
                : `<small>No matching existing tags. Use “Add New Tag” to create it.</small>`;
            tagPicker.querySelectorAll("[data-remove-tag]").forEach(button => button.addEventListener("click", () => {
                selectedTags.splice(Number(button.dataset.removeTag), 1);
                syncTags();
                renderTags();
            }));
            tagPicker.querySelectorAll("[data-select-tag]").forEach(button => button.addEventListener("click", () => {
                addTag(button.dataset.selectTag);
            }));
        };
        tagSearch.addEventListener("input", renderTags);
        tagSearch.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            addTag(tagSearch.value);
        });
        tagPicker.querySelector("[data-add-tag]").addEventListener("click", () => addTag(tagSearch.value));
        renderTags();
        content.querySelector("[data-add-lore]").addEventListener("click", () => {
            collectCard();
            card.character_book.entries.push({ keys: [], comment: "", content: "" });
            renderCards();
            content.querySelector(".ccm-creator-advanced")?.setAttribute("open", "");
        });
        content.querySelectorAll("[data-remove-lore]").forEach(button => button.addEventListener("click", () => {
            collectCard();
            card.character_book.entries.splice(Number(button.dataset.removeLore), 1);
            renderCards();
            content.querySelector(".ccm-creator-advanced")?.setAttribute("open", "");
        }));

        const updateHealth = () => {
            collectCard();
            const issues = validateCreatorCard(
                card,
                state.cards.map(item => item.name)
            );
            const health = content.querySelector("[data-card-health]");
            health.innerHTML = `
                <div><strong>Card check</strong><span>About ${estimateTokens(card).toLocaleString()} tokens</span></div>
                ${issues.length
                    ? `<ul>${issues.map(issue => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`
                    : `<p>✓ Required fields and relationship references look complete.</p>`}
            `;
        };

        content.querySelector("[data-card-form]").addEventListener("input", updateHealth);
        updateHealth();

        content.querySelectorAll("[data-ai-field]").forEach(button => {
            button.addEventListener("click", async () => {
                collectCard();
                const field = button.dataset.aiField;
                const target = content.querySelector(`[name="${field}"]`);
                const instruction = window.prompt(
                    `How should AI ${target.value.trim() ? "revise" : "write"} this ${field.replaceAll("_", " ")} field?`,
                    target.value.trim()
                        ? "Improve clarity, detail, consistency, and character voice without changing established facts."
                        : "Write this field using all established character and cast details."
                );
                if (instruction === null) return;

                status(`Updating ${field.replaceAll("_", " ")}…`, true);
                try {
                    target.value = await execute(
                        "character-card-field",
                        {
                            field,
                            instruction,
                            currentText: target.value,
                            character: card,
                            castPlan: state.plan
                        },
                        { feature: "character-creator", characterId: card.name },
                        { source: state.creatorSource }
                    );
                    card[field] = target.value;
                    Object.assign(card, applyLockedCardDetails(
                        card,
                        state.plan,
                        state.plan.cast[state.active]
                    ));
                    target.value = card[field];
                    updateHealth();
                    status("Field updated.");
                } catch (error) {
                    status(error.message || "Field generation failed.");
                    showCCMError("Field generation failed.", error, "Character creator field generation");
                }
            });
        });

        content.querySelector("[data-preview]").addEventListener("click", () => {
            collectCard();
            const preview = document.createElement("div");
            preview.className = "ccm-card-preview-overlay";
            preview.innerHTML = `<article class="ccm-card-preview">
                <header><div><h3>${escapeHtml(card.name || "Unnamed Character")}</h3><p>Approximately ${estimateTokens(card).toLocaleString()} tokens</p></div><button data-close-preview>✕</button></header>
                <section><h4>Description</h4><pre>${escapeHtml(card.description)}</pre></section>
                <section><h4>Personality</h4><pre>${escapeHtml(card.personality)}</pre></section>
                <section><h4>Scenario</h4><pre>${escapeHtml(card.scenario)}</pre></section>
                <section><h4>First Message</h4><pre>${escapeHtml(card.first_mes)}</pre></section>
                <section><h4>Example Dialogue</h4><pre>${escapeHtml(card.mes_example)}</pre></section>
                <section><h4>Lorebook</h4><p>${card.character_book.entries.length} triggered entr${card.character_book.entries.length === 1 ? "y" : "ies"}</p></section>
            </article>`;
            preview.querySelector("[data-close-preview]").addEventListener("click", () => preview.remove());
            preview.addEventListener("click", event => { if (event.target === preview) preview.remove(); });
            dialog.appendChild(preview);
        });
        content.querySelector("[data-back]").addEventListener("click", () => {
            collectCard();
            state.mode === "guided"
                ? renderMode()
                : renderPlan();
        });
        content.querySelector("[data-next]").addEventListener("click", () => {
            try { collectCard(); renderCreate(); } catch (error) { status(error.message); }
        });
    }

    function renderCreate() {
        step(3);
        const multiple = state.cards.length > 1;
        content.innerHTML = `<section class="ccm-creator-section">
            <h4>Ready to create</h4><p>These will be separate SillyTavern cards:</p>
            <ul class="ccm-creator-summary">${state.cards.map((card, index) => {
                const selection = avatarSelections.get(index);
                return `<li data-avatar-row="${index}">
                    <div class="ccm-creator-card-identity">
                        ${selection?.previewUrl ? `<img class="ccm-creator-avatar-preview" src="${escapeHtml(selection.previewUrl)}" alt="${escapeHtml(card.name)} avatar preview">` : `<span class="ccm-creator-avatar-placeholder">No avatar</span>`}
                        <div><strong>${escapeHtml(card.name)}</strong><span>${escapeHtml(card.nickname || "Complete character card")}</span></div>
                    </div>
                    <div class="ccm-creator-avatar-actions">
                        <label class="ccm-avatar-upload">Upload ${helpTip("Choose an existing image. It will be used as this character's SillyTavern avatar.")}<input type="file" accept="image/*" data-avatar-index="${index}"></label>
                        <button type="button" data-generate-avatar="${index}">Generate Image</button>
                        <small data-avatar-status>${selection ? selection.label : "Upload, generate, or leave blank."}</small>
                    </div>
                </li>`;
            }).join("")}</ul>
            <label class="ccm-creator-field">${labelText("Creator name", "Optional author or creator credit embedded in the card.")}<input name="creator" placeholder="Optional" value="${escapeHtml(state.creatorName)}"></label>
            ${multiple ? `<label class="ccm-creator-checkbox"><input type="checkbox" name="createGroup" ${state.createGroup ? "checked" : ""}> Create a SillyTavern group containing these cards ${helpTip("The cards remain separate and can still be used alone. This only creates a group containing all of them.")}</label><label class="ccm-creator-field">${labelText("Group name", "The name shown for the new SillyTavern group containing these character cards.")}<input name="groupName" value="${escapeHtml(state.groupName || state.plan.setName || state.setup.setName || "New Character Set")}"></label>` : ""}
            <footer class="ccm-creator-actions"><button data-back>Back to Cards</button><span data-status></span><button data-create>Create in SillyTavern</button></footer>
        </section>`;
        content.querySelector("[data-back]").addEventListener("click", renderCards);
        content.querySelector('[name="creator"]').addEventListener("input", event => {
            state.creatorName = event.target.value;
        });
        content.querySelector('[name="createGroup"]')?.addEventListener("change", event => {
            state.createGroup = event.target.checked;
        });
        content.querySelector('[name="groupName"]')?.addEventListener("input", event => {
            state.groupName = event.target.value;
        });
        content.querySelectorAll("[data-avatar-index]").forEach(input => {
            input.addEventListener("change", () => {
                const index = Number(input.dataset.avatarIndex);
                const file = input.files?.[0];
                if (!file) return;
                const previous = avatarSelections.get(index);
                if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl);
                const objectUrl = URL.createObjectURL(file);
                avatarSelections.set(index, {
                    file,
                    previewUrl: objectUrl,
                    objectUrl,
                    label: "Uploaded image selected."
                });
                renderCreate();
            });
        });
        content.querySelectorAll("[data-generate-avatar]").forEach(button => {
            button.addEventListener("click", async () => {
                const index = Number(button.dataset.generateAvatar);
                const output = content.querySelector(`[data-avatar-row="${index}"] [data-avatar-status]`);
                const setupError = getSillyTavernImageSetupError();
                if (setupError) {
                    output.textContent = setupError;
                    return;
                }
                const presetId = getImageGenerationSettings().preset;
                const preset = presetId ? getImagePromptPresetSettings(presetId) : null;
                if (!presetId || !preset) {
                    output.textContent = "Select an Image Prompt Preset in CCM Settings first.";
                    return;
                }
                button.disabled = true;
                output.textContent = "Writing image prompt…";
                status("Writing the avatar image prompt…", true);
                try {
                    const parsedPrompt = await execute(
                        "image-prompt",
                        {
                            presetId,
                            preset,
                            continuity: buildCreatorImageContinuity(
                                state.cards[index],
                                state.plan?.cast?.[index]
                            )
                        },
                        { feature: "character-creator-avatar", characterId: state.cards[index].name },
                        { source: state.creatorSource }
                    );
                    const prompt = formatImagePrompt(parsedPrompt, presetId, preset);
                    status("Image prompt ready.");
                    openCreatorAvatarPrompt(index, prompt);
                } catch (error) {
                    button.disabled = false;
                    output.textContent = error.message || "Image generation failed.";
                    status(error.message || "Image generation failed.");
                    showCCMError("Avatar prompt generation failed.", error, "Character creator avatar prompt");
                }
            });
        });
        content.querySelector("[data-create]").addEventListener("click", async () => {
            const creator = content.querySelector('[name="creator"]').value.trim();
            const avatars = [];
            // Native SillyTavern creation may display its own confirmation.
            // Keep CCM's full-window wait layer out of the way so that popup
            // remains clickable; progress is shown in the footer instead.
            status("Creating cards…", true, false);
            try {
                for (let i = 0; i < state.cards.length; i++) {
                    status(`Creating ${state.cards[i].name} (${i + 1} of ${state.cards.length})…`, true, false);
                    avatars.push(await createSillyTavernCharacter(
                        state.cards[i],
                        creator,
                        avatarSelections.get(i)?.file || null
                    ));
                }
                if (content.querySelector('[name="createGroup"]')?.checked) {
                    status("Creating the group…", true, false);
                    await createSillyTavernGroup(content.querySelector('[name="groupName"]').value.trim(), avatars);
                }
                await refreshSillyTavernCharacters();
                clearDraft();
                status("", false, false);
                content.innerHTML = `<section class="ccm-creator-success"><div>✓</div><h4>Creation complete</h4><p>${state.cards.length} separate card${state.cards.length === 1 ? " was" : "s were"} added to SillyTavern.</p><button data-finish>Done</button></section>`;
                content.querySelector("[data-finish]").addEventListener("click", () => { dialog.remove(); onCreated?.(); });
            } catch (error) { status(error.message || "Creation failed."); }
        });
    }

    function openCreatorAvatarPrompt(index, prompt) {
        dialog.querySelector("[data-avatar-prompt-dialog]")?.remove();
        const overlay = document.createElement("div");
        overlay.className = "ccm-creator-avatar-dialog";
        overlay.dataset.avatarPromptDialog = "";
        overlay.innerHTML = `<article class="ccm-creator-avatar-dialog-card">
            <header><div><h4>Avatar Image: ${escapeHtml(state.cards[index].name)}</h4><p>${escapeHtml(prompt.presetLabel)} prompt</p></div><button type="button" data-avatar-dialog-close>✕</button></header>
            <section data-avatar-prompt-editor>
                <label class="ccm-creator-field">${labelText("Positive prompt", "Edit anything that should appear in the generated avatar.")}<textarea rows="8" data-avatar-positive>${escapeHtml(prompt.positive)}</textarea></label>
                <label class="ccm-creator-field">${labelText("Negative prompt", "Describe unwanted elements. This may be blank for models that do not use negative prompts.")}<textarea rows="5" data-avatar-negative>${escapeHtml(prompt.negative || "")}</textarea></label>
            </section>
            <section class="ccm-creator-avatar-result" data-avatar-result hidden>
                <img data-avatar-result-image alt="Generated avatar preview">
                <p data-avatar-result-status>Review the generated image before using it.</p>
            </section>
            <footer class="ccm-creator-avatar-dialog-actions">
                <button type="button" data-avatar-edit hidden>Edit Prompt</button>
                <span data-avatar-dialog-status>Review and edit the prompt before generating.</span>
                <button type="button" data-avatar-generate>Generate Image</button>
                <button type="button" data-avatar-use hidden>Use This Image</button>
            </footer>
        </article>`;
        dialog.querySelector(".ccm-creator-window").appendChild(overlay);

        const editor = overlay.querySelector("[data-avatar-prompt-editor]");
        const result = overlay.querySelector("[data-avatar-result]");
        const image = overlay.querySelector("[data-avatar-result-image]");
        const generateButton = overlay.querySelector("[data-avatar-generate]");
        const editButton = overlay.querySelector("[data-avatar-edit]");
        const useButton = overlay.querySelector("[data-avatar-use]");
        const dialogStatus = overlay.querySelector("[data-avatar-dialog-status]");
        let generatedUrl = "";

        const close = () => overlay.remove();
        overlay.querySelector("[data-avatar-dialog-close]").addEventListener("click", close);
        overlay.addEventListener("click", event => {
            if (event.target === overlay) close();
        });
        editButton.addEventListener("click", () => {
            editor.hidden = false;
            result.hidden = true;
            editButton.hidden = true;
            useButton.hidden = true;
            generateButton.hidden = false;
            generateButton.textContent = generatedUrl ? "Generate Again" : "Generate Image";
            dialogStatus.textContent = "Edit the prompt, then generate another image.";
        });
        generateButton.addEventListener("click", async () => {
            const positive = overlay.querySelector("[data-avatar-positive]").value.trim();
            const negative = overlay.querySelector("[data-avatar-negative]").value.trim();
            if (!positive) {
                dialogStatus.textContent = "The positive prompt cannot be empty.";
                return;
            }
            overlay.querySelectorAll("button, textarea").forEach(element => element.disabled = true);
            dialogStatus.textContent = "Please wait — SillyTavern is generating the image…";
            try {
                generatedUrl = await generateWithSillyTavernImage(positive, negative);
                image.src = generatedUrl;
                editor.hidden = true;
                result.hidden = false;
                editButton.hidden = false;
                useButton.hidden = false;
                generateButton.hidden = true;
                dialogStatus.textContent = "Use this image, or edit the prompt and try again.";
            } catch (error) {
                dialogStatus.textContent = error.message || "Image generation failed.";
            } finally {
                overlay.querySelectorAll("button, textarea").forEach(element => element.disabled = false);
            }
        });
        useButton.addEventListener("click", async () => {
            if (!generatedUrl) return;
            overlay.querySelectorAll("button").forEach(element => element.disabled = true);
            dialogStatus.textContent = "Preparing the avatar…";
            try {
                const file = await generatedImageToFile(generatedUrl, state.cards[index].name);
                const previous = avatarSelections.get(index);
                if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl);
                avatarSelections.set(index, {
                    file,
                    previewUrl: generatedUrl,
                    objectUrl: "",
                    label: `Generated with ${prompt.presetLabel}.`
                });
                close();
                renderCreate();
            } catch (error) {
                overlay.querySelectorAll("button").forEach(element => element.disabled = false);
                dialogStatus.textContent = error.message || "Could not prepare the generated avatar.";
            }
        });
    }

    dialog.querySelector("[data-close]").addEventListener("click", () => dialog.remove());
    const popupHost = document.getElementById("ccm-panel")?.closest("dialog.popup")?.querySelector(".popup-body");
    (document.getElementById("ccm-popup-root") || popupHost || document.body).appendChild(dialog);
    renderCount();
}
