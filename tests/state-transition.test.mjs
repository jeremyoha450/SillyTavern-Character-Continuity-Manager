import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeData } from "../scripts/merge/merge-data.js";
import { reconcilePostureTransition } from "../scripts/state/reconcile-transition.js";

const field = (value, confidence = 100) => ({ value, confidence });

test("standing clears a stale seated pose and furniture surface", () => {
    const previous = {
        position: field("Sitting"),
        positionDetail: field("Knees drawn up"),
        area: field("On the sofa", 75)
    };
    const incoming = {
        position: field("Standing"),
        positionDetail: field("", 0),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.position.value, "Standing");
    assert.equal(merged.data.positionDetail.value, "");
    assert.equal(merged.data.area.value, "");
    assert.deepEqual(
        merged.changes.map(change => change.field),
        ["position", "positionDetail", "area"]
    );
});

test("an explicitly stated standing surface is retained", () => {
    const previous = {
        position: field("Sitting"),
        positionDetail: field("Knees drawn up"),
        area: field("On the sofa", 75)
    };
    const incoming = {
        position: field("Standing"),
        positionDetail: field("Standing upright"),
        area: field("On the rug")
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.positionDetail.value, "Standing upright");
    assert.equal(merged.data.area.value, "On the rug");
});

test("locked dependent fields are never cleared", () => {
    const previous = {
        position: field("Sitting"),
        positionDetail: field("Knees drawn up"),
        area: field("On the sofa", 75)
    };
    const incoming = {
        position: field("Standing"),
        positionDetail: field("", 0),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(
        previous,
        incoming,
        { positionDetail: true, area: true }
    );
    const merged = mergeData(
        previous,
        reconciled,
        { positionDetail: true, area: true }
    );

    assert.equal(merged.data.positionDetail.value, "Knees drawn up");
    assert.equal(merged.data.area.value, "On the sofa");
});

test("a detail-only update incompatible with the stored standing position is dropped", () => {
    const previous = {
        position: field("Standing"),
        positionDetail: field("", 0),
        area: field("On the rug")
    };
    const incoming = {
        position: field("", 0),
        positionDetail: field("Knees drawn up"),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.position.value, "Standing");
    assert.equal(merged.data.positionDetail.value, "");
    assert.equal(merged.changed, false);
});

test("a compatible detail-only update is stored against the previous position", () => {
    const previous = {
        position: field("Sitting"),
        positionDetail: field("", 0),
        area: field("On the sofa", 75)
    };
    const incoming = {
        position: field("", 0),
        positionDetail: field("Knees drawn up"),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.positionDetail.value, "Knees drawn up");
});

test("an incoming contradictory posture pair keeps the position and drops the detail", () => {
    const previous = {
        position: field("Sitting"),
        positionDetail: field("Knees drawn up"),
        area: field("On the sofa", 75)
    };
    const incoming = {
        position: field("Standing"),
        positionDetail: field("Knees drawn up"),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.position.value, "Standing");
    assert.equal(merged.data.positionDetail.value, "");
});

test("an already-contradictory stored pair is healed by a blank update", () => {
    const previous = {
        position: field("Standing"),
        positionDetail: field("Knees drawn up"),
        area: field("On the rug")
    };
    const incoming = {
        position: field("", 0),
        positionDetail: field("", 0),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.positionDetail.value, "");
});

test("a repeated standing update clears an already-stale seated pose", () => {
    const previous = {
        position: field("Standing"),
        positionDetail: field("Knees drawn up"),
        area: field("On the rug")
    };
    const incoming = {
        position: field("Standing"),
        positionDetail: field("", 0),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.positionDetail.value, "");
    assert.equal(merged.data.area.value, "On the rug");
});

// --- Legs field lifecycle ---

test("a posture change clears a stale leg pose", () => {
    const previous = {
        position: field("Sitting"),
        positionDetail: field("Sitting on the couch"),
        legs: field("Legs crossed"),
        area: field("On the couch")
    };
    const incoming = {
        position: field("Standing"),
        positionDetail: field("", 0),
        legs: field("", 0),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.legs.value, "");
});

test("an unchanged posture keeps the stored leg pose", () => {
    const previous = {
        position: field("Sitting"),
        positionDetail: field(""),
        legs: field("Legs spread slightly"),
        area: field("On the bed")
    };
    const incoming = {
        position: field("", 0),
        positionDetail: field("", 0),
        legs: field("", 0),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.legs.value, "Legs spread slightly");
});

test("a standing-incompatible incoming leg pose is dropped", () => {
    const previous = {
        position: field("Standing"),
        positionDetail: field(""),
        legs: field(""),
        area: field("")
    };
    const incoming = {
        position: field("", 0),
        positionDetail: field("", 0),
        legs: field("Knees drawn up", 75),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(previous, incoming);
    const merged = mergeData(previous, reconciled);

    assert.equal(merged.data.legs.value, "");
});

test("a locked legs field survives a posture change", () => {
    const previous = {
        position: field("Sitting"),
        positionDetail: field(""),
        legs: field("Legs crossed"),
        area: field("")
    };
    const incoming = {
        position: field("Standing"),
        positionDetail: field("", 0),
        legs: field("", 0),
        area: field("", 0)
    };

    const reconciled = reconcilePostureTransition(
        previous,
        incoming,
        { legs: true }
    );
    const merged = mergeData(previous, reconciled, { legs: true });

    assert.equal(merged.data.legs.value, "Legs crossed");
});
