// scripts/tasks/knowledge/parser.js

import { debugLog } from "../../debug-logger.js";

import {
    parseJsonListResponse
} from "./json-list-parser.js";

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


    try {

        const data =
            parseJsonListResponse(
                text,
                cleanResponse
            );

        if (!Array.isArray(data)) {
            throw new Error("Knowledge response did not contain a JSON list.");
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
        debugLog("knowledge", "response.parse-failed", {
            operation: "parse",
            status: "failed",
            errorType: error?.name || "Error"
        });

        throw new Error(
            "Knowledge response was not valid JSON.",
            { cause: error }
        );

    }

}
