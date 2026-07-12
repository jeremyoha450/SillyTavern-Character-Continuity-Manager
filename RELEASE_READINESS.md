# Release Readiness

**Updated:** 2026-07-12 — manifest `1.0.0-rc1` unchanged

Repository hardening blockers are fixed, 232 tests pass, all 104 installed runtime hashes match, and six non-live browser checks pass. CCM is not yet ready for final 1.0.0 because the materially dirty tree still needs an intentional commit/review and provider-backed manual smoke was not run.

Fixed: toast injection, blocked storage, card-import resource limits, unbounded image history, automation scope collisions, missing direct-provider timeout, release inclusion policy, and CI.

Deferred: safe manual cancellation for the SillyTavern active-model path; non-destructive knowledge size monitoring/deduplication. Knowledge is not silently pruned. Rejected/deferred UI features remain excluded.

Remaining gates: review and commit the intended tree from a clean branch/clone, then optionally run provider-backed manual smoke on a clearly disposable local setup. The artifact is suitable for rc2 testing after that repository review; final 1.0.0 is not yet justified.
