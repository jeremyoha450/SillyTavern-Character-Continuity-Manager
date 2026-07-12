export function parseJsonListResponse(
    text,
    cleanResponse
) {

    const cleaned =
        cleanResponse(text);

    try {
        return JSON.parse(cleaned);
    } catch (originalError) {

        const joined =
            cleaned
                .replace(/]\s*\[/g, ",")
                .replace(/]\s*{/g, ",{")
                .replace(/}\s*\[/g, "},")
                .replace(/}\s*{/g, "},{");

        const candidate =
            joined.trim().startsWith("[")
                ? joined
                : `[${joined}]`;

        try {
            return JSON.parse(candidate);
        } catch {
            throw originalError;
        }

    }

}
