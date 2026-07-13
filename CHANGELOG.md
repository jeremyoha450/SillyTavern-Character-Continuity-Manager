# Character Continuity Manager Changelog

## 1.0.0

### Core continuity

- Stable facts, current state, durable knowledge, field locks, confidence, update history, inventory, and configurable automation.
- Independent solo and group-specific continuity with shared group scenes, member targeting, and strict solo/group scope isolation.

### Character creation

- Guided and AI-assisted native V3 character creation with connected casts, lorebooks, tags, avatars, imports, review, and SillyTavern save.

### Images

- Editable image-prompt presets and SillyTavern Image Generation integration with prompt history, gallery, reuse, and character-image assignment.
- Correct group shared-scene image context while preserving member-specific pose, expression, clothing, hands, and other state.

### Providers

- OpenAI Compatible, OpenAI, OpenRouter, DeepSeek, NanoGPT, Ollama, Anthropic, Gemini, and SillyTavern active-model routing.
- Bounded structured-output correction, direct-provider timeout handling, and privacy-safe categorized provider errors.

### Security and reliability

- Fixed toast injection; added guarded storage, bounded card-import resources, bounded image history, scope-aware automation locks, deterministic release tooling, and CI.

### Validation

- 247/247 unit tests passed; 6 browser tests passed and 3 optional provider-backed checks skipped.
- Fresh installation, populated rc1 upgrade, solo/group continuity, Character Creator native save, provider-backed requests, and the configured NoobAI workflow passed.
- Source, artifact, and disposable installation match 106/106 with zero blocking CCM errors.

Training Data Collection remains experimental, explicit opt-in, bounded, and off by default. CCM-AI remains a separate project. Database Inspector and AI Context Viewer are not included. Knowledge history is intentionally omitted. The v1.0.x line is limited to bug-fix and compatibility maintenance.

## 1.0.0-rc3

### Fixed

- Image Prompt now checks for the selected character's active chat before contacting the AI provider or creating prompt history. When needed, CCM explains the requirement and offers an explicit **Open Character Chat** action instead of allowing image generation to fail with an unrelated image-URL error.
- Start New Chat, Re-extract Facts, Update State, and Update Knowledge now perform the same active-character-chat preflight. They explain the requirement and can open the matching card before continuing, instead of acting on SillyTavern's previously selected character.
- Group-scoped image prompts now use non-empty shared group scene location and area before member/solo fallbacks.
- Group member pose, expression, hands, clothing, and other member-specific state remain group-scoped.
- Solo image prompts remain unchanged.

### Tests

- Added behavior coverage for shared location precedence, shared area precedence, member pose preservation, empty-scene fallback, solo isolation, non-mutation, and group prompt-history scope.

### Validation

- 247/247 unit tests passed.
- 15/15 focused image/group tests passed.
- 6 browser tests passed; 3 optional provider-backed tests skipped.
- The 106-file release artifact was verified with exact 106/106 artifact/install equality.
- Manual three-card group validation passed.
- Automatic speaker targeting, explicit Alpha-to-Gamma mention targeting, and live solo/group Auto State isolation passed with the disposable 12B chat model and configured CCM provider.
- The dashboard preflight correction was rebuilt, synchronized, and live-tested for all four guarded actions with zero CCM console errors.
- Final `1.0.0` is technically justified by the completed RC3 promotion matrix, but still requires separate authorization.

## 1.0.0-rc2

### Security

- Fixed stored toast HTML injection.

### Reliability

- Guarded blocked localStorage access.
- Added safe card-import size and PNG validation limits.
- Added bounded direct-provider request timeouts.
- Fixed solo/group automation scope collisions.
- Added bounded image-history retention.

### Release engineering

- Added deterministic release artifact tooling.
- Added CI checks.
- Added explicit LF line-ending policy.
- Verified fresh-clone reproducibility.
- Verified source/artifact/install equality for 104 runtime files.

### Validation

- 232/232 unit tests passed.
- 6 browser tests passed.
- 3 optional provider-backed browser tests skipped.
- Secret/privacy scan passed.
- Fresh-clone artifact verified.

Training Data Collection remains experimental, opt-in, bounded, and off by default. Database Inspector and AI Context Viewer are not part of rc2. Knowledge history remains intentionally omitted. Final 1.0.0 still requires external RC validation.

