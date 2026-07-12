function getActiveGroup(context) {
    if (!context?.groupId) return null;

    return (context.groups || []).find(
        group => String(group.id) === String(context.groupId)
    ) || null;
}

export function getContextCharacters(context) {
    const group = getActiveGroup(context);

    if (group) {
        const disabled = new Set(group.disabled_members || []);

        return (group.members || [])
            .filter(avatar => !disabled.has(avatar))
            .map(avatar =>
                (context.characters || []).find(
                    character =>
                        character?.avatar === avatar ||
                        character?.name === avatar
                )
            )
            .filter(Boolean);
    }

    const character = context?.characters?.[context.characterId];
    return character ? [character] : [];
}

export function isCharacterInCurrentContext(
    context,
    character
) {
    return getContextCharacters(context).some(candidate =>
        candidate.avatar && character.avatar
            ? candidate.avatar === character.avatar
            : candidate.name === character.name
    );
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function messageBelongsTo(message, character) {
    if (!message || message.is_user || message.is_system) {
        return false;
    }

    if (
        message.original_avatar &&
        message.original_avatar === character.avatar
    ) {
        return true;
    }

    return Boolean(
        message.name &&
        character.name &&
        message.name.toLowerCase() === character.name.toLowerCase()
    );
}

function messageMentions(message, character) {
    if (!message?.mes || !character?.name) return false;

    return new RegExp(
        `(?:^|\\W)${escapeRegExp(character.name)}(?=\\W|$)`,
        "i"
    ).test(message.mes);
}

export function getRelevantContextCharacters(
    context,
    messages
) {
    const characters = getContextCharacters(context);

    if (!getActiveGroup(context)) {
        return characters;
    }

    const recent = Array.isArray(messages) ? messages : [];

    return characters.filter(character =>
        recent.some(message =>
            messageBelongsTo(message, character) ||
            messageMentions(message, character)
        )
    );
}

export function getFirstCharacterMessage(
    messages,
    character
) {
    return (messages || []).find(message =>
        messageBelongsTo(message, character) &&
        typeof message.mes === "string" &&
        message.mes.trim()
    )?.mes || "";
}

export function formatChatMessages(messages) {
    return (messages || [])
        .filter(message =>
            !message?.is_system &&
            typeof message?.mes === "string" &&
            message.mes.trim()
        )
        .map(message => {
            const speaker = message.is_user
                ? "User"
                : message.name || "Assistant";

            return `${speaker}:\n${message.mes}`;
        })
        .join("\n\n");
}

export function targetCharacterConversation(
    character,
    conversation
) {
    return `TARGET CHARACTER: ${character.name}

Track and update only ${character.name}. Other named characters are context only; never copy their attributes into ${character.name}'s record.

${conversation}`;
}
