# Release Hardening Report

**Run:** 2026-07-12 +10:00
**Manifest:** `1.0.0-rc1` unchanged

## Implemented

- Text-only central toast sink with hostile-markup behavior test; all `showCCMToast` callers inspected.
- Guarded UI-state local-storage read using the shared browser read helper.
- 5 MB file, 2 MB decoded JSON, 24-depth, 200-tag, 100-greeting/type, 500-lore-entry limits; PNG signature and safe chunk bounds.
- Newest 200 prompt/image records per solo/group scope; active image unaffected. Durable knowledge is not pruned.
- Scope-aware automation counters and in-flight locks for solo and distinct groups.
- 60-second AbortController timeout for direct OpenAI-compatible, Anthropic, Gemini, and Ollama HTTP calls; cancellation classified separately; no rate/network retry added.
- Deterministic 104-file runtime build/compare/install tooling, artifact behavior test, corrected ignore policy, and GitHub Actions CI.
- Current documentation replaces stale totals and clearly excludes rejected/deferred features.

## Validation so far

- Focused tests: 15 passed.
- Full tests after changes: 232 passed.
- `npm ci`: pass, 3 packages installed.
- Production syntax/runtime JSON checks: pass.
- `git diff --check`: pass (line-ending notices only).
- Artifact secret-pattern scan: no known credential patterns.
- Install comparison after approved sync: 104 match, 0 missing/different.
- Non-live browser: 6 passed, 3 provider-backed skipped.
- Health: CCM rc1, DB 5, AI 7, SillyTavern 1.18.0; browser console had no errors.

## Deferred

Manual Cancel UI and late-response protection for the non-abortable SillyTavern active-model API are v1.1 work. Knowledge gets no history and no destructive cap. CCM-AI was not changed and no training ran.

## Remaining release work

The installed runtime is synchronized. The repository remains materially dirty and requires intentional review/commit. Provider-backed manual smoke was not run because no clearly isolated disposable continuity record was identifiable.

## Files changed by this hardening pass

Production: `.gitignore`, `package.json`, `scripts/ui/status.js`, `scripts/storage.js`, `scripts/character-card-import.js`, `scripts/image-history.js`, `scripts/continuity-manager.js`, `scripts/automation-scope.js`, `scripts/drivers/request.js`, `scripts/drivers/openai-transport.js`, `scripts/drivers/anthropic.js`, `scripts/drivers/gemini.js`, `scripts/drivers/ollama.js`, and `scripts/provider-error.js`.

Tests/tooling: `.github/workflows/ci.yml`, `tools/release.mjs`, `tests/release-hardening.test.mjs`, `tests/image-history-retention.test.mjs`, `tests/request-timeout.test.mjs`, `tests/release-artifact.test.mjs`, and `tests/browser/ccm-smoke.spec.mjs`.

Documentation/reports: `README.md`, `PROJECT_STATUS.md`, `PROJECT_REPORT.md`, `CHANGELOG.md`, `SMOKE_TEST_RESULTS.md`, `DEVELOPER_TOOLS.md`, `RELEASE_READINESS.md`, `SECURITY_PRIVACY_REVIEW.md`, `TEST_COVERAGE_REPORT.md`, `RELEASE_HARDENING_REPORT.md`, `RELEASE_TREE_REVIEW.md`, `RELEASE_ARTIFACT_MANIFEST.md`, and `RELEASE_VERSION_RECOMMENDATION.md`. `package-lock.json` was retained and validated by `npm ci`.
