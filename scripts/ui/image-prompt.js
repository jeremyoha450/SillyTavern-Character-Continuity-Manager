// scripts/ui/image-prompt.js

import {
    getCharacter
} from "../database.js";

import {
    generateImagePrompt
} from "../providers/provider-manager.js";

import {
    showCCMStatus,
    showCCMError,
    hideCCMStatus
} from "./status.js";

import {
    formatImagePrompt
} from "../tasks/image/formatter.js";

import {
    getImageGenerationSettings,
    getImagePromptPresetSettings
} from "../ai/settings.js";

import {
    addImageRecord,
    updateImageRecord
} from "../image-history.js";

import {
    isUnderage,
    UNDERAGE_MESSAGE
} from "../extraction/age-guard.js";

const STATE_FIELDS = new Set([
    "upper",
    "outerwear",
    "lower",
    "footwear",
    "underwearTop",
    "underwearBottom",
    "location",
    "position",
    "area",
    "positionDetail",
    "leftHand",
    "rightHand",
    "headPosition",
    "eyeDirection",
    "expression",
    "mood",
    "moodIntensity",
    "accessories",
    "penis",
    "penisState",
    "penisCondition",
    "pussy",
    "pussyState",
    "pussyCondition",
    "condition",
    "injuries"
]);

const EXCLUDED_FIELDS = new Set([
    "characterName",
    "notes"
]);

function getCurrentContinuity(
    character
) {

    const facts = {};
    const state = {};

    for (
        const [field, data]
        of Object.entries(character.facts || {})
    ) {

        if (EXCLUDED_FIELDS.has(field)) {
            continue;
        }

        const value =
            data?.value;

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim()
        ) {
            const destination =
                STATE_FIELDS.has(field)
                    ? state
                    : facts;

            destination[field] = value;
        }

    }

    return {
        primaryCharacter: {
            facts,
            state
        }
    };

}

function quoteSlashValue(value) {
    return JSON.stringify(
        String(value || "")
    );
}

function normalizeGeneratedImageUrl(value) {
    const imageUrl =
        String(value || "").trim();

    if (!imageUrl) {
        throw new Error(
            "SillyTavern did not return an image URL."
        );
    }

    const parsed =
        new URL(imageUrl, location.origin);

    if (![
        "http:",
        "https:"
    ].includes(parsed.protocol)) {
        throw new Error(
            "SillyTavern returned an unsupported image URL."
        );
    }

    return imageUrl;
}

function getSillyTavernImageSetupError() {
    const context =
        SillyTavern.getContext();

    if (
        typeof context
            ?.executeSlashCommandsWithOptions !==
            "function" ||
        !document.body.classList.contains("sd")
    ) {
        return "SillyTavern Image Generation is not available. Enable its Image Generation extension first.";
    }

    const settings =
        context.extensionSettings?.sd;

    if (!settings?.source) {
        return "SillyTavern Image Generation is not configured. Select and configure an image source in SillyTavern first.";
    }

    const selectedModel =
        String(
            settings.source === "huggingface"
                ? settings.huggingface_model_id || ""
                : settings.model ||
                    document.querySelector(
                        "#sd_model"
                    )?.value ||
                    ""
        ).trim();

    if (!selectedModel) {
        return "SillyTavern Image Generation is not configured. Connect its image source and select a model first.";
    }

    return "";
}

async function generateWithSillyTavern(
    characterId,
    positive,
    negative
) {
    const context =
        SillyTavern.getContext();

    const character =
        getCharacter(characterId);

    const activeCharacter =
        context?.characters?.[
            context.characterId
        ];

    const sameCharacter =
        !!character &&
        !!activeCharacter &&
        (
            character.avatar &&
            activeCharacter.avatar
                ? character.avatar ===
                    activeCharacter.avatar
                : character.name ===
                    activeCharacter.name
        );

    if (!sameCharacter) {
        throw new Error(
            "Open this character's SillyTavern chat before generating an image."
        );
    }

    const execute =
        context
            ?.executeSlashCommandsWithOptions;

    if (typeof execute !== "function") {
        throw new Error(
            "This SillyTavern version does not expose slash-command execution."
        );
    }

    const negativeArgument =
        negative
            ? ` negative=${quoteSlashValue(negative)}`
            : "";

    const command =
        `/sd quiet=true${negativeArgument} ${quoteSlashValue(positive)}`;

    const result =
        await execute(command, {
            handleExecutionErrors: true,
            source: "CCM"
        });

    if (result?.isError) {
        throw new Error(
            result.errorMessage ||
            "SillyTavern image generation failed."
        );
    }

    return normalizeGeneratedImageUrl(
        result?.pipe
    );
}

