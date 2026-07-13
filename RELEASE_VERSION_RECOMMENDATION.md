# Release Version Recommendation

**Date:** 2026-07-13

Recommendation now: **retain validated `1.0.0-rc3` until final-version authorization is given, then promote to `1.0.0` without feature changes**. RC2's group-image defect is fixed, the automatic group gates pass, and the dashboard active-chat navigation defect found during RC3 validation is fixed and revalidated.

The technical evidence justifies final **`1.0.0`**, but this task does not authorize that manifest change or a tag. Do not use `1.0.1` before final 1.0.0 exists.

Training Data Collection should remain in v1 at lowest risk: it is isolated, experimental, explicit opt-in, default-off, bounded, and tested. Removing it now would create unnecessary regression risk. Documentation must continue to state that captured records are candidates, CCM-AI is separate, and model training is not justified.
