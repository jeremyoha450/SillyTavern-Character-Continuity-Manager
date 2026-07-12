import test from "node:test";
import assert from "node:assert/strict";
import { releaseFiles } from "../tools/release.mjs";

test("release artifact includes runtime roots and excludes development/private artifacts", () => {
    const files = releaseFiles();
    for (const required of [
        "index.js", "manifest.json", "style.css", "schema.json",
        "config/heightDefaults.json", "scripts/continuity-manager.js",
        "scripts/automation-scope.js", "scripts/drivers/request.js"
    ]) assert.ok(files.includes(required), `missing ${required}`);
    for (const file of files) {
        assert.doesNotMatch(file, /^(?:tests|node_modules|\.claude|release)\//);
        assert.doesNotMatch(file, /(?:debug\.log|PROJECT_|AUDIT|REPORT)/i);
        assert.doesNotMatch(file, /^ccm-training-data-/i);
    }
});
