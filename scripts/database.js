// database.js

import {
    loadDatabase,
    saveDatabase as saveStorage
} from "./storage.js";


const database =
    loadDatabase() || {
        version: 1,
        characters: {}
    };

export function findCharacterByHash(
    hash
) {
    return Object.values(
        database.characters
    ).find(
        x =>
            x.hashes?.full === hash ||
            x.hashes?.description === hash
    );
}

export function findCharacterByName(
    name
) {
    return Object.values(
        database.characters
    ).find(
        x =>
            x.name?.toLowerCase() ===
            name?.toLowerCase()
    );
}

function generateId() {
    return (
        "char_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}

export function getDatabase() {
    return database;
}

export function saveDatabase() {
    saveStorage(database);
}


export function createCharacter(
    name = "New Character"
) {
    return {
        id: generateId(),

        name,

        status: "active",

        hashes: {
            full: "",
            description: ""
        },

        appearance: {
            gender: "",
            age: "",
            species: "",
            height: "",

            hair: {
                color: "",
                style: "",
                length: ""
            },

            eyes: {
                color: ""
            },

            skin: "",
            bodyType: "",

            breastSize: "",
            buttSize: ""
        },

        anatomy: {
            penis: "",
            penisState: "",

            pussy: "",
            pussyState: ""
        },

        clothing: {
            upper: "",
            lower: "",
            outerwear: "",

            underwear: {
                top: "",
                bottom: ""
            },

            footwear: ""
        },

        location: {
            place: "",
            area: ""
        },

        position: {
            posture: "",
            detail: ""
        },

        mood: {
            primary: "",
            intensity: ""
        },

        relationships: {
            user: {
                status: "",
                notes: ""
            }
        },

        accessories: [],

        inventory: [],

        statusInfo: {
            condition: "",
            injuries: "",
            notes: ""
        },

        locks: {},

facts: {
    age: {
        value: "",
        confidence: 0
    },

    eyeColor: {
        value: "",
        confidence: 0
    },

    hair: {
        value: "",
        confidence: 0
    },

    height: {
        value: "",
        confidence: 0
    },

    bodyType: {
        value: "",
        confidence: 0
    },

    personality: {
        value: "",
        confidence: 0
    },

    gender: {
        value: "",
        confidence: 0
    },

    species: {
        value: "",
        confidence: 0
    },

    notes: ""
},
state: {
    location: "",
    area: "",

    outfit: "",

    mood: "",

    status: "",

    notes: ""
},
anatomy: {
    penis: "",
    penisState: "",

    pussy: "",
    pussyState: ""
},


        createdAt: Date.now(),

        updatedAt: Date.now()
    };
}

export function addCharacter(
    character
) {
    database.characters[
        character.id
    ] = character;

    saveDatabase();

    return character;
}

export function getAllCharacters() {
    return Object.values(
        database.characters
    );
}

export function getCharacter(id) {
    return database.characters[id];
}

export function updateCharacter(
    id,
    updates
) {
    if (!database.characters[id]) {
        return false;
    }

    database.characters[id] = {
        ...database.characters[id],
        ...updates,

        updatedAt: Date.now()
    };

    saveDatabase();

    return true;
}

export function archiveCharacter(id) {
    return updateCharacter(id, {
        status: "archived"
    });
}

export function restoreCharacter(id) {
    return updateCharacter(id, {
        status: "active"
    });
}

export function deleteCharacter(id) {
    delete database.characters[id];

    saveDatabase();
}