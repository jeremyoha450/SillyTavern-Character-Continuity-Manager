# Release Readiness

**Updated:** 2026-07-13 — manifest `1.0.0-rc1` unchanged

Repository hardening and reproducibility blockers are fixed. A brand-new clone of commit `612e5d035ecc3d445f93acfa38d01db3a4debd82` passed all checks, and fresh-clone source, artifact, and installed runtime match exactly across 104 files. Six non-live browser checks pass. An explicit `1.0.0-rc2` bump is now justified; final `1.0.0` still requires RC validation.

Fixed: toast injection, blocked storage, card-import resource limits, unbounded image history, automation scope collisions, missing direct-provider timeout, release inclusion policy, and CI.

Deferred: safe manual cancellation for the SillyTavern active-model path; non-destructive knowledge size monitoring/deduplication. Knowledge is not silently pruned. Rejected/deferred UI features remain excluded.

Remaining gates: explicit authorization for the manifest/version bump, then external RC validation. Provider-backed manual smoke remains recommended on a clearly disposable local setup. Final 1.0.0 is not yet justified.
