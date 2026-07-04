// scripts/tasks/state/parser.js

import schema
from "./schema.js";

// The prompt requires the first two to be populated in
// every response, and the override fields to be present
// (usually as ""); a missing key means the response is
// malformed.
const REQUIRED_KEYS = [
    "underwearTop",
    "underwearBottom",
    "hairColor",
    "hairStyle",
    "bodyType",
    "relationship"
];

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

        throw new Error(
            "State response was not text."
        );

    }

    let data;

    try {

        data =
            JSON.parse(
                cleanResponse(text)
            );

    } catch (error) {

        console.error(
            "[CCM] Failed To Parse State",
            error
        );

        // Returning an empty schema here would merge as
        // "no changes" and hide the failure; a malformed
        // response must abort the update so the stored
        // state is left untouched.
        throw new Error(
            "State response was not valid JSON."
        );

    }

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {

        throw new Error(
            "State response was not an object."
        );

    }

    for (const key of REQUIRED_KEYS) {

        if (!(key in data)) {

            throw new Error(
                `State response is missing required key '${key}'.`
            );

        }

    }

    return normalizeState(data);

}
