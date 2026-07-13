# CCM Current Status

**Updated:** 2026-07-13

**Manifest:** `1.0.0-rc3`

**Database / AI settings:** 5 / 7
**State:** repository hardening, LF reproducibility, fresh-clone validation, and artifact-only installed synchronization complete

## Verification

- `npm test`: 247 passed, 0 failed, 0 skipped.
- Production syntax and runtime JSON parsing: pass.
- Deterministic artifact: 106 runtime files.
- Corrected source, artifact, and disposable installed extension: 106/106 hashes match; none missing or different.
- Browser: 6 non-live checks passed and 3 provider-backed checks skipped.
- Health: CCM `1.0.0-rc3`, database 5, AI settings 7, SillyTavern 1.18.0.

## Hardening completed

- Central text-only toast messages; guarded storage reads.
- Bounded JSON/PNG imports with signature/chunk/depth/count validation.
- Newest 200 image-history records retained per scope.
- Character-plus-scope automation counters and in-flight locks.
- 60-second direct-provider timeouts with distinct cancellation classification.
- Runtime artifact tooling, release exclusions, tests, and CI.

Database Inspector, AI Context Viewer, knowledge history, AI Benchmark, Recovery Tools, timeline, backup/restore UI, rollback, and separate image backend are not being developed here. Knowledge history is intentionally omitted. Training collection remains experimental, opt-in, and default-off.

RC2 is ready for a short external/disposable validation period. Final 1.0.0 is not justified until that RC validation is complete.

## External validation — 2026-07-13

Fresh installation into a new temporary SillyTavern 1.18.0 data root passed, including initial database 5 / AI settings 7 creation and zero CCM console errors. The remaining external matrix is incomplete: populated rc1 upgrade, solo, group, native Character Creator save, provider request, and image workflow are still required. No CCM bug or data loss was observed, and no production data/settings were used.

## External validation continuation — 2026-07-13

The populated synthetic rc1-to-rc2 upgrade passed with all recorded data and settings preserved and no duplicates. The existing solo dashboard and preserved scoped data displayed correctly. Character Creator navigation/validation and native V3 save passed, but automatic CCM extraction could not complete against the intentionally unreachable synthetic provider. Live solo/group updates, provider-backed validation, and image generation remain outstanding. No CCM defect was proved; final 1.0.0 remains unjustified.

The corrected 4B provider later connected successfully, but returned unusable structured output across the original attempt plus one bounded corrective retry. ComfyUI 0.22.0 was reachable without a disposable SillyTavern workflow mapping. No code fix was made; provider-backed success, image generation, and live group validation remain outstanding.

## Final-gate attempt — 2026-07-13 15:15 +10:00

- Passed: credential-free 4B five-field State update, bounded corrective retry, successful merge/history, and exact provider/model attribution.
- Passed: native V3 Character Creator card remained present and completed one Facts plus one Knowledge extraction with no duplicate CCM record.
- Blocked: NoobAI/`Noobai_locked.json` preview passed, but SillyTavern returned no image URL; Latest Image and Gallery did not update and no matching disposable prompt reached ComfyUI history.
- Blocked: the active disposable SillyTavern profile contained only two cards and no live group, so three-card group-scope behavior was not testable.

No source or version change was made. The image failure remains an unresolved SillyTavern/CCM boundary issue rather than a proved CCM defect. Final 1.0.0 remains unjustified.

## Image-gate correction and usability preflight — 2026-07-13 15:47 +10:00

- The earlier image result was a tester-procedure error: the matching character chat was not active.
- A read-only observed CCM generation then passed with NoobAI and `Noobai_locked.json`; Gallery increased from 2 to 3 and no settings were changed.
- The repository now checks active-chat context as soon as Image Prompt is clicked. With confirmation, CCM opens the matching SillyTavern character chat and continues the original request before contacting the AI provider or creating prompt history.
- The manifest remains `1.0.0-rc2`. The live three-card group-scope validation is the remaining final-promotion blocker.

## Final three-card group-scope validation — 2026-07-13

- Confirmed rc2 defect: group image prompt assembly never read `group.scene`, so member `location`/`area` overrode the saved shared scene.
- Corrected with a pure, non-mutating image-context helper using shared scene → group member → solo/base precedence for location and area only.
- Preserved group pose/state, solo prompt behavior, presets, stored continuity, and prompt/gallery scope.
- Added seven deterministic image-context/history regression tests; focused image/group suite 15/15 and full suite 246/246 pass.
- Full release validation passes with a deterministic 106-file artifact, digest `65405d962ec0ac50361edee560fbbf1ccf5ba488354acd988b42c9cc10a06b9d`, zero secret/privacy findings, and exact 106/106 artifact/install equality.
- Live rerun passed three-member initialization, shared-scene persistence, manual speaker and explicit-mention targeting, solo/group isolation, repeated scope switching, group-only knowledge/inventory, corrected group image context, unchanged solo image context, and duplicate/data-loss checks.
- Automatic speaker/mention and Auto State remain unverified because the disposable SillyTavern native chat API is disconnected; provider settings were not changed.

The working version remains `1.0.0-rc2`. A distinct `1.0.0-rc3` candidate is justified because rc2 contained the confirmed group-image defect. Final `1.0.0` remains blocked on the two automatic group gates.

## RC3 automatic promotion validation — 2026-07-13

- Connected only the disposable SillyTavern profile to the already configured credential-free 12B OpenAI-compatible model.
- Automatic speaker targeting passed: one generated Fixture Alpha reply produced exactly one Alpha group State update; Beta, Gamma, and every solo record remained unchanged.
- Automatic explicit mention passed after one corrected 12B generation: the labelled Alpha reply retained the exact name Fixture Gamma, and CCM updated only Alpha and Gamma group scopes. Beta and all solo scopes remained unchanged.
- Live Auto State isolation passed across Group Alpha → Solo Alpha → Group Alpha/Gamma. Solo and group hashes, histories, in-flight work, and usage attribution remained distinct; no request was duplicated or suppressed across scopes.
- The test exposed a CCM dashboard navigation defect: chat-dependent buttons used SillyTavern's previously active card. Start New Chat, Re-extract Facts, Update State, and Update Knowledge now share Image Prompt's active-chat warning/open-card preflight.
- The rebuilt correction passes 247/247 unit tests, 15/15 focused image/group tests, 6 browser passes with 3 optional skips, a 106-file verified artifact, zero privacy/secret/LF findings, exact 106/106 source/artifact/install equality, and zero CCM console errors.

All RC3 promotion gates now pass. Final `1.0.0` is technically justified but is not authorized by this task.
