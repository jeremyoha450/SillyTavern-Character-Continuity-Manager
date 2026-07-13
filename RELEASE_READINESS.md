# Release Readiness

**Updated:** 2026-07-13 — manifest `1.0.0-rc2`

Repository hardening and reproducibility blockers are fixed. CCM `1.0.0-rc2` passes the full local release validation, and source, artifact, and installed runtime match exactly across 104 files. Six non-live browser checks pass. RC2 is ready to distribute for external validation; final `1.0.0` still requires that validation.

Fixed: toast injection, blocked storage, card-import resource limits, unbounded image history, automation scope collisions, missing direct-provider timeout, release inclusion policy, and CI.

Deferred: safe manual cancellation for the SillyTavern active-model path; non-destructive knowledge size monitoring/deduplication. Knowledge is not silently pruned. Rejected/deferred UI features remain excluded.

Remaining gate: external RC validation, including a disposable provider-backed smoke check. Final 1.0.0 is not yet justified.
