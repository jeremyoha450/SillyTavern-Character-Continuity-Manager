// continuity-manager.js

import {
    eventSource,
    event_types
} from "../../../../../script.js";

import {
    findCharacterByName,
    createCharacter,
    addCharacter,
	updateCharacter
} from "./database.js";

import {
    renderCharacterList
} from "./ui.js";

import {
    extractFacts
} from "./parser.js";

export function initializeContinuityManager() {

    console.log(
        "[CCM] Continuity Manager Ready"
    );

    eventSource.on(
        event_types.CHAT_LOADED,
        onChatLoaded
    );
}

async function onChatLoaded() {

    const ctx =
        SillyTavern.getContext();

    const character =
        ctx?.characters?.[
            ctx.characterId
        ];

    const characterName =
        character?.name;

    console.log(
        "[CCM] Character Name",
        characterName
    );

    if (!characterName) {
        return;
    }

    const existing =
        findCharacterByName(
            characterName
        );

if (existing) {

    console.log(
        "[CCM] Continuity Found",
        existing
    );

    const facts =
        await extractFacts(
            character.data?.description || ""
        );
    if (
		!existing.locks?.species
	) {
		existing.facts.species =
			facts.species;

	}

    if (
		!existing.locks?.gender
	) {
		existing.facts.gender =
			facts.gender;

	}

    if (
		!existing.locks?.age
	) {
		existing.facts.age =
			facts.age;

	}

    if (
		!existing.locks?.height
	) {
		existing.facts.height =
			facts.height;

	}
	

    if (
		!existing.locks?.bodyType
	) {
		existing.facts.bodyType =
			facts.bodyType;

	}


	updateCharacter(
		existing.id,
		{
			facts: existing.facts,
		}
	);

} else {

    console.log(
        "[CCM] Creating Character",
        characterName
    );

    const newCharacter =
    createCharacter(
        characterName
    );


	const facts =
		await extractFacts(
			character.data?.description || ""
		);

	newCharacter.facts = facts;

	addCharacter(
		newCharacter
	);

	newCharacter.facts = facts;
	console.log(
		"[CCM] Extracted Facts",
		facts
	);

    renderCharacterList();
}
}