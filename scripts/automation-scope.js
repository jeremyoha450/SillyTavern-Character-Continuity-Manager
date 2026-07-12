export function automationScopeKey(characterId, groupId = "") {
    return `${String(characterId)}::${groupId ? `group:${String(groupId)}` : "solo"}`;
}

export function claimAutomationScope(inFlight, characterId, groupId = "") {
    const key = automationScopeKey(characterId, groupId);
    if (inFlight.has(key)) return false;
    inFlight.add(key);
    return true;
}

export function releaseAutomationScope(inFlight, characterId, groupId = "") {
    inFlight.delete(automationScopeKey(characterId, groupId));
}
