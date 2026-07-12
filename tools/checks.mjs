import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const excluded = new Set([".git", "node_modules", "release", "playwright-report", "test-results"]);

function walk(path) {
    return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
        if (excluded.has(entry.name)) return [];
        const full = join(path, entry.name);
        return entry.isDirectory() ? walk(full) : [full];
    });
}

const mode = process.argv[2];
if (mode === "syntax") {
    const files = walk(join(root, "scripts")).filter(file => extname(file) === ".js");
    for (const file of files) {
        const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
        if (result.status !== 0) {
            process.stderr.write(result.stderr || result.stdout);
            process.exit(result.status || 1);
        }
    }
    console.log(`Syntax checked ${files.length} production modules.`);
} else if (mode === "json") {
    const files = walk(root).filter(file => extname(file) === ".json");
    for (const file of files) JSON.parse(readFileSync(file, "utf8"));
    console.log(`Parsed ${files.length} JSON files.`);
} else {
    throw new Error("Use syntax or json.");
}
