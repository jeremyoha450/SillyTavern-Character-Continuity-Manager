# Full Project Audit

**Audit timestamp:** 2026-07-12 13:55:46 +10:00 (Australia/Brisbane)
**CCM repository:** `C:\Code\SillyTavern-Character-Continuity-Manager`
**CCM commit:** `403213dd739b1188b63d3fa5b2ce9ecf3d8ec7ef` (working tree materially dirty)
**CCM-AI repository:** `C:\Code\CCM-AI` (no Git metadata found)
**Installed extension:** `C:\Sillytavern\SillyTavern\data\default-user\extensions\SillyTavern-Character-Continuity-Manager`
**Requested live URL:** `http://127.0.0.1:8000/` (connection refused during this audit)

## Method and confidence

This is a new audit of current files. Existing reports were read only as historical context. Claims below are based on code, configuration, tests, Git state, repository/install hashes, and attempted runtime tests. “Fact” means directly observed; “inference” means a conclusion from those facts; “recommendation” is proposed work. No production file, manifest, installed extension, credential, character record, or chat was changed or exposed.

The requested GPT-5.6 Sol model could not be selected from inside the task; the audit used the active Codex model.

## 1. Repository inventory

### Counts

Excluding `.git` and `node_modules`, the repository had 140 files before these six reports were added:

| Type | Count |
|---|---:|
| JavaScript (`.js`) | 97 |
| Node tests/config (`.mjs`) | 27 |
| Markdown | 7 |
| JSON | 6 |
| CSS | 1 |
| log | 1 |
| no extension (`.gitignore`) | 1 |

Top-level composition was 96 files under `scripts`, 28 under `tests`, one runtime config, six historical Markdown reports, plus entry point, schema, manifest, package files, stylesheet, `.claude/settings.local.json`, `.gitignore`, and untracked `debug.log`.

### Versions and package

- Manifest: `1.0.0-rc1` (`manifest.json`).
- Database schema/runtime migration: 5 (`schema.json`; `scripts/migrations.js:DATABASE_VERSION`).
- AI settings migration: 7 (`scripts/migrations.js:AI_SETTINGS_VERSION`).
- Scripts: `npm test` → `node --test`; `npm run test:browser` → Playwright config under `tests/browser`.
- Runtime dependencies: none declared.
- Development dependency: `@playwright/test ^1.61.1`.
- No `test:stress` script and no CI workflow were found.

### Production modules

The 96 files under `scripts` are organized into these production areas:

- Entry/orchestration: `continuity-manager.js`, `database.js`, `storage.js`, `migrations.js`, `usage.js`, `health.js`, `hash.js`.
- AI routing: `scripts/ai/*`, eight `scripts/drivers/*`, `provider-error.js`, `providers/provider-manager.js`.
- Tasks: facts, state, knowledge, knowledge-update, image prompts/presets, and character creator under `scripts/tasks/*`.
- State/fact processing: `extraction/post-process.js`, `merge/merge-data.js`, `state/update-state.js`, `state/reconcile-transition.js`, `history/history.js`.
- Groups: `group-context.js` plus scoped database and UI paths.
- Creator/card integration: `character-creator-tools.js`, `character-card.js`, `character-card-import.js`, `sillytavern-characters.js`.
- Images: `sillytavern-image.js`, `image-history.js`, `image-preset-transfer.js`, image task modules and six presets.
- UI: `ui.js` and 22 focused modules under `scripts/ui`.
- Diagnostics/data: `debug-logger.js`, `training-data.js`, Health and settings panels.

### Tests and documentation

There are 25 Node unit/module test files under `tests/*.test.mjs`, covering retry, imports, creator, logging, editor, groups, health, height, history, images, parsing, persistence/schema maintenance, transports/errors, post-processing, state transitions, and training data. Browser tests consist of `tests/browser/ccm-smoke.spec.mjs`, its Playwright config, and README. Documentation/configuration source files are the six named historical Markdown documents, `schema.json`, `manifest.json`, `package.json`, and `config/heightDefaults.json`.

### Git state

At audit time Git reported 114 changed paths: 62 modified, 3 deleted, and 49 untracked. This includes production code, tests, docs, lockfile, and `node_modules`. Deleted tracked files were `data/schema.json`, `scripts/extraction/age-guard.js`, and `scripts/providers/provider-settings.js`. The checkout is not reproducible as a release from commit `403213d` without first deciding and committing the intended changes.

### Repository versus installed extension

Both manifests say `1.0.0-rc1`, but equal version labels conceal different code.

