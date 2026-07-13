# Release Version Recommendation

**Date:** 2026-07-13

Recommendation now: **authorize an explicit `1.0.0-rc2` bump**. Do not perform it without separate approval. Repository hardening is committed, the LF policy makes Windows checkouts reproducible, a new exact-commit clone passed the full validation sequence, and source/artifact/install match 104/104 with no differences.

Use **`1.0.0-rc2`** for one externally testable release candidate. Provider-backed manual smoke should use a clearly disposable local record. Promote the validated RC to final **`1.0.0`** only after RC validation. Do not use `1.0.1` before a final 1.0.0 exists.

Training Data Collection should remain in v1 at lowest risk: it is isolated, experimental, explicit opt-in, default-off, bounded, and tested. Removing it now would create unnecessary regression risk. Documentation must continue to state that captured records are candidates, CCM-AI is separate, and model training is not justified.
