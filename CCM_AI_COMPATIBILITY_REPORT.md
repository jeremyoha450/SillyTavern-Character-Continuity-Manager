# CCM-AI Compatibility Report

**Audit date:** 2026-07-12 +10:00
**CCM-AI path:** `C:\Code\CCM-AI`
**Git:** no repository metadata found
**Test result:** `python -m pytest -q` → 11 passed in 0.29 seconds

## Current pipeline

### Complete and tested

- Import of top-level `ccm-training-data-v1` exports (`tools/import_ccm_export.py`).
- Shape/task validation and validation reports (`common.py`, `validate_records.py`).
- Malformed-record quarantine with reasons rather than silent dropping.
- Recursive recognizable-secret redaction plus redaction reports (`redact_dataset.py`).
- Filters for task, parse success, retry count, provider/model, parsed output, failures, and correction status.
- Conversion to normalized JSONL with messages, raw target, parsed target, and metadata (`convert_dataset.py`).
- Deterministic train/validation/test splitting grouped by character/scope/group (`split_dataset.py`).
- Basic leakage prevention for identical group keys.
- Four evaluation fixtures (facts, state, knowledge update, image prompt) and an offline schema/field baseline evaluator.
- Python packaging metadata in `pyproject.toml`; pytest/jsonschema dependencies and console entry points are defined.
- Documentation for data format, privacy, evaluation and training plan.

### Partial

- Redaction is pattern-based and cannot certify anonymity or remove private roleplay content.
- Leakage prevention groups exact identifiers only; aliases, copied conversations, and near duplicates can cross splits.
- Evaluator measures JSON/schema/field coverage and exact values but not semantic correctness, hallucination, state transition quality, safety, or regression history.
- Quarantine is file-based; there is no review/reintegration workflow.
- Provenance is limited to exported provider/model/source/IDs and input path; it is not a full dataset manifest.

### Placeholders/missing

- `training/configs/README.md` and `training/scripts/README.md` are explicit placeholders; no training is implemented.
- No dataset version/revision metadata beyond format names.
- No quality grading, human approval/correction UI, gold-target construction, adjudication, or inter-reviewer process.
- No exact dataset deduplication or near-duplicate detection.
- No task balancing or sampling report.
- No canonical/versioned benchmark dataset or evaluation report history.
- No reproducibility manifest for tool version, source hashes, environment, command, seed beyond split report, or final dataset hash.
- No licensing, consent, retention, deletion-request, or privacy-risk metadata.
- No robust PII anonymization.

## CCM export compatibility

The implemented CCM export and CCM-AI’s `DATA_FORMAT.md`, importer, and tests agree on `ccm-training-data-v1` and these 17 fields: id, timestamp, taskId, provider, source, model, characterId, scope, group, inputMessages, rawAIResponse, parsedOutput, parseSuccess, retryCount, errorDetails, and userCorrectionStatus. Supported task IDs also match exactly.

The normalized converter preserves characterId/scope/group inside metadata, so the split grouping code can prevent exact-identifier leakage. Raw AI response becomes `target`; parsed output becomes `parsedTarget`, matching `DATA_FORMAT.md`.

## Quality mismatch

Mechanical compatibility should not be confused with training readiness:

- CCM always records `userCorrectionStatus: "unknown"`; there is no path to approve/reject/correct it.
- Successful model output—not a reviewed correction—is the training target.
- Failed parses may be imported and filtered, but attempt-level retry pairs are not separately represented.
- No merge outcome, user edit, downstream acceptance, or task-specific quality score establishes correctness.
- Character/group identifiers may be empty or inconsistent because callers provide metadata unevenly.
- Data may contain private copyrighted/licensed character and chat material without rights metadata.

Therefore the export contains enough fields to form syntactically valid supervised examples, but not enough evidence that targets are correct, representative, non-duplicated, appropriately licensed, or safe to train on.

## Recommendation

CCM-AI is ready for **controlled candidate-data collection, validation, quarantine, conversion, and offline pipeline development**. It is **not ready to justify model training**. Next gates are: human-approved corrected targets; dataset/version/provenance/privacy metadata; exact and near deduplication with leakage tests; task balance and quality grading; and a versioned benchmark with stored evaluation history.
