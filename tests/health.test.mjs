import test from "node:test";
import assert from "node:assert/strict";

const values = new Map();
globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
};
globalThis.document = {
    body: { classList: { contains: () => false } },
    querySelector: () => null
};
globalThis.SillyTavern = {
    version: "1.13.4",
    getContext: () => ({
        extensionSettings: {},
        saveSettingsDebounced: () => {},
        version: "1.13.4"
    })
};
globalThis.fetch = async url => {
    if (String(url) === "/version") {
        return {
            ok: true,
            json: async () => ({ version: "1.18.0", agent: "SillyTavern:1.18.0:release#51ad27fb8" })
        };
    }
    return {
        ok: true,
        json: async () => ({ version: "0.1.2" })
    };
};

const { getHealthSnapshot } = await import("../scripts/health.js");

test("health snapshot reports versions and safe availability without secrets", async () => {
    const health = await getHealthSnapshot();
    const serialized = JSON.stringify(health);

    assert.equal(health.ccmVersion, "0.1.2");
    assert.equal(health.databaseVersion, 5);
    assert.equal(health.aiSettingsVersion, 8);
    assert.equal(health.sillyTavernVersion, "1.13.4");
    assert.equal(health.storage, "SillyTavern extension settings");
    assert.equal(health.debugLogging, "Off");
    assert.doesNotMatch(serialized, /apiKey|authorization|secret/i);
});

test("health snapshot falls back to the SillyTavern version endpoint", async () => {
    const original = globalThis.SillyTavern;
    globalThis.SillyTavern = {
        getContext: () => ({ extensionSettings: {}, saveSettingsDebounced: () => {} })
    };

    try {
        const health = await getHealthSnapshot();
        assert.equal(health.sillyTavernVersion, "1.18.0");
    } finally {
        globalThis.SillyTavern = original;
    }
});
