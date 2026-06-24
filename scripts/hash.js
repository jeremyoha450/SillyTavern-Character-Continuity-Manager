// hash.js

export async function generateHash(
    text
) {
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

export async function generateCharacterHashes(
    card
) {
    return {
        full: await generateHash(
            JSON.stringify(card)
        ),

        description: await generateHash(
            card.description || ""
        )
    };
}