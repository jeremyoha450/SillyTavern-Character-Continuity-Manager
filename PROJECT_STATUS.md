# CCM Current Status

**Updated:** 2026-07-13

**Manifest:** `1.0.0-rc1` (unchanged)

**Database / AI settings:** 5 / 7
**State:** repository hardening, LF reproducibility, fresh-clone validation, and artifact-only installed synchronization complete

## Verification

- `npm test`: 232 passed, 0 failed, 0 skipped.
- Production syntax and runtime JSON parsing: pass.
- Deterministic artifact: 104 runtime files.
- Fresh-clone source, artifact, and installed extension: 104/104 hashes match at both boundaries; none missing or different.
- Browser: 6 non-live checks passed and 3 provider-backed checks skipped.
- Health: CCM `1.0.0-rc1`, database 5, AI settings 7, SillyTavern 1.18.0; no browser console errors.

## Hardening completed

- Central text-only toast messages; guarded storage reads.
- Bounded JSON/PNG imports with signature/chunk/depth/count validation.
- Newest 200 image-history records retained per scope.
- Character-plus-scope automation counters and in-flight locks.
- 60-second direct-provider timeouts with distinct cancellation classification.
- Runtime artifact tooling, release exclusions, tests, and CI.

Database Inspector, AI Context Viewer, knowledge history, AI Benchmark, Recovery Tools, timeline, backup/restore UI, rollback, and separate image backend are not being developed here. Knowledge history is intentionally omitted. Training collection remains experimental, opt-in, and default-off.

The evidence now justifies an explicit rc2 version bump, but the manifest remains rc1 until separately authorized. Final 1.0.0 is not justified until the RC is validated.
