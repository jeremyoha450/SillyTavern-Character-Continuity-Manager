// scripts/database.js

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

            footwear: "Barefoot"
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

			settings: {

				autoState: true,
				autoStateFrequency: 5,
				autoStateMessageCount: 10,
				lastStateHash: "",

				autoKnowledge: false,
				autoKnowledgeFrequency: 20,
				autoKnowledgeMessageCount: 30

			},

image: "",
avatar: "",
imageHistory: [],

facts: {
    characterName: {
        value: "",
        confidence: 0
    },

    age: {
        value: "",
        confidence: 0
    },

    eyeColor: {
        value: "",
        confidence: 0
    },

    hairColor: {
        value: "",
        confidence: 0
    },

    hairStyle: {
        value: "",
        confidence: 0
    },

    hairLength: {
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
        value: "Human",
        confidence: 0
    },

    skin: {
        value: "",
        confidence: 0
    },

    breastSize: {
        value: "",
        confidence: 0
    },
	
    buttSize: {
        value: "",
        confidence: 0
    },
	
    relationship: {
        value: "",
        confidence: 0
    },
	
    upper: {
        value: "",
        confidence: 0
    },
	
    outerwear: {
        value: "",
        confidence: 0
    },
	
    lower: {
        value: "",
        confidence: 0
    },
	
    footwear: {
        value: "",
        confidence: 0
    },
	
    underwearTop: {
        value: "",
        confidence: 0
    },
	
    underwearBottom: {
        value: "",
        confidence: 0
    },
	
    location: {
        value: "",
        confidence: 0
    },
	
    position: {
        value: "",
        confidence: 0
    },
	
    area: {
        value: "",
        confidence: 0
    },
	
    positionDetail: {
        value: "",
        confidence: 0
    },

    leftHand: {
        value: "Left hand by side",
        confidence: 0
    },

    rightHand: {
        value: "Right hand by side",
        confidence: 0
    },

    headPosition: {
        value: "",
        confidence: 0
    },

    eyeDirection: {
        value: "",
        confidence: 0
    },

    expression: {
        value: "",
        confidence: 0
    },
	
    mood: {
        value: "",
        confidence: 0
    },
	
    moodIntensity: {
        value: "",
        confidence: 0
    },
	
    accessories: {
        value: "",
        confidence: 0
    },
	
    penis: {
        value: "",
        confidence: 0
    },
	
    penisState: {
        value: "",
        confidence: 0
    },

    penisCondition: {
        value: "",
        confidence: 0
    },
	
    pussy: {
        value: "",
        confidence: 0
    },
	
    pussyState: {
        value: "",
        confidence: 0
    },

    pussyCondition: {
        value: "",
        confidence: 0
    },
	
    condition: {
        value: "",
        confidence: 0
    },
	
    injuries: {
        value: "",
        confidence: 0
    },
	
    notes: {
        value: "",
        confidence: 0
    }
},
state: {
    status: "",
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
    removeCharacterUsage(id);
    delete database.characters[id];

    document.dispatchEvent(
        new CustomEvent(
            "ccm-character-deleted",
            {
                detail: {
                    characterId: id
                }
            }
        )
    );

    saveDatabase();
}

function subtractUsageTotals(
    target,
    removed
) {
    if (!target || !removed) return;

    for (const key of [
        "requests",
        "reportedRequests",
        "inputTokens",
        "outputTokens",
        "totalTokens"
    ]) {
        target[key] = Math.max(
            0,
            (target[key] || 0) -
            (removed[key] || 0)
        );
    }
}

function removeCharacterUsage(id) {

    const usage = database.usage;
    const character =
        usage?.byCharacter?.[id];

    if (!character) return;

    subtractUsageTotals(
        usage.totals,
        character.totals
    );

    for (
        const [taskId, totals]
        of Object.entries(character.byTask || {})
    ) {
        subtractUsageTotals(
            usage.byTask?.[taskId],
            totals
        );
        if (
            usage.byTask?.[taskId] &&
            !usage.byTask[taskId].requests
        ) {
            delete usage.byTask[taskId];
        }
    }

    for (
        const [providerId, totals]
        of Object.entries(character.byProvider || {})
    ) {
        subtractUsageTotals(
            usage.byProvider?.[providerId],
            totals
        );
        if (
            usage.byProvider?.[providerId] &&
            !usage.byProvider[providerId].requests
        ) {
            delete usage.byProvider[providerId];
        }
    }

    for (
        const [model, totals]
        of Object.entries(character.byModel || {})
    ) {
        subtractUsageTotals(
            usage.byModel?.[model],
            totals
        );
        if (
            usage.byModel?.[model] &&
            !usage.byModel[model].requests
        ) {
            delete usage.byModel[model];
        }
    }

    usage.recent =
        (usage.recent || []).filter(
            entry => entry.characterId !== id
        );

    delete usage.byCharacter[id];
}
