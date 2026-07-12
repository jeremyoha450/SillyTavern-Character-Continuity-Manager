// scripts/history/history.js

export function addHistory(
    character,
    type,
    changes,
    details = {}
) {

    if (!character.history) {
        character.history = [];
    }

    character.history.unshift({
        timestamp:
            Date.now(),

        type,

        changes,

        ...(details.message
            ? {
                message:
                    String(details.message)
            }
            : {})
    });

    character.history =
        character.history.slice(
            0,
            100
        );

    return character.history;

}
