import { debugLog } from "../../debug-logger.js";

function clean(text) {
    return String(text || "")
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
}

function removeTrailingCommas(text) {
    let result = "";
    let inString = false;
    let escaped = false;

    for (let index = 0; index < text.length; index++) {
        const character = text[index];
        if (inString) {
            result += character;
            if (escaped) escaped = false;
            else if (character === "\\") escaped = true;
            else if (character === '"') inString = false;
            continue;
        }

        if (character === '"') {
            inString = true;
            result += character;
            continue;
        }

        if (character === ",") {
            let next = index + 1;
            while (/\s/.test(text[next] || "")) next++;
            if (text[next] === "]" || text[next] === "}") continue;
        }
        result += character;
    }

    return result;
}

function repairInvalidStringEscapes(text) {
    return text
        // A model may escape the property value's closing quote. Only repair
        // when a comma and the next JSON property make that intent explicit.
        .replace(/\\"(?=\s*,\s*"[^"\r\n]+"\s*:)/g, '"')
        .replace(/\\"(?=\s*})/g, '"')
        // A bare backslash followed by a physical line break is not valid JSON.
        .replace(/\\\r?\n/g, "\\n");
}

function extractJsonObjects(text) {
    const objects = [];
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = 0; index < text.length; index++) {
        const character = text[index];
        if (inString) {
            if (escaped) escaped = false;
            else if (character === "\\") escaped = true;
            else if (character === '"') inString = false;
            continue;
        }
        if (character === '"') {
            inString = true;
            continue;
        }
        if (character === "{") {
            if (depth === 0) start = index;
            depth++;
        } else if (character === "}" && depth > 0) {
            depth--;
            if (depth === 0 && start >= 0) {
                objects.push(text.slice(start, index + 1));
                start = -1;
            }
        }
    }
    return objects;
}

function candidates(source) {
    const repaired = repairInvalidStringEscapes(source);
    const values = [source, repaired, ...extractJsonObjects(repaired)];
    const start = source.indexOf("{");
    const end = source.lastIndexOf("}");
    if (start >= 0 && end > start) values.push(source.slice(start, end + 1));
    return [...new Set(values)].flatMap(value => [value, removeTrailingCommas(value)]);
}

const JSON_ESCAPES = {
    '"': '"', "\\": "\\", "/": "/",
    b: "\b", f: "\f", n: "\n", r: "\r", t: "\t"
};

// Reads one JSON string literal starting at a '"' and decodes its escapes
// (rather than merely stripping the backslash), so recovered fragments keep
// real newlines and quotes instead of the literal escape letter.
function readJsonString(text, start) {
    if (text[start] !== '"') return null;
    let index = start + 1;
    let value = "";

    while (index < text.length) {
        const character = text[index];
        if (character === "\\") {
            const next = text[index + 1];
            if (next === "u") {
                const hex = text.slice(index + 2, index + 6);
                if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                    value += String.fromCharCode(parseInt(hex, 16));
                    index += 6;
                    continue;
                }
            }
            value += JSON_ESCAPES[next] !== undefined ? JSON_ESCAPES[next] : (next ?? "");
            index += 2;
            continue;
        }
        if (character === '"') {
            return { value, end: index + 1 };
        }
        value += character;
        index++;
    }
    return null;
}

const SCHEMA_KEYS_AFTER_MES_EXAMPLE = new Set([
    "alternate_greetings", "group_only_greetings", "tags", "creator_notes",
    "system_prompt", "post_history_instructions", "talkativeness",
    "depth_prompt", "character_book"
]);