Repository-only production modules include `scripts/state/reconcile-transition.js` and `scripts/tasks/image/nudity.js`; the installed version of the current importing modules is older, so the installed copy is internally consistent but lacks those current repository behaviors. Twenty common production files differ by SHA-256, including database/settings, extraction/merge/state, facts/state prompts and schemas, every image preset, image formatter/index, editor modules, and image-prompt UI. The installed tree had no installed-only file. Repository-only documentation, tests, package lock, `.claude` settings and `debug.log` are development artifacts and should not all ship. The installed copy is therefore stale despite matching the manifest version.

## 2. Implemented feature findings

Detailed classifications and evidence are in `FEATURE_MATRIX.md`. In summary:

- Character CRUD, search/sort, dashboard/editor, facts/state/knowledge, groups, creator, image prompting/history, eight provider drivers, persistence, usage, logging, Health, and bounded training capture have real code paths.
- The strongest tested logic is pure parsing/post-processing, creator normalization, group scoping, provider errors, and height/image consistency.
- Runtime integration is less certain because the local server was unavailable and browser tests failed before loading SillyTavern.
- Image workflow-to-preset mapping remains external to CCM; the extension sends prompts to SillyTavern’s selected image source rather than managing separate backends.
- Group target selection is heuristic: enabled members who spoke or whose names appear in recent messages. Aliases, pronouns, ambiguous shared names, and embedded multi-character cards are not resolved.
- Knowledge replacement compares exact text/confidence; semantically duplicate paraphrases are not deduplicated.

## 3. Developer Mode audit

Fact: Developer Mode defaults false, is normalized and persisted in local debug settings, and hides `#ccm-developer-tools` when off (`debug-logger.js`, `ui/settings-debug.js`). It does not enter the AI execution path. The Node test verifies default/persistence; the browser source intends to verify visibility but could not run today.

The visible developer area in `ui/settings.js:624-657` contains descriptive text only and deliberately no buttons:

| Proposed tool | Actual state |
|---|---|
| Database Inspector | Descriptive text only; not implemented |
| AI Context Viewer | Descriptive text only; generic opt-in debug capture exists elsewhere |
| Safe Debug Bundle | Descriptive text only; generic debug JSON export is implemented, but not the described combined bundle |
| Advanced Health details | Basic safe Health panel implemented; no developer-only advanced check tool |
| Request duration/statistics | Duration is logged when debug is enabled; token/request statistics exist; no complete duration statistics UI |
| Stress-test support | Missing; documentation says future separate test command |
| AI Benchmark | Deliberately deferred |
| Recovery Tools | Deliberately deferred |

No disabled/dead placeholder controls remain. However, `DEVELOPER_TOOLS.md` calls several items “Current scope” in language that can be read as implemented; the UI itself correctly says tools will appear only when working. Developer Mode alone exposes no content; separately enabling AI-content capture can expose private prompts/responses after a warning.

## 4. Training collection

`scripts/training-data.js` supports facts, state, knowledge, knowledge-update, image-prompt, character-cast-plan, character-card, and character-card-field. It stores: id, ISO timestamp, taskId, provider, source, model, characterId, scope, group, inputMessages, rawAIResponse, parsedOutput, parseSuccess, retryCount, errorDetails, and userCorrectionStatus.

Storage is `extensionSettings.characterContinuityManager.trainingData`, falling back to local-storage key `ccm-training-data-v1`. Default is disabled, default maximum 100, configurable 10–2000, newest-first truncation. Export is `ccm-training-data-v1` JSON; clear empties all records after confirmation. Successful final output or terminal failure is recorded; a successful retry produces one record with retryCount 1, not separate attempt-level examples. Parsing success and errors are recorded.

The collection is suitable for diagnostics and candidate-data capture, not yet quality-controlled supervised training: `userCorrectionStatus` is always passed as `unknown`; there is no approval editor, correction/gold target, grader, provenance/license consent, deduplication, or quality score. Raw model output is the converted target. Redaction removes recognized credential-shaped strings and secret-keyed object properties, but regex redaction cannot guarantee removal of arbitrary credentials or private content. Users are warned to review exports.

Compatibility details are in `CCM_AI_COMPATIBILITY_REPORT.md`.

## 5. Providers and routing

`index.js` registers OpenAI Compatible, OpenAI, OpenRouter, DeepSeek, NanoGPT, Ollama, Anthropic, and Gemini. Model discovery exists for all drivers, although availability depends on the provider endpoint. Global routing chooses CCM’s driver or SillyTavern’s active model. OpenAI-compatible, Anthropic, Gemini, and SillyTavern routes apply task/settings output limits; tests directly cover OpenAI-compatible truncation and SillyTavern routing, while Anthropic/Gemini parity is mainly code-inspected.

