# Release Version Recommendation

**Date:** 2026-07-12

Recommendation now: **remain at `1.0.0-rc1`** until the dirty tree is intentionally reviewed and committed. Repository hardening, 232 tests, exact installed hashes, Health, and six non-live browser checks pass.

After repository review, use **`1.0.0-rc2`** for one externally testable release candidate. Provider-backed manual smoke should use a clearly disposable local record. Promote that identical artifact to final **`1.0.0`** only after RC validation. Do not use `1.0.1` before a final 1.0.0 exists.

Training Data Collection should remain in v1 at lowest risk: it is isolated, experimental, explicit opt-in, default-off, bounded, and tested. Removing it now would create unnecessary regression risk. Documentation must continue to state that captured records are candidates, CCM-AI is separate, and model training is not justified.
