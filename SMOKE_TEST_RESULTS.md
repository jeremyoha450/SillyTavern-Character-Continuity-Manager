# Smoke Test Results

**Current run:** 2026-07-12 +10:00 — manifest `1.0.0-rc1`

Historical duplicated smoke narratives and obsolete totals were removed so they cannot be mistaken for current validation.

| Check | Result |
|---|---|
| Focused hardening tests | 15 passed |
| Full `npm test` | 232 passed |
| Production syntax / runtime JSON | Pass |
| Artifact build | 104 runtime files |
| Install comparison after sync | 104 match, 0 missing/different |
| Non-live browser suite | 6 passed, 3 provider-backed skipped |
| Health | CCM rc1 / DB 5 / AI 7 / ST 1.18.0 |
| Browser console | No errors observed |

Expected negative-path warnings occur for intentional config/parser fixtures.

The launcher, dashboard, settings/Developer Mode visibility, statistics, creator modal, responsive layout, and literal hostile-toast behavior passed against the synchronized install. A solo dashboard opened successfully. Provider-backed manual state/knowledge/image tests remained disabled. No manual facts/state/knowledge or generation operation was run because no clearly isolated disposable continuity record was identifiable; no paid operation ran.
