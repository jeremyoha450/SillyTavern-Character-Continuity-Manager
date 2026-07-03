// scripts/history/history.js

export function addHistory(
    character,
    type,
    changes
) {

    if (!character.history) {
        character.history = [];
    }

    character.history.unshift({
        timestamp:
            Date.now(),

        type,

        changes
    });

    character.history =
        character.history.slice(
            0,
            100
        );

    return character.history;

}