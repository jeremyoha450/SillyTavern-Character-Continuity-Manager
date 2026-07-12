# Test Coverage Report

**Updated:** 2026-07-12 after hardening

- Focused hardening command: 15 passed.
- Full `npm test`: 232 passed, 0 failed/skipped; about 1.0 seconds Node duration.
- Production syntax and manifest/package/schema/config JSON: pass.
- Artifact selection test: pass; 104 runtime files.
- Browser against synchronized install: 6 passed, 3 provider-backed skipped; hostile toast behavior included. Live-AI remains opt-in.

New behavior coverage includes hostile toast text, blocked storage, import size/signature/chunks/depth/counts, solo/two-group locks, timeout/cancellation, transport abort signals, image retention, and artifact exclusions.

Remaining gaps include full event/context-switch scheduling, non-abortable late SillyTavern responses, native save/group endpoints, real persistence, provider variants, and live workflows. Existing static checks should be supplemented incrementally.
