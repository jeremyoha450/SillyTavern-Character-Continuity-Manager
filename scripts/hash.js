// scripts/hash.js

// cyrb53: crypto.subtle only exists on secure contexts
// (https / localhost), so plain-http LAN access needs a
// plain-JS fallback. Not cryptographic - only used for
// change detection.
function simpleHash(text) {

    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;

    for (let i = 0; i < text.length; i++) {

        const ch =
            text.charCodeAt(i);

        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 =
        Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
        Math.imul(h2 ^ (h2 >>> 13), 3266489909);

    h2 =
        Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
        Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return (
        (h2 >>> 0).toString(16).padStart(8, "0") +
        (h1 >>> 0).toString(16).padStart(8, "0")
    );
}
export async function generateHash(
    text
) {
    if (!globalThis.crypto?.subtle) {
        return simpleHash(String(text));
    }

    const encoder =
        new TextEncoder();

    const data =
        encoder.encode(text);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return Array.from(
        new Uint8Array(hashBuffer)
    )
        .map(x =>
            x.toString(16)
             .padStart(2, "0")
        )
        .join("");
}
