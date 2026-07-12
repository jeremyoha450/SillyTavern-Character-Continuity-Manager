import test from "node:test";
import assert from "node:assert/strict";

import { renderToastContent } from "../scripts/ui/status.js";
import { loadUIState } from "../scripts/storage.js";
import {
    CHARACTER_CARD_LIMITS,
    normalizeImportedCard,
    parsePngCharacterCard,
    readCharacterCardFile
} from "../scripts/character-card-import.js";
import {
    automationScopeKey,
    claimAutomationScope,
    releaseAutomationScope
} from "../scripts/automation-scope.js";
import { fetchWithTimeout } from "../scripts/drivers/request.js";

function fakeDocument() {
    return {
        createElement(tagName) {
            return {
                tagName,
                attributes: {},
                textContent: "",
                setAttribute(name, value) { this.attributes[name] = value; }
            };
        }
    };
}

test("toast renders hostile markup literally without creating injected elements", () => {
    const hostile = '<img src=x onerror="globalThis.__ccmInjected=true">';
    const toast = {
        ownerDocument: fakeDocument(),
        replaceChildren(...children) { this.children = children; }
    };
    delete globalThis.__ccmInjected;
    renderToastContent(toast, "🧠", hostile);
    assert.equal(toast.children.length, 2);
    assert.equal(toast.children[1].tagName, "span");
    assert.equal(toast.children[1].textContent, ` ${hostile}`);
    assert.equal(globalThis.__ccmInjected, undefined);
    assert.equal(toast.children.some(child => child.tagName === "img"), false);
});

test("blocked localStorage returns the normal open section default", () => {
    const previous = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: { getItem: () => { throw new Error("blocked"); } }
    });
    delete globalThis.SillyTavern;
    assert.equal(loadUIState("char", "history"), true);
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previous });
});

test("card import rejects oversized files before reading", async () => {
    let read = false;
    await assert.rejects(readCharacterCardFile({
        name: "large.json",
        size: CHARACTER_CARD_LIMITS.fileBytes + 1,
        text: async () => { read = true; return "{}"; }
    }), /5 MB/);
    assert.equal(read, false);
});

test("PNG import rejects invalid signatures and impossible chunk lengths", () => {
    assert.throws(() => parsePngCharacterCard(new ArrayBuffer(16)), /valid PNG/);
    const bytes = new Uint8Array(24);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    new DataView(bytes.buffer).setUint32(8, 0xffffffff);
    bytes.set(new TextEncoder().encode("tEXt"), 12);
    assert.throws(() => parsePngCharacterCard(bytes.buffer), /chunk length/);
});

test("card normalization accepts V2 and rejects unreasonable collections", () => {
    assert.equal(normalizeImportedCard({ name: "V2 Card", description: "Ordinary" }).name, "V2 Card");
    assert.throws(
        () => normalizeImportedCard({ tags: Array(CHARACTER_CARD_LIMITS.tags + 1).fill("tag") }),
        /tags.*limit/i
    );
});

test("automation locks and keys are isolated by solo and group scope", () => {
    const inFlight = new Set();
    assert.notEqual(automationScopeKey("c1"), automationScopeKey("c1", "g1"));
    assert.notEqual(automationScopeKey("c1", "g1"), automationScopeKey("c1", "g2"));
    assert.equal(claimAutomationScope(inFlight, "c1"), true);
    assert.equal(claimAutomationScope(inFlight, "c1"), false);
    assert.equal(claimAutomationScope(inFlight, "c1", "g1"), true);
    assert.equal(claimAutomationScope(inFlight, "c1", "g2"), true);
    releaseAutomationScope(inFlight, "c1");
    assert.equal(claimAutomationScope(inFlight, "c1"), true);
});

test("provider timeout aborts delayed fetch and reports timeout", async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
    await assert.rejects(fetchWithTimeout("https://example.invalid", {}, 5),
        error => error.category === "timeout" && error.retryable === true);
    globalThis.fetch = previous;
});

test("external cancellation is distinct from timeout", async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
    const controller = new AbortController();
    const promise = fetchWithTimeout("https://example.invalid", { signal: controller.signal }, 1000);
    controller.abort();
    await assert.rejects(promise, error => error.category === "cancelled" && error.retryable === false);
    globalThis.fetch = previous;
});
