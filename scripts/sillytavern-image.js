import { debugLog } from "./debug-logger.js";

function quoteSlashValue(value) {
    return JSON.stringify(String(value || ""));
}

export function getSillyTavernImageSetupError() {
    const context = SillyTavern.getContext();
    if (
        typeof context?.executeSlashCommandsWithOptions !== "function" ||
        !document.body.classList.contains("sd")
    ) {
        return "SillyTavern Image Generation is not available. Enable its Image Generation extension first.";
    }

    const settings = context.extensionSettings?.sd;
    if (!settings?.source) {
        return "SillyTavern Image Generation is not configured. Select and configure an image source first.";
    }
    const model = String(
        settings.source === "huggingface"
            ? settings.huggingface_model_id || ""
            : settings.model || document.querySelector("#sd_model")?.value || ""
    ).trim();
    return model
        ? ""
        : "SillyTavern Image Generation is not configured. Select an image model first.";
}

export async function generateWithSillyTavernImage(positive, negative = "") {
    const startedAt = performance.now();
    debugLog("images", "image-generation.started", {
        operation: "generate",
        status: "started"
    });
    const execute = SillyTavern.getContext()?.executeSlashCommandsWithOptions;
    if (typeof execute !== "function") {
        throw new Error("This SillyTavern version does not expose slash-command execution.");
    }
    const negativeArgument = negative
        ? ` negative=${quoteSlashValue(negative)}`
        : "";
    let result;
    try {
        result = await execute(
            `/sd quiet=true${negativeArgument} ${quoteSlashValue(positive)}`,
            { handleExecutionErrors: true, source: "CCM" }
        );
    } catch (error) {
        debugLog("images", "image-generation.failed", {
            operation: "generate",
            status: "failed",
            durationMs: Math.round(performance.now() - startedAt),
            errorType: error?.name || "Error"
        });
        throw error;
    }
    if (result?.isError) {
        throw new Error(result.errorMessage || "SillyTavern image generation failed.");
    }
    const imageUrl = String(result?.pipe || "").trim();
    if (!imageUrl) throw new Error("SillyTavern did not return an image URL.");
    const parsed = new URL(imageUrl, location.origin);
    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("SillyTavern returned an unsupported image URL.");
    }
    debugLog("images", "image-generation.completed", {
        operation: "generate",
        status: "success",
        durationMs: Math.round(performance.now() - startedAt)
    });
    return imageUrl;
}

export async function generatedImageToFile(imageUrl, characterName) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Could not load the generated image (HTTP ${response.status}).`);
    }
    const blob = await response.blob();
    const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const safeName = String(characterName || "character")
        .replace(/[^a-z0-9_-]+/gi, "-")
        .replace(/^-+|-+$/g, "") || "character";
    return new File([blob], `${safeName}-avatar.${extension}`, { type: blob.type || "image/png" });
}
