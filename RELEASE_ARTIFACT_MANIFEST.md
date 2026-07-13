# Release Artifact Manifest

**Generated/verified:** 2026-07-13 +10:00
**Manifest version:** `1.0.0-rc2`
**Build command:** `npm run release:build`

The deterministic artifact is `release/ccm` and contains exactly 104 files selected by `tools/release.mjs`:

- Root: `index.js`, `manifest.json`, `style.css`, `schema.json`, `README.md` (5).
- Configuration: every file under `config/` (currently only `config/heightDefaults.json`) (1).
- Runtime modules: every file under `scripts/`, recursively and sorted (98).

The inclusion rule is intentionally narrow and executable; adding a runtime module under `scripts` includes it automatically, while root files require an explicit `RELEASE_ROOTS` entry. `tests/release-artifact.test.mjs` asserts required new modules and exclusions.

Excluded: `.git`, `.github`, `.claude`, `node_modules`, `tests`, `tools`, `release`, package files, audit/release/project reports other than README, logs, browser artifacts, training/debug exports, CCM-AI, characters, chats, images, and all SillyTavern user data/settings.

The RC2 source, artifact, and installed extension each contain all 104 approved runtime files with identical hashes, none missing or different, and no extra runtime files. Installation tooling copied only approved files and did not access a user-data directory. Two legacy development-only root extras were removed separately after verification.

The verified RC2 aggregate runtime digest is `c0f78640746c48727a8c43c5f46453723e6a6f426a6be5b4f3e1ea22be197a46`.