// A local model sometimes breaks {{user}}: / {{char}}: speaker lines out of
// the mes_example string into separate top-level keys, e.g. "user:": "..."
// or "Kim:": (unquoted text), which corrupts the JSON. Detect that specific
// shape immediately after "mes_example" and fold the stray keys back into
// the mes_example string as speaker-label lines, then let the caller retry
// JSON.parse on the result.
function repairMisplacedSpeakerKeys(text) {
    const keyMatch = /"mes_example"\s*:\s*/.exec(text);
    if (!keyMatch) return null;

    const valueStart = keyMatch.index + keyMatch[0].length;
    const first = readJsonString(text, valueStart);
    if (!first) return null;

    let cursor = first.end;
    let combined = first.value;
    let mergedAny = false;

    for (;;) {
        let index = cursor;
        while (/\s/.test(text[index] || "")) index++;
        if (text[index] !== ",") break;
        index++;
        while (/\s/.test(text[index] || "")) index++;

        const key = readJsonString(text, index);
        if (!key) break;
        if (SCHEMA_KEYS_AFTER_MES_EXAMPLE.has(key.value)) break;
        if (!/^[\w{}]{1,40}:$/.test(key.value)) break;

        let afterKey = key.end;
        while (/\s/.test(text[afterKey] || "")) afterKey++;
        if (text[afterKey] !== ":") break;
        afterKey++;
        while (/\s/.test(text[afterKey] || "")) afterKey++;

        let valueText;
        let valueEnd;

        if (text[afterKey] === '"') {
            const value = readJsonString(text, afterKey);
            if (!value) break;
            valueText = value.value;
            valueEnd = value.end;
        } else {
            let end = afterKey;
            let depth = 0;
            let inQuote = false;
            let escaped = false;
            while (end < text.length) {
                const character = text[end];
                if (inQuote) {
                    if (escaped) escaped = false;
                    else if (character === "\\") escaped = true;
                    else if (character === '"') inQuote = false;
                    end++;
                    continue;
                }
                if (character === '"') {
                    inQuote = true;
                    end++;
                    continue;
                }
                if (character === "{" || character === "[") depth++;
                else if (character === "}" || character === "]") {
                    if (depth === 0) break;
                    depth--;
                } else if (character === "," && depth === 0) {
                    let peek = end + 1;
                    while (/\s/.test(text[peek] || "")) peek++;
                    if (text[peek] === '"') break;
                }
                end++;
            }
            if (end >= text.length) break;
            valueText = text.slice(afterKey, end).trim();
            valueEnd = end;
        }

        const label = key.value.slice(0, -1);
        combined += `\n${label}: ${valueText}`;
        cursor = valueEnd;
        mergedAny = true;
    }

    if (!mergedAny) return null;

    const escapedValue = combined
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n");

    return text.slice(0, valueStart) + `"${escapedValue}"` + text.slice(cursor);
}

export function parseJsonResponse(text) {
    const source = clean(text);

    let parseError;
    for (const candidate of candidates(source)) {
        try {
            return JSON.parse(candidate);
        } catch (error) {
            parseError ||= error;
        }
    }

    const repaired = repairMisplacedSpeakerKeys(source);
    if (repaired) {
        for (const candidate of candidates(repaired)) {
            try {
                const result = JSON.parse(candidate);
                console.warn(
                    "[CCM] Merged misplaced speaker-label keys back into mes_example"
                );
                debugLog("creator", "response.repaired", {
                    operation: "parse",
                    status: "repaired",
                    errorType: parseError?.name || "Error"
                });
                return result;
            } catch (error) {
                parseError ||= error;
            }
        }
    }

    const error = new Error(
        `Character creator returned invalid JSON: ${parseError?.message || "Unknown parsing error"}`
    );
    // Preserve the model response for the creator's user-facing debug report.
    // Provider credentials and request settings are never attached here.
    error.aiOutput = String(text || "");
    throw error;
}

export function stringValue(value) {
    return typeof value === "string"
        ? value.trim()
        : "";
}

export function stringArray(value) {
    if (Array.isArray(value)) return value.map(stringValue).filter(Boolean);
    const single = stringValue(value);
    return single ? [single] : [];
}

const NEGATION_BEFORE_MATCH =
    /\b(?:not|never|no|without|lacks?|lacking|free\s+of|no\s+longer|isn't|aren't|wasn't|weren't|doesn't|don't|didn't|cannot|can't|anything\s+but|far\s+from)\b[^,.!?;:\n]{0,50}$/i;

function clauseBefore(text, index) {
    const prefix = text.slice(0, index);
    const punctuation = Math.max(
        prefix.lastIndexOf("."), prefix.lastIndexOf(","),
        prefix.lastIndexOf("!"), prefix.lastIndexOf("?"),
        prefix.lastIndexOf(";"), prefix.lastIndexOf(":"),
        prefix.lastIndexOf("\n")
    );
    const afterPunctuation = prefix.slice(punctuation + 1);
    const contrast = /\b(?:but|however|yet)\b/gi;
    let match;
    let contrastEnd = 0;
    while ((match = contrast.exec(afterPunctuation))) contrastEnd = contrast.lastIndex;
    return afterPunctuation.slice(contrastEnd);
}

function matchIsNegated(text, match) {
    const value = match[0];
    if (/\b(?:not|never|without|cannot|can't)\b/i.test(value)) return true;
    if (/^-(?:free|less|resistant)\b/i.test(text.slice(match.index + value.length))) return true;
    const before = clauseBefore(text, match.index)
        .replace(/\bnot\s+only\b/gi, "");
    return NEGATION_BEFORE_MATCH.test(before);
}

// These checks classify prose generated by a model. A raw word match is not
// enough: "not hostile", "without shame", and "confidence is not high" say
// the opposite of the matched term. Return only matches that are asserted in
// the current clause, while allowing a later contrast ("not calm, but angry")
// to classify the text as angry.
export function firstAffirmedMatch(value, pattern) {
    const text = String(value || "");
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    let match;
    while ((match = matcher.exec(text))) {
        if (!matchIsNegated(text, match)) return match;
        if (!match[0].length) matcher.lastIndex++;
    }
    return null;
}
