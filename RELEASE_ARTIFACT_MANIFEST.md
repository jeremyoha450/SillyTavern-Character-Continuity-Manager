# Release Artifact Manifest

**Generated/verified:** 2026-07-12 20:01 +10:00
**Manifest version:** `1.0.0-rc1`
**Build command:** `npm run release:build`

The deterministic artifact is `release/ccm` and contains exactly 104 files selected by `tools/release.mjs`:

- Root: `index.js`, `manifest.json`, `style.css`, `schema.json`, `README.md` (5).
- Configuration: every file under `config/` (currently only `config/heightDefaults.json`) (1).
- Runtime modules: every file under `scripts/`, recursively and sorted (98).

The inclusion rule is intentionally narrow and executable; adding a runtime module under `scripts` includes it automatically, while root files require an explicit `RELEASE_ROOTS` entry. `tests/release-artifact.test.mjs` asserts required new modules and exclusions.

Excluded: `.git`, `.github`, `.claude`, `node_modules`, `tests`, `tools`, `release`, package files, audit/release/project reports other than README, logs, browser artifacts, training/debug exports, CCM-AI, characters, chats, images, and all SillyTavern user data/settings.

Pre-sync comparison found 69 matching, 5 missing, and 30 different. After approved synchronization, all 104 files match by SHA-256 with none missing or different. Installation tooling copied only these files and did not delete extras or access a user-data directory.