function showImagePrompt(
    characterId,
    characterName,
    prompt,
    {
        recordId = null,
        onChanged = null
    } = {}
) {

    document
        .getElementById(
            "ccm-image-prompt-dialog"
        )
        ?.remove();

    const dialog =
        document.createElement("div");

    dialog.id =
        "ccm-image-prompt-dialog";

    dialog.innerHTML = `
        <div class="ccm-image-prompt-card">
            <div class="ccm-image-prompt-header">
                <h3 id="ccm-image-prompt-title"></h3>
                <button id="ccm-image-prompt-close" type="button">✕</button>
            </div>

            <label for="ccm-image-prompt-text">
                Positive Prompt
            </label>
            <textarea
                id="ccm-image-prompt-text"
                class="ccm-image-prompt-text"
            ></textarea>

            <div class="ccm-image-prompt-actions">
                <button id="ccm-image-prompt-copy" type="button">
                    Copy Positive
                </button>
                <button id="ccm-image-prompt-copy-all" type="button">
                    Copy Prompt
                </button>
            </div>

            ${prompt.negative
                ? `
                    <label for="ccm-image-negative-prompt-text">
                        Negative Prompt
                    </label>
                    <textarea
                        id="ccm-image-negative-prompt-text"
                        class="ccm-image-prompt-text ccm-image-negative-prompt-text"
                    ></textarea>

                    <div class="ccm-image-prompt-actions">
                        <button id="ccm-image-negative-prompt-copy" type="button">
                            Copy Negative
                        </button>
                    </div>
                `
                : ""
            }

            <div class="ccm-image-prompt-generate-actions">
                <button id="ccm-image-prompt-generate" type="button">
                    Generate Image
                </button>
            </div>
        </div>
    `;

    (SillyTavern.getContext()
        ?.Popup?.util?.getTopmostModalLayer?.()
        || document.body).appendChild(
        dialog
    );

    const title =
        document.getElementById(
            "ccm-image-prompt-title"
        );

    const textarea =
        document.getElementById(
            "ccm-image-prompt-text"
        );

    title.textContent =
        `Image Prompt: ${characterName} (${prompt.presetLabel})`;

    textarea.value = prompt.positive;

    const negativeTextarea =
        document.getElementById(
            "ccm-image-negative-prompt-text"
        );

    if (negativeTextarea) {
        negativeTextarea.value =
            prompt.negative;
    }

    const savePromptEdits = () => {
        if (!recordId) return;

        updateImageRecord(
            characterId,
            recordId,
            {
                positive: textarea.value.trim(),
                negative:
                    negativeTextarea
                        ?.value.trim() || ""
            }
        );
    };

    const close = () => {
        savePromptEdits();
        document.removeEventListener(
            "keydown",
            onKeyDown
        );
        dialog.remove();
        onChanged?.();
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

    document
        .getElementById(
            "ccm-image-prompt-close"
        )
        .addEventListener(
            "click",
            close
        );

    dialog.addEventListener(
        "click",
        event => {
            if (event.target === dialog) {
                close();
            }
        }
    );

    const bindCopyButton = (
        buttonId,
        textarea,
        defaultLabel
    ) => {

        document
            .getElementById(
                buttonId
            )
            .addEventListener(
                "click",
                async event => {

                    const button =
                        event.currentTarget;

                    try {

                        if (navigator.clipboard) {
                            await navigator.clipboard.writeText(
                                textarea.value
                            );
                        } else {
                            textarea.select();
                            document.execCommand("copy");
                        }

                        button.textContent =
                            "Copied";

                        setTimeout(
                            () => {
                                button.textContent =
                                    defaultLabel;
                            },
                            1500
                        );

                    } catch (error) {

                        console.error(
                            "[CCM] Failed to copy image prompt",
                            error
                        );

                        textarea.focus();
                        textarea.select();

                    }

                }
            );

    };

    bindCopyButton(
        "ccm-image-prompt-copy",
        textarea,
        "Copy Positive"
    );

    if (negativeTextarea) {
        bindCopyButton(
            "ccm-image-negative-prompt-copy",
            negativeTextarea,
            "Copy Negative"
        );
    }

    document
        .getElementById(
            "ccm-image-prompt-copy-all"
        )
        .addEventListener(
            "click",
            async event => {
                const button =
                    event.currentTarget;

                const negative =
                    negativeTextarea
                        ?.value.trim();

                const text = negative
                    ? `${textarea.value.trim()}\n\nNegative prompt:\n${negative}`
                    : textarea.value.trim();

                try {
                    if (navigator.clipboard) {
                        await navigator.clipboard
                            .writeText(text);
                    } else {
                        const copyArea =
                            document.createElement(
                                "textarea"
                            );
                        copyArea.value = text;
                        document.body.appendChild(
                            copyArea
                        );
                        copyArea.select();
                        document.execCommand("copy");
                        copyArea.remove();
                    }
                    button.textContent = "Copied";
                    setTimeout(
                        () => {
                            button.textContent =
                                "Copy Prompt";
                        },
                        1500
                    );
                } catch (error) {
                    console.error(
                        "[CCM] Failed to copy complete prompt",
                        error
                    );
                    textarea.focus();
                    textarea.select();
                }
            }
        );

    document
        .getElementById(
            "ccm-image-prompt-generate"
        )
        .addEventListener(
            "click",
            async event => {
                const button =
                    event.currentTarget;

                const positive =
                    textarea.value.trim();

                const negative =
                    negativeTextarea
                        ?.value.trim() || "";

                if (!positive) {
                    showCCMError(
                        "The positive prompt is empty."
                    );
                    return;
                }

                if (!recordId) {
                    const record =
                        addImageRecord(
                            characterId,
                            {
                                presetId:
                                    prompt.presetId,
                                presetLabel:
                                    prompt.presetLabel,
                                positive,
                                negative,
                                status: "generating"
                            }
                        );

                    recordId = record.id;
                } else {
                    updateImageRecord(
                        characterId,
                        recordId,
                        {
                            positive,
                            negative,
                            status: "generating",
                            error: ""
                        }
                    );
                }

                button.disabled = true;
                button.textContent =
                    "Generating…";

                showCCMStatus(`
                    <div style="font-size:52px;">🎨</div>
                    <br>
                    Generating Image...
                    <br><br>
                    SillyTavern is using its selected image source.
                `);

                try {
                    const imageUrl =
                        await generateWithSillyTavern(
                            characterId,
                            positive,
                            negative
                        );

                    updateImageRecord(
                        characterId,
                        recordId,
                        {
                            positive,
                            negative,
                            imageUrl,
                            status: "generated",
                            error: "",
                            generatedAt: Date.now()
                        }
                    );

                    hideCCMStatus();
                    close();
                } catch (error) {
                    console.error(
                        "[CCM] SillyTavern image generation failed",
                        error
                    );

                    updateImageRecord(
                        characterId,
                        recordId,
                        {
                            positive,
                            negative,
                            status: "failed",
                            error:
                                error.message ||
                                "Image generation failed."
                        }
                    );

                    button.disabled = false;
                    button.textContent =
                        "Generate Image";
                    onChanged?.();
                    showCCMError(
                        error.message ||
                        "Failed to generate image."
                    );
                }
            }
        );

    textarea.focus();

}

export async function createCharacterImagePrompt(
    id,
    onChanged = null
) {

    const character =
        getCharacter(id);

    if (!character) {
        showCCMError(
            "Character not found."
        );
        return;
    }

    if (isUnderage(character.facts)) {
        showCCMError(
            UNDERAGE_MESSAGE
        );
        return;
    }

    const presetId =
        getImageGenerationSettings()
            .preset;

    if (!presetId) {
        showCCMError(
            "Select an Image Prompt Preset in CCM Settings first."
        );
        return;
    }

    const preset =
        getImagePromptPresetSettings(
            presetId
        );

    if (!preset) {
        showCCMError(
            "The selected Image Prompt Preset is unavailable. Choose another preset in CCM Settings."
        );
        return;
    }

    const imageSetupError =
        getSillyTavernImageSetupError();

    if (imageSetupError) {
        showCCMError(
            imageSetupError
        );
        return;
    }

    showCCMStatus(`
        <div style="font-size:52px;">⏳</div>
        <br>
        Generating Image Prompt...
        <br><br>
        Please wait...
    `);

    try {

        const parsedPrompt =
            await generateImagePrompt(
                {
                    presetId,
                    preset,
                    continuity:
                        getCurrentContinuity(
                            character
                        )
                },
                {
                    characterId: id,
                    characterName:
                        character.name
                }
            );

        const prompt =
            formatImagePrompt(
                parsedPrompt,
                presetId,
                preset
            );

        const record =
            addImageRecord(
                id,
                {
                    presetId:
                        prompt.presetId,
                    presetLabel:
                        prompt.presetLabel,
                    positive:
                        prompt.positive,
                    negative:
                        prompt.negative
                }
            );

        hideCCMStatus();

        onChanged?.();

        showImagePrompt(
            id,
            character.name,
            prompt,
            {
                recordId: record.id,
                onChanged
            }
        );

    } catch (error) {

        console.error(
            "[CCM] Failed to generate image prompt",
            error
        );

        showCCMError(
            "Failed to generate image prompt."
        );

    }

}

export function openSavedImagePrompt(
    characterId,
    record,
    onChanged = null
) {
    const character =
        getCharacter(characterId);

    if (!character || !record) return;

    showImagePrompt(
        characterId,
        character.name,
        {
            presetId: record.presetId,
            presetLabel:
                record.presetLabel ||
                "Saved Prompt",
            positive: record.positive || "",
            negative: record.negative || ""
        },
        {
            recordId:
                record.imageUrl
                    ? null
                    : record.id,
            onChanged
        }
    );
}
