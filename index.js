import {
    createCharacter,
    addCharacter,
    getDatabase,
} from "./scripts/database.js";

jQuery(async () => {
    console.log("Character Continuity Manager Loaded");

    const db = getDatabase();

    console.log(db);

    if (Object.keys(db.characters).length === 0) {
        const sarah = createCharacter("Sarah");

        addCharacter(sarah);

        console.log("Created Sarah");
    }
});
