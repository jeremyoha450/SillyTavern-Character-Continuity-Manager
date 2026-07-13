# Test Coverage Report

**Updated:** 2026-07-12 after hardening

- Focused hardening command: 15 passed.
- Full `npm test`: 232 passed, 0 failed/skipped; about 1.0 seconds Node duration.
- Production syntax and manifest/package/schema/config JSON: pass.
- Artifact selection test: pass; 104 runtime files.
- Browser against synchronized install: 6 passed, 3 provider-backed skipped; hostile toast behavior included. Live-AI remains opt-in.

New behavior coverage includes hostile toast text, blocked storage, import size/signature/chunks/depth/counts, solo/two-group locks, timeout/cancellation, transport abort signals, image retention, and artifact exclusions.

Remaining gaps include full event/context-switch scheduling, non-abortable late SillyTavern responses, native save/group endpoints, real persistence, provider variants, and live workflows. Existing static checks should be supplemented incrementally.

## Group image-context regression — 2026-07-13

- Added seven behavior tests in `tests/image-context.test.mjs`.
- Proves shared group location and area override scoped member and solo values in the image-task input.
- Proves group member position, position detail, and expression survive the shared scene overlay.
- Proves blank shared fields fall back to the group member, then the solo/base record.
- Proves solo image continuity receives no group scene and image-context assembly mutates none of its inputs.
- Proves prompt history still writes only to the requested group-member scope.
- Focused image/group suite: 15/15 pass.
- Full `npm test`: 247/247 pass.
- Production syntax: 100 modules; browser: 6 pass and 3 optional live-provider checks skipped.
- Deterministic artifact: 106 runtime files, zero missing/extra/different.

The remaining coverage gap is now specifically the live `GENERATION_ENDED` path for automatic group speaker/mention targeting and Auto State. It could not run in the disposable profile while native SillyTavern chat remained disconnected.

## RC3 automatic and dashboard-preflight validation — 2026-07-13

- Live `GENERATION_ENDED` speaker, explicit-mention, solo/group scope, hash, and usage-attribution checks passed with the disposable 12B chat model.
- Added regression coverage proving every chat-dependent dashboard action is routed through the active-character-chat preflight.
- Full suite: 247/247; focused image/group suite: 15/15; browser: 6 passed and 3 optional live-provider checks skipped.