### External validation — 2026-07-13

- Passed a clean installation in an isolated SillyTavern 1.18.0 data root: launcher, dashboard, Settings, Health, database 5, AI settings 7, clean runtime directory, and zero CCM console errors.
- No CCM bug or data loss was observed and no fix was made.
- Populated rc1 upgrade, solo/group continuity, native Character Creator save, provider-backed request, and configured image workflow remain untested. Final 1.0.0 is not yet justified.

### External validation continuation — 2026-07-13

- Passed a populated synthetic rc1-to-rc2 upgrade with exact preservation of three characters, one group, continuity data, locks, automation, image/prompt history, usage, and provider/model/preset settings.
- Passed Character Creator navigation, validation, and native V3 card save in the isolated profile.
- Solo stored-data display passed; live solo/group AI updates were not run.
- No disposable provider or image service was reachable, so provider-backed and configured-image gates remain untested. No CCM bug was proved and no fix was made. Final 1.0.0 remains unjustified.
- Follow-up service testing reached the corrected 4B provider, but automatic extraction exhausted one bounded corrective retry without usable structured output. ComfyUI was reachable but lacked a disposable workflow mapping. No CCM fix was made; final 1.0.0 remains unjustified.

### Final-gate attempt — 2026-07-13 15:15 +10:00

- Passed one credential-free 4B State update with five merged changes, one bounded corrective retry, history update, and correct provider/model attribution.
- Passed native V3 automatic CCM tracking with one record, Facts extraction, initial Knowledge extraction, and no duplicate.
- Matched NoobAI to `Noobai_locked.json` and `NoobAI-XL-Vpred-v1.0` at 512x512; Flux was not tested. Prompt preview and Prompt History passed, but SillyTavern returned no image URL and no matching disposable request reached ComfyUI history.
- The active disposable profile contained only two SillyTavern cards and no live group, so live three-card targeting and scope isolation were not run.
- No code, prompt, schema, manifest, or version change was made. Final 1.0.0 remains unjustified.

### Image-gate correction — 2026-07-13 15:47 +10:00

- The previous image failure was invalidated as a tester-procedure error caused by running outside the matching character chat.
- A read-only observed CCM run generated successfully with NoobAI and `Noobai_locked.json`; Gallery increased from 2 to 3 without any settings change.
- The configured-image gate passes. The live three-card group-scope gate remains outstanding.

## Unreleased — release hardening (2026-07-12)

- Fixed toast HTML injection by rendering messages as literal text.
- Guarded blocked local storage for UI section state.
- Added card file/metadata/depth/collection and PNG signature/chunk limits.
- Retained the newest 200 image records per scope without pruning active image references.
- Isolated automation counters/locks by character and solo/group scope.
- Added 60-second direct-provider timeouts and distinct cancellation classification.
- Added hardening/artifact tests, deterministic release tooling, exclusions, and CI; 232 tests pass.
- Added a repository LF checkout policy and proved the prior 89 fresh-clone/install mismatches were newline-only.
- Validated a brand-new exact-commit clone and synchronized its artifact: source, artifact, and install match 104/104 with zero missing or different files.
- Manifest remains `1.0.0-rc1`; an explicit `1.0.0-rc2` bump is justified but not yet authorized.

## v1.0.1 release-validation candidate — not bumped yet

Status: validated as a release candidate on 2026-07-10. The manifest should not be bumped to `1.0.1` until explicitly approved.

### Validation completed

- `npm test` passes: 131/131.
- `npm run test:browser` passes its non-live scaffold: 5 passed, 3 skipped optional live-AI flows.
- Local SillyTavern live smoke test was run against SillyTavern `1.18.0`.
- Group continuity was tested with the configured `Test Chat` group:
  - Group dashboard opens.
  - Four members are tracked.
  - Shared scene location/area/notes save.
  - Group-specific member details open.
  - Manual group facts/state/knowledge actions complete.
  - Group automation state update runs after generated replies.
  - Speaker labels and member mentions target group members correctly.
  - Group history, prompt history, gallery, and set-as-character-image work under group scope.
