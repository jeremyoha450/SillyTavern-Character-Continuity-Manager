export function parse(text) {

    if (typeof text !== "string") {
        throw new Error(
            "Image prompt response was not text."
        );
    }

    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

    let positive = cleaned;
    let negative = "";

    try {
        const data = JSON.parse(cleaned);

        positive =
            data.prompt ||
            data.positivePrompt ||
            data.positive ||
            "";

        negative =
            data.negativePrompt ||
            data.negative ||
            "";
    } catch {
        positive = cleaned.replace(
            /^(?:positive\s+)?prompt\s*:\s*/i,
            ""
        );
    }

    if (!String(positive).trim()) {
        throw new Error(
            "The AI returned an empty image prompt."
        );
    }

    return {
        positive: String(positive).trim(),
        negative: String(negative).trim()
    };
}
