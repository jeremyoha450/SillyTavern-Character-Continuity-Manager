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

## External validation — 2026-07-13

Disposable clean installation passed on SillyTavern 1.18.0 with correctly initialized database 5 / AI settings 7, no unexpected extension runtime files, and zero CCM console errors. The populated rc1-upgrade, solo, group, Character Creator native-save, provider-backed, and configured-image gates were not tested because isolated fixtures/configuration were unavailable and production data/settings were excluded. See `EXTERNAL_RC2_VALIDATION.md`. Remain at rc2; final 1.0.0 is not justified.

## External validation continuation — 2026-07-13

The populated synthetic rc1-to-rc2 upgrade passed with exact before/after preservation and zero duplicates. Character Creator navigation, validation, and native V3 save passed. Stored solo continuity displayed correctly. Provider-dependent solo/group updates, completed automatic tracking, provider-backed request validation, and image generation remain incomplete because no disposable provider or ComfyUI service was reachable. See `EXTERNAL_RC2_VALIDATION.md` for the comparison table and console classification. Remain at rc2; final 1.0.0 is not justified.

The corrected 4B provider was later reachable, but automatic extraction produced no usable record after exactly one corrective retry. ComfyUI was reachable, but no disposable workflow was configured in SillyTavern. These are incomplete provider/model and environment gates rather than proved CCM bugs. Remain at rc2; final 1.0.0 is not justified.

## Final-gate attempt — 2026-07-13 15:15 +10:00

The corrected 4B model subsequently passed a minimal five-field State update after the existing bounded corrective retry, with successful merge/history and correct provider/model attribution. The native V3 card also completed automatic Facts and Knowledge extraction with one CCM record and no duplicate. No 12B fallback was needed.

NoobAI prompt preview passed with positive and negative prompts using `Noobai_locked.json`, `NoobAI-XL-Vpred-v1.0`, and 512x512 generation; Flux was not tested. Image completion failed because SillyTavern returned no image URL before a matching disposable request appeared in ComfyUI history. The active profile also contained only two SillyTavern cards and no live group, so three-card group-scope validation could not run. Remain at rc2.

## Image-gate correction — 2026-07-13 15:47 +10:00

The prior image failure was a tester-procedure error caused by attempting generation outside the matching character chat. A subsequent read-only observed CCM demonstration used NoobAI with `Noobai_locked.json` successfully and increased Gallery from 2 to 3 without any settings change. The image gate passes. An unreleased preflight now offers to open the matching character chat before prompt generation begins. The live three-card group-scope gate remains outstanding, so final `1.0.0` is not yet justified.

## Final three-card group-scope validation — 2026-07-13

RC2 was confirmed to omit `group.scene` when building a group member's image-prompt continuity. The dashboard and image history passed `groupId` correctly, but member `location` and `area` were sent unchanged to the image task. The fix adds a pure image-context builder with shared scene → scoped member → solo/base precedence for location/area only, preserving member state, solo behavior, stored records, preset wording, and history/gallery scope.

Regression coverage proves shared location/area precedence, member pose/expression preservation, blank-scene and solo fallbacks, non-mutation, task input content, and group-only prompt history. Full validation passes: 100 production modules, 6 JSON files, 15/15 focused tests, 246/246 full tests, 6 browser passes with 3 optional live-provider skips, clean whitespace/diff, 106-file build/verify, zero credential-pattern findings, and exact 106/106 corrected artifact/install equality.

The live rerun passed initialization, scene persistence, manual A/B scope, manual Alpha→Gamma mention targeting, solo/group isolation, repeated scope switching, durable group knowledge/inventory isolation, corrected group image context, unchanged solo image context, duplicate prevention, and data safety. Automatic speaker/mention and Auto State were not demonstrated because the disposable SillyTavern native chat API remained disconnected and its settings were intentionally left untouched. No new CCM defect was proved.

Because rc2 contained a confirmed blocking group-image defect, `1.0.0-rc3` is the correct next candidate. The manifest remains `1.0.0-rc2`. Final `1.0.0` still requires the two live automatic group gates.
