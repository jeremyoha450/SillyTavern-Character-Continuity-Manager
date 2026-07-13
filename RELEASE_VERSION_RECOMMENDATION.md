# Release Version Recommendation

**Date:** 2026-07-13

Recommendation now: **publish validated `1.0.0` when tag and publication are separately authorized**. Final was prepared from the exact validated RC3 code without feature, prompt, schema, or production-behavior changes. RC2's group-image defect and the RC3 dashboard active-chat navigation defect are fixed and revalidated.

The complete technical promotion matrix passes for **`1.0.0`**. The recommended tag is `v1.0.0`; tagging and publication still require separate authorization. Future v1.0.x work is restricted to bug fixes and compatibility maintenance.

Training Data Collection should remain in v1 at lowest risk: it is isolated, experimental, explicit opt-in, default-off, bounded, and tested. Removing it now would create unnecessary regression risk. Documentation must continue to state that captured records are candidates, CCM-AI is separate, and model training is not justified.
