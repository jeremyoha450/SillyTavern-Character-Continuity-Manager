import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const activeVersionFiles = new Map([
    ["README.md", /^\*\*Current release:\*\* `1\.0\.0`$/m],
    ["PROJECT_STATUS.md", /^\*\*Manifest:\*\* `1\.0\.0`$/m],
    ["RELEASE_READINESS.md", /^\*\*Updated:\*\* .*— manifest `1\.0\.0`$/m],
    ["RELEASE_VERSION_RECOMMENDATION.md", /^Recommendation now: \*\*publish validated `1\.0\.0`/m],
    ["RELEASE_ARTIFACT_MANIFEST.md", /^\*\*Manifest version:\*\* `1\.0\.0`$/m]
]);

test("authoritative active-version files agree with the manifest", () => {
    assert.equal(manifest.version, "1.0.0");
    for (const [file, activeVersionPattern] of activeVersionFiles) {
        const content = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
        assert.match(content, activeVersionPattern, `${file} must report exactly the final manifest version in its active field`);
    }
});

test("release tooling includes the authoritative manifest", async () => {
    const { releaseFiles } = await import("../tools/release.mjs");
    assert.ok(releaseFiles().includes("manifest.json"));
});
