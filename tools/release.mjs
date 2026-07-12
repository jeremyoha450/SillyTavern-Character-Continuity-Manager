import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const RELEASE_ROOTS = Object.freeze([
    "index.js",
    "manifest.json",
    "style.css",
    "schema.json",
    "README.md",
    "config",
    "scripts"
]);

function walk(path, base = path) {
    if (!existsSync(path)) return [];
    if (statSync(path).isFile()) return [relative(root, path).replaceAll("\\", "/")];
    return readdirSync(path, { withFileTypes: true })
        .flatMap(entry => walk(join(path, entry.name), base))
        .sort();
}

export function releaseFiles() {
    return RELEASE_ROOTS.flatMap(item => walk(join(root, item))).sort();
}

function hash(path) {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function buildArtifact(outDir = join(root, "release", "ccm")) {
    rmSync(outDir, { recursive: true, force: true });
    for (const file of releaseFiles()) {
        const destination = join(outDir, file);
        mkdirSync(dirname(destination), { recursive: true });
        cpSync(join(root, file), destination);
    }
    return { outDir, files: releaseFiles() };
}

export function compareRuntime(targetDir, sourceDir = root) {
    const matching = [];
    const missing = [];
    const different = [];
    for (const file of releaseFiles()) {
        const source = join(sourceDir, file);
        const target = join(targetDir, file);
        if (!existsSync(target)) missing.push(file);
        else if (hash(source) === hash(target)) matching.push(file);
        else different.push(file);
    }
    return { matching, missing, different };
}

export function installArtifact(targetDir, sourceDir = join(root, "release", "ccm")) {
    if (!existsSync(join(sourceDir, "manifest.json"))) throw new Error("Build the release artifact first.");
    for (const file of releaseFiles()) {
        const destination = join(targetDir, file);
        mkdirSync(dirname(destination), { recursive: true });
        cpSync(join(sourceDir, file), destination);
    }
    return compareRuntime(targetDir, sourceDir);
}

export function verifyArtifact(sourceDir = join(root, "release", "ccm")) {
    const expected = releaseFiles();
    const artifactFiles = readdirRecursive(sourceDir);
    const missing = expected.filter(file => !artifactFiles.includes(file));
    const extra = artifactFiles.filter(file => !expected.includes(file));
    const different = expected.filter(file =>
        existsSync(join(sourceDir, file)) && hash(join(root, file)) !== hash(join(sourceDir, file))
    );
    const digest = createHash("sha256");
    for (const file of expected) digest.update(file).update("\0").update(readFileSync(join(sourceDir, file)));
    const result = { files: artifactFiles.length, missing, extra, different, sha256: digest.digest("hex") };
    if (missing.length || extra.length || different.length) throw new Error(JSON.stringify(result));
    return result;
}

function readdirRecursive(directory, base = directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const full = join(directory, entry.name);
        return entry.isDirectory()
            ? readdirRecursive(full, base)
            : [relative(base, full).replaceAll("\\", "/")];
    }).sort();
}

const [mode, targetArg] = process.argv.slice(2);
if (mode === "build") {
    const result = buildArtifact();
    console.log(`Built ${result.files.length} runtime files in ${result.outDir}`);
} else if (mode === "compare") {
    const target = resolve(targetArg || "C:/Sillytavern/SillyTavern/data/default-user/extensions/SillyTavern-Character-Continuity-Manager");
    console.log(JSON.stringify(compareRuntime(target), null, 2));
} else if (mode === "verify") {
    console.log(JSON.stringify(verifyArtifact(), null, 2));
} else if (mode === "install") {
    if (!targetArg) throw new Error("Install requires an explicit target directory.");
    console.log(JSON.stringify(installArtifact(resolve(targetArg)), null, 2));
} else if (mode) {
    throw new Error("Use build, compare, or install <explicit-target>.");
}
