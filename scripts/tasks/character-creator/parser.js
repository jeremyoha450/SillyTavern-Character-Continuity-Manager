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
