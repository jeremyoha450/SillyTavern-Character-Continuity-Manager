# CCM 1.0.0-rc2 Validation

**Version:** `1.0.0-rc2`
**Version commit:** `7887ee270c136d65c38197e86c77ee6c9b2f63aa`
**Date:** 2026-07-13

## Commands and results

- `npm ci`: passed; 3 packages installed.
- `npm run check:syntax`: passed; 98 production modules.
- `npm run check:json`: passed; 6 repository JSON files.
- `npm run check:whitespace`: passed.
- `npm test`: passed; 234/234, including two new active-version consistency checks. The hardening baseline remains 232/232.
- `npm run test:browser`: passed; 6 non-live tests, with 3 optional provider-backed tests skipped as instructed.
- `git diff --check`: passed.
- `node tools/release.mjs build`: passed; 104 approved runtime files.
- `node tools/release.mjs verify`: passed; 0 missing, 0 extra, 0 different.
- Secret/privacy scan: passed; no findings.
- Artifact LF scan: passed; zero CRLF files.

## Installed synchronization and Health

The pre-sync comparison found 102 matching files, 0 missing, and the two expected rc2 differences (`README.md` and `manifest.json`). Synchronization copied only the 104 approved artifact files. Two legacy development-only extras (`.gitignore` and `package.json`) were removed from the extension root; they were not runtime files or SillyTavern user data/settings.

After reload, Health reported:

- CCM `1.0.0-rc2`.
- Database schema `5`.
- AI settings schema `7`.
- SillyTavern `1.18.0`.
- No browser console errors.

## Runtime equality

| Comparison | Matching | Missing | Different | Extra |
| --- | ---: | ---: | ---: | ---: |
| Repository source to rc2 artifact | 104/104 | 0 | 0 | 0 |
| RC2 artifact to installed extension | 104/104 | 0 | 0 | 0 |

Repository source, artifact, and installed extension share aggregate digest `c0f78640746c48727a8c43c5f46453723e6a6f426a6be5b4f3e1ea22be197a46`.

## Known optional checks

The three provider-backed browser flows remain skipped. They require an explicitly configured disposable continuity record and provider/image workflow.

## External-validation checklist

- Fresh installation.
- Upgrade from rc1.
- Solo continuity.
- Group continuity.
- Character Creator native save.
- One configured provider-backed State or Knowledge request using disposable data.
- One configured image workflow using disposable data.
- Confirm no user-data loss.
- Confirm no browser console errors.

Final `1.0.0` remains blocked until this external RC validation is complete.
