export const CHARACTER_CARD_LIMITS = Object.freeze({
    fileBytes: 5 * 1024 * 1024,
    decodedMetadataBytes: 2 * 1024 * 1024,
    jsonDepth: 24,
    tags: 200,
    greetings: 100,
    lorebookEntries: 500
});

const MAX_ENCODED_METADATA_BYTES = Math.ceil(
    CHARACTER_CARD_LIMITS.decodedMetadataBytes * 4 / 3
) + 16;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function assertJsonDepth(value, depth = 0) {
    if (depth > CHARACTER_CARD_LIMITS.jsonDepth) {
        throw new Error(`Character-card JSON exceeds the maximum nesting depth of ${CHARACTER_CARD_LIMITS.jsonDepth}.`);
    }
    if (!value || typeof value !== "object") return;
    for (const item of Array.isArray(value) ? value : Object.values(value)) {
        assertJsonDepth(item, depth + 1);
    }
}

function parseLimitedJson(text) {
    if (new TextEncoder().encode(text).length > CHARACTER_CARD_LIMITS.decodedMetadataBytes) {
        throw new Error("Character-card JSON is too large.");
    }
    const value = JSON.parse(text);
    assertJsonDepth(value);
    return value;
}

function assertCount(label, value, maximum) {
    if (Array.isArray(value) && value.length > maximum) {
        throw new Error(`${label} exceeds the supported limit of ${maximum}.`);
    }
}

function assertCardCollectionLimits(source) {
    const data = source?.data || source || {};
    assertCount("Character tags", data.tags, CHARACTER_CARD_LIMITS.tags);
    assertCount("Alternate greetings", data.alternate_greetings, CHARACTER_CARD_LIMITS.greetings);
    assertCount("Group-only greetings", data.group_only_greetings, CHARACTER_CARD_LIMITS.greetings);
    assertCount("Lorebook entries", data.character_book?.entries, CHARACTER_CARD_LIMITS.lorebookEntries);
}

function decodeBase64Json(value) {
    if (value.length > MAX_ENCODED_METADATA_BYTES) {
        throw new Error("Character-card metadata is too large.");
    }
    const binary = atob(value.trim());
    if (binary.length > CHARACTER_CARD_LIMITS.decodedMetadataBytes) {
        throw new Error("Decoded character-card metadata is too large.");
    }
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return parseLimitedJson(new TextDecoder().decode(bytes));
}

export function parsePngCharacterCard(buffer) {
    if (!(buffer instanceof ArrayBuffer)) {
        throw new Error("Character-card PNG data is invalid.");
    }
    if (buffer.byteLength > CHARACTER_CARD_LIMITS.fileBytes) {
        throw new Error("Character-card files may not exceed 5 MB.");
    }
    const header = new Uint8Array(buffer, 0, Math.min(8, buffer.byteLength));
    if (header.length !== 8 || PNG_SIGNATURE.some((byte, index) => header[index] !== byte)) {
        throw new Error("The selected file is not a valid PNG character card.");
    }
    const view = new DataView(buffer);
    const decoder = new TextDecoder("latin1");
    const chunks = {};
    let offset = 8;

    while (offset + 12 <= view.byteLength) {
        const length = view.getUint32(offset);
        const type = decoder.decode(new Uint8Array(buffer, offset + 4, 4));
        const dataStart = offset + 8;
        if (length > CHARACTER_CARD_LIMITS.fileBytes || length > view.byteLength - dataStart - 4) {
            throw new Error("The PNG contains an impossible or truncated chunk length.");
        }
        const dataEnd = dataStart + length;

        if (type === "tEXt") {
            const data = new Uint8Array(buffer, dataStart, length);
            const separator = data.indexOf(0);
            if (separator > 0) {
                const keyword = decoder.decode(data.slice(0, separator));
                const value = decoder.decode(data.slice(separator + 1));
                if (keyword === "ccv3" || keyword === "chara") {
                    chunks[keyword] = value;
                }
            }
        }
        offset = dataEnd + 4;
    }

    const encoded = chunks.ccv3 || chunks.chara;
    if (!encoded) {
        throw new Error("This PNG does not contain a supported character card.");
    }
    return decodeBase64Json(encoded);
}

export function normalizeImportedCard(source) {
    assertJsonDepth(source);
    assertCardCollectionLimits(source);
    const data = source?.data || source || {};
    const entries = Array.isArray(data.character_book?.entries)
        ? data.character_book.entries
        : [];

    return {
        name: String(data.name || source?.name || "Imported Character"),
        nickname: String(data.nickname || ""),
        description: String(data.description || ""),
        personality: String(data.personality || ""),
        scenario: String(data.scenario || ""),
        first_mes: String(data.first_mes || ""),
        mes_example: String(data.mes_example || ""),
        alternate_greetings:
            Array.isArray(data.alternate_greetings)
                ? data.alternate_greetings.map(String)
                : [],
        group_only_greetings:
            Array.isArray(data.group_only_greetings)
                ? data.group_only_greetings.map(String)
                : [],
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        creator_notes: String(data.creator_notes || source?.creatorcomment || ""),
        system_prompt: String(data.system_prompt || ""),
        post_history_instructions:
            String(data.post_history_instructions || ""),
        talkativeness:
            Number(data.extensions?.talkativeness ?? source?.talkativeness ?? 0.5),
        depth_prompt:
            String(data.extensions?.depth_prompt?.prompt || ""),
        character_book: {
            name: String(data.character_book?.name || ""),
            entries: entries.map(entry => ({
                keys: Array.isArray(entry.keys) ? entry.keys.map(String) : [],
                comment: String(entry.comment || entry.name || ""),
                content: String(entry.content || "")
            })).filter(entry => entry.content)
        }
    };
}

export async function readCharacterCardFile(file) {
    if (Number(file?.size) > CHARACTER_CARD_LIMITS.fileBytes) {
        throw new Error("Character-card files may not exceed 5 MB.");
    }
    if (file.name.toLowerCase().endsWith(".json")) {
        return normalizeImportedCard(
            parseLimitedJson(await file.text())
        );
    }
    if (file.name.toLowerCase().endsWith(".png")) {
        return normalizeImportedCard(
            parsePngCharacterCard(await file.arrayBuffer())
        );
    }
    throw new Error("Choose a character-card JSON or PNG file.");
}