Usage is bounded to 100 recent entries and aggregates by character/task/provider/model. Structured-output failures receive at most one corrective retry. Provider error normalization covers auth, billing, rate, context/output, filter, model, overload, timeout, and network categories. There is no request-level AbortController, explicit timeout implementation, cancellation UI, exponential backoff, or rate-limit retry scheduler; normalized timeout/retry metadata should not be mistaken for those behaviors.

## 6. Persistence and diagnostics

Database and AI settings prefer SillyTavern per-user extension settings and call `saveSettingsDebounced`; browser local storage is the fallback and legacy import source. Migrations normalize databases to version 5 and AI settings to 7. History and usage are capped at 100, debug at 50–1000, training at 10–2000. Image history and knowledge are uncapped, so storage can grow without bound. Saves clone/migrate the full database and invoke debounced persistence frequently.

Debug logging defaults off, allowlists structured fields, caps retention, and keeps AI content behind a separate opt-in with 20,000-character per-value truncation and recognizable-secret redaction. Health reports safe versions/config availability. Training and debug exports intentionally may contain private content when their respective content collection is enabled.

## 7. Performance and maintainability

Largest source files by line count: `ui/editor.js` 1,650; `ui/settings.js` 1,338; `ui/character-creator.js` 1,140; `extraction/post-process.js` 1,024; `ui.js` 979; `continuity-manager.js` 862; `ui/image-prompt.js` 744; `database.js` 650; `ui/state-actions.js` 600; `ui/image-gallery.js` 479.

Needed refactors, not merely stylistic:

- Split editor/settings/creator/orchestrator modules along state/render/action boundaries; their size makes integration regressions hard to isolate.
- Centralize safe DOM rendering. Many templates are correctly escaped, but inconsistent `innerHTML` use created a real injection issue in `showCCMToast`.
- Cap image/knowledge collections and avoid whole-database cloning/persistence for small updates.
- Key automation in-flight/counters by scope as well as character. Current maps/sets use only `character.id`; rapid solo/group activity for the same card can suppress or mix scheduling across scopes (inference from `continuity-manager.js:82-86,611-645`).
- Add cancellation/timeouts and test async overlaps. Context sync has in-flight/pending protection, but provider calls do not.

Character/group lookups are mostly linear scans (`Object.values`, member mappings, character finds), acceptable for small collections but O(characters × group members) during resolution. Re-render functions rebuild large DOM sections and rebind listeners; no leak was proven because old nodes are replaced, but repeated document-level initialization would duplicate event subscriptions if `initializeContinuityManager` were called twice. No confirmed circular import was observed in 198 relative-import edges, but a full graph checker is not configured.

## 8. Documentation accuracy

Accurate current themes: README’s major feature list, provider list, scoped groups, creator capabilities, logging/training opt-ins, schema storage, and bounded corrective retry generally match code. DEVELOPER_TOOLS correctly marks Benchmark and Recovery as deferred.

Material inaccuracies/contradictions:

- `PROJECT_STATUS.md` says manifest `0.1.2`; actual and installed manifests are `1.0.0-rc1`.
- Historical test totals of 124, 131, and 132 in `SMOKE_TEST_RESULTS.md` are snapshots, not current; current Node total is 221.
- Historical browser passes cannot be treated as current validation; today the server refused connections.
- `PROJECT_STATUS.md` calls Training Data Collection “v2,” meaning v2-scope code is present in the proposed v1 bundle.
- `DEVELOPER_TOOLS.md` describes Database Inspector, AI Context Viewer, and Safe Debug Bundle as current scope, but only descriptive text exists.
- `SMOKE_TEST_RESULTS.md` contains duplicated chronological sections with older versions (`0.1.2` and `1.0.0-rc1`), old dependency/install states, and fixes later superseded by current code.
- `PROJECT_REPORT.md`, `PROJECT_STATUS.md`, and smoke results are dated 2026-07-10 and do not reflect the 221-test suite or current dirty tree.
- Claims that the installed extension contains latest fixes are false today based on file hashes.

The rejected/deferred ideas—knowledge locking, timeline, backup/restore UI, history rollback, benchmark, recovery UI, and separate image backend—remain absent/deferred and should not be revived without a new requirement.

## 9. Overall status

Fact: the current repository contains a broad, credible release-candidate implementation with strong unit coverage. Fact: the checkout is dirty, the installed extension is stale, a High DOM-injection flaw remains, browser verification is unavailable, and several integration paths remain only historically tested. Inference: `1.0.0-rc1` remains the honest version; neither a final `1.0.0` nor `1.0.1` is justified from this state.

See `SECURITY_PRIVACY_REVIEW.md`, `TEST_COVERAGE_REPORT.md`, and `RELEASE_READINESS.md` for prioritized detail.
