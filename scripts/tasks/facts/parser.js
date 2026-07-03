// scripts/tasks/facts/parser.js

import schema
from "./schema.js";

const FLAT_VALUE_CONFIDENCE = 50;

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

function repairNestedValues(
    text
) {

    return text.replace(
        /"([^"]+)"\s*:\s*\{\s*"value"\s*:\s*\{\s*"value"\s*:\s*("(?:\\.|[^"\\])*"|null)\s*,\s*"confidence"\s*:\s*(\d+(?:\.\d+)?)\s*\}(?=\s*,\s*"[^"]+"\s*:)/g,
        '"$1":{"value":$2,"confidence":$3}'
    );

}

function normalizeFacts(
    data
) {

    const result =
        structuredClone(schema);

    for (const key of Object.keys(result)) {

        const source =
            data?.[key];

        if (
            source === undefined ||
            source === null
        ) {
            continue;
        }

        if (typeof source !== "object") {

            const value =
                String(source).trim();

            result[key].value = value;
            result[key].confidence =
                value
                    ? FLAT_VALUE_CONFIDENCE
                    : 0;

            continue;

        }

        const nested =
            source.value &&
            typeof source.value === "object"
                ? source.value
                : null;

        const rawValue =
            nested
                ? nested.value
                : source.value;

        const rawConfidence =
            nested
                ? nested.confidence
                : source.confidence;

        result[key].value =
            rawValue === undefined ||
            rawValue === null
                ? ""
                : String(rawValue);

        const confidence =
            Number(rawConfidence);

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

    console.log(
        "[CCM] Parsing Facts"
    );

    if (typeof text !== "string") {
        return structuredClone(schema);
    }

    const cleaned =
        cleanResponse(text);

    try {

        return normalizeFacts(
            JSON.parse(cleaned)
        );

    } catch (firstError) {

        try {

            const repaired =
                repairNestedValues(cleaned);

            const data =
                JSON.parse(repaired);

            console.warn(
                "[CCM] Repaired malformed Facts JSON",
                firstError
            );

            return normalizeFacts(data);

        } catch (error) {

            console.error(
                "[CCM] Failed To Parse Facts",
                error
            );

            return structuredClone(schema);

        }

    }

}
