# Fresh-Clone Validation

**Date:** 2026-07-13
**Validated commit:** `612e5d035ecc3d445f93acfa38d01db3a4debd82`
**Clone:** brand-new non-local clone, detached at the exact commit

## Validation results

- `npm ci`: passed; 3 packages installed.
- `npm run check:syntax`: passed; 98 production modules.
- `npm run check:json`: passed; 5 repository JSON files.
- `npm run check:whitespace`: passed.
- `npm test`: passed; 232/232.
- `npm run test:browser`: passed; 6 non-live checks, 3 provider-backed checks skipped by design.
- `git diff --check`: passed.
- `node tools/release.mjs build`: passed; 104 runtime files.
- `node tools/release.mjs verify`: passed; 0 missing, extra, or different.
- Artifact secret/privacy pattern scan: passed; no findings.

The release artifact was built in this clone and was the only source used to synchronize the installed extension. SillyTavern user data and settings were outside the runtime allowlist and were preserved.

## Equality result

| Comparison | Matching | Missing | Different |
| --- | ---: | ---: | ---: |
| Fresh-clone source to artifact | 104/104 | 0 | 0 |
| Fresh-clone artifact to install | 104/104 | 0 | 0 |

Source, artifact, and install have the same aggregate per-file hash-set digest: `06dc673386dc32a5d6b3f7ddb4df4401c6ba19cd42c187a276604bceea5232a4`.
