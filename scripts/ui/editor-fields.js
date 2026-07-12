export const EDITOR_FACT_FIELDS = [
    ["characterName", "character-name"], ["gender", "gender"],
    ["age", "age"], ["species", "species"], ["height", "height"],
    ["bodyType", "body-type", "bodyType"], ["hairColor", "hair-color"],
    ["hairLength", "hair-length"], ["hairStyle", "hair-style"],
    ["eyeColor", "eye-color"], ["skin", "skin"],
    ["breastSize", "breast-size"], ["buttSize", "butt-size"],
    ["relationship", "relationship"], ["usualUpper", "usual-upper"],
    ["usualLower", "usual-lower"], ["usualFootwear", "usual-footwear"],
    ["upper", "upper"],
    ["outerwear", "outerwear"], ["lower", "lower"],
    ["footwear", "footwear"], ["underwearTop", "underwear-top"],
    ["underwearBottom", "underwear-bottom"], ["covering", "covering"],
    ["location", "location"],
    ["area", "area"], ["position", "position"],
    ["positionDetail", "position-detail"], ["legs", "legs"],
    ["leftHand", "left-hand"],
    ["rightHand", "right-hand"], ["headPosition", "head-position"],
    ["eyeDirection", "eye-direction"], ["expression", "expression"],
    ["mood", "mood"], ["moodIntensity", "mood-intensity"],
    ["accessories", "accessories"], ["penis", "penis"],
    ["penisState", "penis-state"], ["penisCondition", "penis-condition"],
    ["pussy", "pussy"], ["pussyState", "pussy-state"],
    ["pussyCondition", "pussy-condition"], ["condition", "condition"],
    ["injuries", "injuries"], ["notes", "notes"]
];

export function getEditorCharacterUpdates(char, root = document) {
    const updates = {
        name: root.getElementById("ccm-name").value,
        facts: { ...(char.facts || {}) },
        locks: { ...(char.locks || {}) }
    };

    for (const [key, id, lockId = id] of EDITOR_FACT_FIELDS) {
        const input = root.getElementById(`ccm-${id}`);
        const lock = root.getElementById(`ccm-lock-${lockId}`);
        updates.facts[key] = {
            value: input.value,
            confidence: char.facts?.[key]?.confidence || 0
        };
        if (lock) updates.locks[key] = lock.checked;
    }

    updates.locks.characterName = Boolean(char.locks?.characterName)
        || Boolean(updates.facts.characterName.value.trim());
    updates.inventory = root.getElementById("ccm-inventory").value
        .split(",").map(value => value.trim()).filter(Boolean);
    return updates;
}

export function getEditorCharacterDetails(char, root = document) {
    return {
        ...JSON.parse(JSON.stringify(char)),
        ...getEditorCharacterUpdates(char, root)
    };
}

async function writeClipboardText(text, root = document) {
    if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(text);
        return;
    }
    const textarea = root.createElement("textarea");
    textarea.value = text;
    root.body.appendChild(textarea);
    textarea.select();
    root.execCommand("copy");
    textarea.remove();
}

export async function copyEditorCharacterDetails(char, root = document) {
    const json = JSON.stringify(getEditorCharacterDetails(char, root), null, 2);
    await writeClipboardText(json, root);
    return json;
}
