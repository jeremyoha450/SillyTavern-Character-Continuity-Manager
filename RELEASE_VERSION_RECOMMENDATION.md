# Release Version Recommendation

**Date:** 2026-07-13

Recommendation now: **distribute `1.0.0-rc2` for a short external/disposable validation period**. Repository hardening is committed, the LF policy makes Windows checkouts reproducible, the full local validation sequence passes, and source/artifact/install match 104/104 with no differences.

Do not promote to final **`1.0.0`** until RC2 has completed external validation. Provider-backed manual smoke should use a clearly disposable local record. Do not use `1.0.1` before a final 1.0.0 exists.

Training Data Collection should remain in v1 at lowest risk: it is isolated, experimental, explicit opt-in, default-off, bounded, and tested. Removing it now would create unnecessary regression risk. Documentation must continue to state that captured records are candidates, CCM-AI is separate, and model training is not justified.
