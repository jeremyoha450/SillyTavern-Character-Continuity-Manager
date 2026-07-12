import test from "node:test";
import assert from "node:assert/strict";

const storageValues = new Map();
globalThis.localStorage = {
    getItem: key => storageValues.get(key) ?? null,
    setItem: (key, value) => storageValues.set(key, value),
    removeItem: key => storageValues.delete(key)
};
globalThis.SillyTavern = {
    getContext: () => ({
        extensionSettings: {}
    })
};

const {
    addHistory
} = await import("../scripts/history/history.js");

const {
    renderHistory
} = await import("../scripts/ui/history.js");

test("history supports readable no-change entries", () => {
    const character = {
        id: "char-history",
        history: []
    };

    const history = addHistory(
        character,
        "state",
        [],
        {
            message:
                "Manual state update checked the recent chat. No state changes were found."
        }
    );

    assert.equal(history.length, 1);
    assert.equal(history[0].changes.length, 0);
    assert.match(history[0].message, /No state changes/);

    const html =
        renderHistory(character);

    assert.match(html, /0 change\(s\)/);
    assert.match(html, /No state changes were found/);
});
