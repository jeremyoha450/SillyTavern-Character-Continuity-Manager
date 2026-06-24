// parser.js

import {
    extractFacts as providerExtractFacts
} from "./providers/provider-manager.js";

export async function extractFacts(
    text
) {
    return await providerExtractFacts(
        text
    );
}