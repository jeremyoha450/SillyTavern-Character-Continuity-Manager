// scripts/ui/image-prompt.js

import {
    getCharacter,
    getScopedCharacter,
    getGroupContext
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
    applyNudityBackstop
} from "../tasks/image/nudity.js";

import {
    getImageGenerationSettings,
    getImagePromptPresetSettings
} from "../ai/settings.js";

import {
    addImageRecord,
    updateImageRecord
} from "../image-history.js";

import {
    isCharacterInCurrentContext
} from "../group-context.js";

import {
    openSillyTavernCharacterChat
} from "../image-chat-context.js";

import {
    buildImageContinuity
} from "../image-context.js";

import {
    generateWithSillyTavernImage,
    getSillyTavernImageSetupError
} from "../sillytavern-image.js";

async function generateWithSillyTavern(
    characterId,
    positive,
    negative
) {
    const context =
        SillyTavern.getContext();

    const character =
        getCharacter(characterId);

    if (
        !character ||
        !isCharacterInCurrentContext(
            context,
            character
        )
    ) {
        throw new Error(
            "Open a chat or group containing this character before generating an image."
        );
    }

    return generateWithSillyTavernImage(positive, negative);
}

export async function ensureActiveCharacterChat(
    character,
    actionLabel = "This action"
) {
    const context =
        SillyTavern.getContext();

    if (
        isCharacterInCurrentContext(
            context,
            character
        )
    ) {
        return true;
    }

    const message =
        `${actionLabel} requires an active chat with this character.`;

    const confirmOpen =
        context?.Popup?.show?.confirm;

    if (typeof confirmOpen !== "function") {
        showCCMError(message);
        return false;
    }

    const confirmed =
        await context.Popup.show.confirm(
            "Open Character Chat?",
            `${message} Open the chat now?`,
            {
                okButton:
                    "Open Character Chat",
                cancelButton: "Cancel"
            }
        );

    if (!confirmed) return false;

    try {
        await openSillyTavernCharacterChat(
            context,
            character
        );
    } catch (error) {
        console.error(
            "[CCM] Failed to open character chat",
            error
        );

        showCCMError(
            error.message ||
            "Failed to open the character chat."
        );
        return false;
    }

    if (
        !isCharacterInCurrentContext(
            SillyTavern.getContext(),
            character
        )
    ) {
        showCCMError(
            "SillyTavern did not activate the selected character chat."
        );
        return false;
    }

    return true;
}

function showImagePrompt(
    characterId,
    characterName,
    prompt,
    {
        recordId = null,
        onChanged = null,
        groupId = ""
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
            },
            groupId
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
                            },
                            groupId
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
                        },
                        groupId
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
                        },
                        groupId
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
                        },
                        groupId
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
    onChanged = null,
    groupId = ""
) {

    const character =
        getScopedCharacter(
            id,
            groupId
        );

    if (!character) {
        showCCMError(
            "Character not found."
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

    if (
        !await ensureActiveCharacterChat(
            character,
            "Image generation"
        )
    ) {
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

        const continuity =
            buildImageContinuity(
                character,
                {
                    groupScene:
                        groupId
                            ? getGroupContext(
                                groupId
                            )?.scene
                            : null,
                    baseCharacter:
                        groupId
                            ? getCharacter(id)
                            : null
                }
            );

        const parsedPrompt =
            await generateImagePrompt(
                {
                    presetId,
                    preset,
                    continuity
                },
                {
                    characterId: id,
                    characterName:
                        character.name
                }
            );

        const prompt =
            formatImagePrompt(
                applyNudityBackstop(
                    parsedPrompt,
                    continuity
                        .primaryCharacter
                        .state,
                    preset
                ),
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
                },
                groupId
            );

        hideCCMStatus();

        onChanged?.();

        showImagePrompt(
            id,
            character.name,
            prompt,
            {
                recordId: record.id,
                onChanged,
                groupId
            }
        );

    } catch (error) {

        console.error(
            "[CCM] Failed to generate image prompt",
            error
        );

        showCCMError(
            "Failed to generate image prompt.",
            error,
            "Image prompt generation"
        );

    }

}

export function openSavedImagePrompt(
    characterId,
    record,
    onChanged = null,
    groupId = ""
) {
    const character =
        getScopedCharacter(
            characterId,
            groupId
        );

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
            onChanged,
            groupId
        }
    );
}
