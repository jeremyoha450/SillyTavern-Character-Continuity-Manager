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

export function findCharacterByAvatar(avatar) {
    if (!avatar) return undefined;

    return Object.values(database.characters)
        .find(character => character.avatar === avatar);
}

export function findCharacterForCard(card) {
    const byAvatar =
        findCharacterByAvatar(card?.avatar);

    if (byAvatar) return byAvatar;

    const byName =
        findCharacterByName(card?.name);

    return !byName?.avatar || byName.avatar === card?.avatar
        ? byName
        : undefined;
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

        inventory: [],

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

    usualUpper: {
        value: "",
        confidence: 0
    },

    usualLower: {
        value: "",
        confidence: 0
    },

    usualFootwear: {
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

    covering: {
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

    legs: {
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

export function getGroupContext(groupId) {
    return database.groups?.[groupId];
}

export function updateGroupContext(
    groupId,
    updates
) {
    const group =
        getGroupContext(groupId);

    if (!group) return false;

    database.groups[groupId] = {
        ...group,
        ...structuredClone(updates),
        id: group.id,
        updatedAt: Date.now()
    };

    saveDatabase();
    return true;
}

function createGroupMember(character) {
    return {
        characterId: character.id,
        facts: structuredClone(character.facts || {}),
        locks: structuredClone(character.locks || {}),
        overrides: structuredClone(character.overrides || {}),
        inventory: structuredClone(character.inventory || []),
        knowledge: structuredClone(character.knowledge || []),
        history: [],
        settings: structuredClone(character.settings || {}),
        imageHistory: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

export function syncGroupContext(
    group,
    characters
) {
    if (!group?.id) return null;

    database.groups = database.groups || {};

    const existing =
        database.groups[group.id] || {
            id: String(group.id),
            name: group.name || "Group",
            members: {},
            memberOrder: [],
            scene: {
                location: "",
                area: "",
                notes: ""
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

    existing.name = group.name || existing.name;
    existing.memberOrder = characters.map(
        character => character.id
    );

    for (const character of characters) {
        existing.members[character.id] =
            existing.members[character.id] ||
            createGroupMember(character);
    }

    existing.updatedAt = Date.now();
    database.groups[group.id] = existing;
    saveDatabase();

    return existing;
}

export function getScopedCharacter(
    characterId,
    groupId = ""
) {
    const character =
        getCharacter(characterId);

    if (!character || !groupId) {
        return character;
    }

    const member =
        getGroupContext(groupId)
            ?.members?.[characterId];

    if (!member) return null;

    return {
        ...character,
        ...structuredClone(member),
        id: character.id,
        name: character.name,
        avatar: character.avatar,
        image: character.image,
        status: character.status,
        groupId
    };
}

export function updateScopedCharacter(
    characterId,
    updates,
    groupId = ""
) {
    if (!groupId) {
        return updateCharacter(
            characterId,
            updates
        );
    }

    const group =
        getGroupContext(groupId);

    const member =
        group?.members?.[characterId];

    if (!member) return false;

    group.members[characterId] = {
        ...member,
        ...structuredClone(updates),
        characterId,
        updatedAt: Date.now()
    };

    group.updatedAt = Date.now();
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

    for (const group of Object.values(database.groups || {})) {
        delete group.members?.[id];
        group.memberOrder =
            (group.memberOrder || [])
                .filter(characterId => characterId !== id);
    }

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
