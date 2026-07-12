import {
    getCharacters,
    getRequestHeaders
} from "../../../../../script.js";

import {
    buildCreatePayload
} from "./character-card.js";

async function readResponse(response) {
    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            text || `SillyTavern returned HTTP ${response.status}.`
        );
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export async function createSillyTavernCharacter(
    card,
    creator = "",
    avatarFile = null
) {
    const payload = buildCreatePayload(card, creator);
    let headers = getRequestHeaders();
    let body = JSON.stringify(payload);

    if (avatarFile) {
        const form = new FormData();
        for (const [key, value] of Object.entries(payload)) {
            if (Array.isArray(value)) {
                value.forEach(item => form.append(key, item));
            } else {
                form.append(key, String(value ?? ""));
            }
        }
        form.append("avatar", avatarFile);
        headers = getRequestHeaders({ omitContentType: true });
        body = form;
    }

    const response = await fetch(
        "/api/characters/create",
        {
            method: "POST",
            headers,
            body
        }
    );

    const avatar = await readResponse(response);

    if (typeof avatar !== "string" || !avatar) {
        throw new Error("SillyTavern did not return the new character filename.");
    }

    return avatar;
}

export async function createSillyTavernGroup(
    name,
    members
) {
    const response = await fetch(
        "/api/groups/create",
        {
            method: "POST",
            headers: getRequestHeaders(),
            body: JSON.stringify({
                name: name || "New Character Set",
                members,
                disabled_members: [],
                activation_strategy: 0,
                generation_mode: 0,
                allow_self_responses: false,
                auto_mode_delay: 5
            })
        }
    );

    const group = await readResponse(response);
    const groups = SillyTavern.getContext()?.groups;

    if (
        Array.isArray(groups) &&
        group?.id &&
        !groups.some(item => String(item.id) === String(group.id))
    ) {
        groups.push(group);
    }

    return group;
}

export async function refreshSillyTavernCharacters() {
    await getCharacters();
}

export async function getSillyTavernCharacter(avatar) {
    const response = await fetch(
        "/api/characters/get",
        {
            method: "POST",
            headers: getRequestHeaders(),
            body: JSON.stringify({ avatar_url: avatar })
        }
    );
    return readResponse(response);
}
