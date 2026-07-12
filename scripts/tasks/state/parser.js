// scripts/tasks/state/parser.js

import schema
from "./schema.js";

import { debugLog } from "../../debug-logger.js";

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

// Some local models finish an otherwise complete JSON response without the
// final one or two container-closing characters. Only repair that narrow case:
// strings must be complete and every existing closing character must match.
function closeUnfinishedContainers(text) {

    const stack = [];
    let inString = false;
    let escaped = false;

    for (const character of text) {

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (character === "\\") {
                escaped = true;
            } else if (character === '"') {
                inString = false;
            }
            continue;
        }

        if (character === '"') {
            inString = true;
        } else if (character === "{" || character === "[") {
            stack.push(character);
        } else if (character === "}" || character === "]") {
            const expected = character === "}" ? "{" : "[";
            if (stack.pop() !== expected) return null;
        }

    }

    if (inString || escaped || stack.length === 0) return null;

    return text + stack.reverse()
        .map(character => character === "{" ? "}" : "]")
        .join("");

}

// Models sometimes return literal quote marks (e.g. "''")
// when instructed that a field "must be ''". A quote-only
// value is junk and means empty.
function normalizeValue(raw) {

    const value =
        raw === undefined ||
        raw === null
            ? ""
            : String(raw).trim();

    return /^["'`]+$/.test(value)
        ? ""
        : value;

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
            normalizeValue(source.value);

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

    const cleaned = cleanResponse(text);

    try {

        data =
            JSON.parse(cleaned);

    } catch (firstError) {

        const repaired =
            closeUnfinishedContainers(cleaned);

        if (repaired) {
            try {
                data = JSON.parse(repaired);
                console.warn(
                    "[CCM] Added missing closing braces to State JSON"
                );
                debugLog("state", "response.repaired", {
                    operation: "parse",
                    status: "repaired",
                    errorType: firstError?.name || "Error"
                });
            } catch {
                data = null;
            }
        }

        if (data) {
            // Required-key validation below ensures an early, substantially
            // incomplete response is not accepted merely because it closes.
        } else {

            console.error(
                "[CCM] Failed To Parse State",
                firstError
            );

            // Returning an empty schema here would merge as
            // "no changes" and hide the failure; a malformed
            // response must abort the update so the stored
            // state is left untouched.
            throw new Error(
                "State response was not valid JSON."
            );

        }

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
