// scripts/tasks/state/parser.js

import schema
from "./schema.js";

function cleanResponse(
    text
) {

    return text
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

function normalizeState(
    data
) {

    const result =
        structuredClone(schema);

    for (const key of Object.keys(result)) {

        const source =
            data?.[key];

        if (
            !source ||
            typeof source !== "object"
        ) {
            continue;
        }

        result[key].value =
            source.value === undefined ||
            source.value === null
                ? ""
                : String(source.value);

        const confidence =
            Number(source.confidence);

        result[key].confidence =
            Number.isFinite(confidence)
                ? Math.max(
                    0,
                    Math.min(100, confidence)
                )
                : 0;

    }

    return result;

}

export function parse(
    text
) {

    if (typeof text !== "string") {
        return structuredClone(schema);
    }

    try {

        const data =
            JSON.parse(
                cleanResponse(text)
            );

        return normalizeState(data);

    } catch (error) {

        console.error(
            "[CCM] Failed To Parse State",
            error
        );

        return structuredClone(schema);

    }

}