- Health tab live-verified SillyTavern version through `/version`.
- Prompt previews passed for Anima, Flux, Pony, Illustrious, NoobAI, and SDXL.
- NoobAI image generation through SillyTavern Image Generation passed.

### Fixed

- Fixed group-scoped manual State, Facts, and Knowledge actions returning to the solo dashboard after completion. These actions now preserve `groupId` when re-rendering.

### Testing notes

- Flux and SDXL image generation were skipped per workflow mapping.
- Anima, Pony, and Illustrious prompt previews passed, but full image generation still needs manual confirmation with matching ComfyUI workflows selected first.
- Auto Knowledge's current minimum interval is 10 replies; a full 10-reply threshold run was not repeated during this pass.
- Character Creator modal/Next behavior was verified; native save of a new test card was not repeated.

## v2 development — Training Data Collection started

### Added

- Phase 1 Developer Mode in Debug / Logging, off by default, with advanced developer controls hidden from normal users.
- Opt-in Training Data Collection for future CCM specialist-model preparation.
- Collection coverage for `facts`, `state`, `knowledge`, `knowledge-update`, `image-prompt`, `character-cast-plan`, `character-card`, and `character-card-field`.
- Local bounded training records containing task/source/model metadata, available character/scope/group identifiers, AI input messages, raw AI response, parsed output, parse success/failure, retry count, failure details, and placeholder user-correction status.
- Settings tab controls for enabling collection, reviewing the warning, setting maximum saved records, seeing record count, exporting JSON, refreshing count, and clearing all records.
- Credential redaction/omission for recognizable API keys, authorization values, bearer tokens, token query parameters, headers, and credential-like fields.

### Notes

- Developer Mode currently exposes a gated advanced-tools scope area without dead placeholder buttons. Current scope is Database Inspector, AI Context Viewer, Safe Debug Bundle, advanced Health details, and request diagnostics/statistics. AI Benchmark and Recovery Tools are deferred.
- Training Data Collection is off by default and must be explicitly enabled.
- Exports may contain private character, scenario, roleplay/chat, image-prompt, and generated-card content. Users should review exported JSON before sharing.
- No model training was added.
- AI prompts, task outputs, and parser behavior were not changed.

## 0.1.2 — pre-v1.0 / beta

Status: release-candidate preparation. The manifest still reports `0.1.2`; do not treat this as the final v1.0 release until the version is intentionally bumped.

### Completed for the v1.0 candidate

- Solo character dashboard, editor, facts, state, knowledge, image prompt, image history, gallery, statistics, and settings workflows are present.
- Connected-cast and group-continuity code is implemented, but group continuity has not been smoke-tested in the local SillyTavern instance because groups are not configured yet.
- Character Creator supports guided and AI-assisted card creation, V3 card review, tags, lorebook entries, avatar upload/generation, and native SillyTavern creation.
- Image prompt generation and direct SillyTavern image generation are available. The active/local smoke path is NoobAI.
- Debug / Logging and Health settings sections are available and avoid exposing secrets by default.
- Bounded one-retry structured-output recovery is implemented for malformed/incomplete AI JSON.
- Provider errors are normalized into safer user-facing categories with copyable diagnostics.

### Smoke-test bugs fixed

- Launcher click/keyboard activation was fixed and covered by a maintenance test.
- Character Creator popup stacking was fixed so the creator opens above the popup-mode CCM dashboard and the Next button remains clickable.
- Health version lookup now falls back to SillyTavern's public `/version` endpoint when page globals do not expose the version.

### Current validation notes

- `npm test` passes: 124/124 on 2026-07-09.
- Browser Playwright scaffold exists, but `npm run test:browser` cannot run until Playwright is installed in the local environment.
- NoobAI prompt preview and SillyTavern image generation passed in the live local instance.
- Other image presets were not tested in the resumed pass and should remain untouched unless explicitly requested.

### Known remaining manual checks before v1.0

- Copy the latest project files into the installed SillyTavern extension and reload before final live verification.
- Recheck the Health tab after the installed copy receives the `/version` fallback.
- Complete a longer Auto Knowledge threshold test if the live model budget/time allows it.
- Optionally create a harmless test character through the Creator and confirm CCM tracks it after native SillyTavern save.
- Optionally test Set as Character Image, because it intentionally changes the selected card image.
- Test group continuity only after group chats are configured.
