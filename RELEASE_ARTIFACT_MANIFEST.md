# Release Artifact Manifest

**Generated/verified:** 2026-07-13 +10:00
**Manifest version:** `1.0.0-rc3`
**Build command:** `npm run release:build`

The deterministic artifact is `release/ccm` and contains exactly 106 files selected by `tools/release.mjs`:

- Root: `index.js`, `manifest.json`, `style.css`, `schema.json`, `README.md` (5).
- Configuration: every file under `config/` (currently only `config/heightDefaults.json`) (1).
- Runtime modules: every file under `scripts/`, recursively and sorted (100).

The inclusion rule is intentionally narrow and executable; adding a runtime module under `scripts` includes it automatically, while root files require an explicit `RELEASE_ROOTS` entry. `tests/release-artifact.test.mjs` asserts required new modules and exclusions.

Excluded: `.git`, `.github`, `.claude`, `node_modules`, `tests`, `tools`, `release`, package files, audit/release/project reports other than README, logs, browser artifacts, training/debug exports, CCM-AI, characters, chats, images, and all SillyTavern user data/settings.

The RC3 source/artifact/install equality and aggregate digest are recorded after the authorized rc3 rebuild and disposable synchronization. Installation tooling copies only approved files and does not access SillyTavern user-data directories.

The verified RC3 aggregate runtime digest is `3b06030a18e7972544b36a7345ae3cbe1b2c4dd5a99cc1f65b2b11ba94834609`.

The final disposable comparison reports 106/106 matching runtime files, zero missing, zero different, and zero extra. The artifact scan reports zero credential patterns, zero private-data paths, and zero CRLF files.
