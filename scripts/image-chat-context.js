export function findSillyTavernCharacterIndex(
    context,
    character
) {
    const characters =
        Array.isArray(context?.characters)
            ? context.characters
            : [];

    if (!character) return -1;

    if (character.avatar) {
        const avatarIndex =
            characters.findIndex(
                candidate =>
                    candidate?.avatar === character.avatar
            );

        if (avatarIndex >= 0) {
            return avatarIndex;
        }
    }

    if (!character.name) return -1;

    return characters.findIndex(
        candidate =>
            candidate?.name === character.name
    );
}

export async function openSillyTavernCharacterChat(
    context,
    character
) {
    const characterIndex =
        findSillyTavernCharacterIndex(
            context,
            character
        );

    if (characterIndex < 0) {
        throw new Error(
            "The matching SillyTavern character card could not be found."
        );
    }

    if (
        typeof context?.selectCharacterById !==
        "function"
    ) {
        throw new Error(
            "This SillyTavern version cannot open a character chat from CCM."
        );
    }

    await context.selectCharacterById(
        characterIndex,
        { switchMenu: false }
    );

    return characterIndex;
}
