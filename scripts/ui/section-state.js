// scripts/ui/section-state.js

import {
    loadUIState,
    saveUIState
} from "../storage.js";

export function loadSectionState(
    characterId,
    key
) {

    return loadUIState(
        characterId,
        key
    );

}

export function saveSectionState(
    characterId,
    key,
    open
) {

    saveUIState(
        characterId,
        key,
        open
    );

}

