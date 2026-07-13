import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const activeVersionFiles = [
    "README.md",
    "PROJECT_STATUS.md",
    "RELEASE_READINESS.md",
    "RELEASE_VERSION_RECOMMENDATION.md",
    "RELEASE_ARTIFACT_MANIFEST.md"
];

test("authoritative active-version files agree with the manifest", () => {
    assert.equal(manifest.version, "1.0.0-rc3");
    for (const file of activeVersionFiles) {
        const content = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
        assert.match(content, new RegExp(manifest.version.replaceAll(".", "\\.")), `${file} must name the manifest version`);
    }
});

test("release tooling includes the authoritative manifest", async () => {
    const { releaseFiles } = await import("../tools/release.mjs");
    assert.ok(releaseFiles().includes("manifest.json"));
});
