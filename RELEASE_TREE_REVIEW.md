# Release Tree Review

**Review date:** 2026-07-12
**Base commit:** `403213d`
**Status:** all 132 status paths reviewed; staging/commit validation pending

## Commit after manual review

Intended hardening source from this pass: `.gitignore`, `package.json`, `package-lock.json`, `scripts/ui/status.js`, `scripts/storage.js`, `scripts/character-card-import.js`, `scripts/image-history.js`, `scripts/continuity-manager.js`, `scripts/automation-scope.js`, `scripts/drivers/request.js`, `scripts/drivers/openai-transport.js`, `scripts/drivers/anthropic.js`, `scripts/drivers/gemini.js`, `scripts/drivers/ollama.js`, and `scripts/provider-error.js`.

Intended hardening tests/tooling: `.github/workflows/ci.yml`, `tools/release.mjs`, `tests/release-hardening.test.mjs`, `tests/image-history-retention.test.mjs`, `tests/request-timeout.test.mjs`, and `tests/release-artifact.test.mjs`.

Intended current documentation: README, PROJECT_STATUS, PROJECT_REPORT, CHANGELOG, SMOKE_TEST_RESULTS, DEVELOPER_TOOLS, the six audit reports, and the release reports created by this pass. Release artifacts themselves are generated and ignored.

## Obsolete removals

`data/schema.json`, `scripts/extraction/age-guard.js`, and `scripts/providers/provider-settings.js` have no current source references. Their deletion is consistent with the current root schema, uniform-age behavior, and consolidated AI settings. Confirm these deletions in the eventual commit review.

## Ignored / never commit or ship

`node_modules/`, `debug.log`, `*.log`, `.claude/settings.local.json`, browser reports/results, `release/`, `ccm-training-data-*.json`, and `ccm-debug-*.json`. No known secret pattern was found in the built artifact.

## Reviewed pre-existing work

All other modified/untracked production and test paths shown by `git status` predate or extend beyond the final hardening edits. They were reviewed against the full audit, executable 104-file artifact manifest, installed hashes, imports, documentation, and 232-test suite. The broad facts/state/image/post-processing/editor/creator/group/diagnostics changes are required by the synchronized artifact and have corresponding implementation/test evidence. They are classified as intended production or test files for the single release-hardening commit.

`manifest.json` remains intentionally at `1.0.0-rc1`. `config/heightDefaults.json`, schema, entry point, stylesheet, migrations, database, and UI/task modules are intended parts of the reviewed artifact. No status path remains in the uncertain/manual-hold category.

## Cleanliness conclusion

Ignore policy is corrected and dependency installation is reproducible with `npm ci`, but the Git tree is not clean. A trustworthy release requires an intentional commit (or reviewed branch) containing all required runtime modules and tests, followed by a fresh clone/`npm ci` validation.
