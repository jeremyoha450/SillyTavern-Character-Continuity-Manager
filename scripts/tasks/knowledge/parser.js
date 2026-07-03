// scripts/tasks/knowledge/parser.js

import schema
from "./schema.js";

function cleanResponse(
    text
) {

    return String(text || "")
        .trim()
        .replace(
            /^```(?:json)?\s*/i,
            ""
        )
        .replace(
            /\s*```$/,
            ""
        )
        .trim();

}

export function parse(
    text
) {

    console.log(
        "[CCM] Parsing Knowledge"
    );

    try {

        const data =
            JSON.parse(
                cleanResponse(text)
            );

        if (!Array.isArray(data)) {
            return structuredClone(schema);
        }

        return data
            .filter(
                item =>
                    item &&
                    typeof item.text === "string"
            )
            .map(
                item => ({
                    text:
                        item.text.trim(),

                    confidence:
                        Number(
                            item.confidence || 0
                        )
                })
            )
            .filter(
                item =>
                    item.text
            );

    } catch (error) {

        console.error(
            "[CCM] Failed To Parse Knowledge",
            error
        );

        return structuredClone(schema);

    }

}