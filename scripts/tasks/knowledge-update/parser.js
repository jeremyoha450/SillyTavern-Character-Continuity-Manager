// scripts/tasks/knowledge-update/parser.js

import { debugLog } from "../../debug-logger.js";

import {
    parseJsonListResponse
} from "../knowledge/json-list-parser.js";

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

export function parse(
    text
) {


    if (typeof text !== "string") {

        throw new Error(
            "Knowledge update returned no text."
        );

    }

    let data;

    try {

        data =
            parseJsonListResponse(
                text,
                cleanResponse
            );

    } catch (error) {

        console.error(
            "[CCM] Failed To Parse Knowledge Update",
            error
        );
        debugLog("knowledge", "update-response.parse-failed", {
            operation: "parse-update",
            status: "failed",
            errorType: error?.name || "Error"
        });

        // An unparseable response must fail the update.
        // Returning an empty list here would be saved as
        // "all knowledge removed" by the caller.
        throw new Error(
            "Knowledge update returned invalid JSON."
        );

    }

    if (!Array.isArray(data)) {

        throw new Error(
            "Knowledge update did not return a list."
        );

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

}
