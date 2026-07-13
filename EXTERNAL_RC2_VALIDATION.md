# External/Disposable RC2 Validation

**Run:** 2026-07-13 12:54 +10:00
**CCM version:** `1.0.0-rc2`
**RC2 commit:** `7887ee270c136d65c38197e86c77ee6c9b2f63aa`
**Artifact digest:** `c0f78640746c48727a8c43c5f46453723e6a6f426a6be5b4f3e1ea22be197a46`
**SillyTavern:** `1.18.0`, release revision `51ad27fb8`

## Environments

- Clean install: new temporary SillyTavern data root `ccm-rc2-external-fresh`, localhost-only port 8011, generated cookie secret, no copied production settings or data. The instance was stopped after validation.
- RC1 upgrade: not created. No disposable populated rc1 fixture was available, and production data was not copied.

## Result matrix

| Scenario | Result | Evidence |
| --- | --- | --- |
| Fresh installation | Pass | Artifact installed into an empty data root; extension loaded; launcher, dashboard, Settings, and Health opened. |
| Initial CCM storage | Pass | Database 5 and AI settings 7 were created with 0 characters/groups, migration flags set, and Training Data Collection off. |
| Runtime-directory purity | Pass | Exactly the approved root entries plus `config/` and `scripts/`; no unexpected files created. |
| Health | Pass | CCM rc2, database 5, AI settings 7, SillyTavern 1.18.0. |
| RC1 to RC2 populated upgrade | Not tested | No disposable populated rc1 profile was available. |
| Solo continuity | Not tested | No disposable provider-backed character fixture was created. |
| Group continuity | Not tested | No disposable three-card group fixture was created. |
| Character Creator native save | Not tested | Requires a fuller interactive disposable fixture. |
| Provider-backed request | Not tested | Clean profile correctly reported no provider/model selected; production provider settings were not copied. |
| Configured image workflow | Not tested | Clean profile correctly reported SillyTavern Image Generation unconfigured; production image settings were not copied. |
| Blocked localStorage | Pass in automated rc2 suite | Covered by the validated automated test, not repeated manually in this run. |
| Runtime hash equality | Pass before external run | RC2 source/artifact/install equality remains 104/104 with the recorded digest; no runtime content was edited. |

## Exact workflow performed

1. Created a new temporary SillyTavern data root with no previous CCM installation.
2. Installed the 104-file rc2 artifact into that root only.
3. Started SillyTavern 1.18.0 on localhost port 8011 with the isolated data root.
4. Completed only the new-profile persona prompt using the disposable default persona.
5. Verified launcher, empty CCM dashboard, Settings, Health, initial storage, and extension-directory contents.
6. Captured browser console errors/warnings and stopped the isolated server.

## Console and storage findings

- CCM-attributable browser console errors: 0.
- CCM-attributable warnings: 0.
- SillyTavern warnings: Story String defaults added and repeated `Settings not ready, scheduling another save` messages during first-run initialization. These are classified as SillyTavern first-run behavior, not a CCM defect.
- Provider errors: none; no provider was configured.
- Migration/storage warnings attributable to CCM: none.
- Initial CCM database/settings were persisted correctly in the disposable profile: database 5, AI settings 7, zero records, Training Data Collection off.
- No characters, chats, images, providers, groups, or existing settings were available to test preservation in this clean profile.

## Bugs and fixes

No blocking or non-blocking CCM bug was found. No source, runtime, prompt, or version fix was made.

## Remaining risks and recommendation

The rc1 populated-upgrade, solo, group, Character Creator native-save, provider-backed, and configured-image gates remain untested. The decision rule therefore does not permit promotion to final `1.0.0`. Remain at rc2 until those scenarios pass in disposable environments. If a blocking defect appears, fix it in rc3 rather than promoting rc2.

## Continuation — 2026-07-13 13:30 +10:00

### Environment

- A second isolated SillyTavern 1.18.0 data root, `ccm-rc1-upgrade-fixture`, ran on localhost port 8012.
- CCM rc1 was built from documentation HEAD `e76efc55d690055b8008e15f9333917a39973e22` and installed as exactly 104 runtime files.
- The profile was seeded with synthetic data only. No production characters, chats, images, credentials, provider settings, or user data were copied.
- Provider availability checks: local Ollama unavailable; local ComfyUI unavailable. A deliberately unreachable credential-free synthetic OpenAI-compatible endpoint and model `fixture-model` were stored only to test settings preservation.

### Populated rc1 upgrade comparison

| Value | Before rc2 | After rc2 |
| --- | ---: | ---: |
| Characters | 3 | 3 |
| Groups | 1 | 1 |
| Group members | 3 | 3 |
| Knowledge entries | 3 | 3 |
| Inventory entries | 3 | 3 |
| Image/prompt-history entries | 3 | 3 |
| History entries | 3 | 3 |
| Locked fields | 6 | 6 |
| Usage requests | 3 | 3 |
| Input/output tokens | 120 / 60 | 120 / 60 |

Facts/state values, automation flags and hashes, custom image values, group scene `Disposable Lab / Test Bay / fixture-scene`, provider `openai-compatible`, model `fixture-model`, and selected preset `noobai` were identical after replacing only the runtime files and reloading. Health reported rc2 / database 5 / AI settings 7 / SillyTavern 1.18.0. There were zero duplicate character IDs and no CCM console errors during the upgrade/Health check.

### Continued workflow matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Populated rc1 to rc2 upgrade | Pass | All recorded counts and important values preserved exactly; no destructive migration or duplicates. |
| Solo continuity | Partial | Existing disposable solo dashboard, facts/state summary, locks, inventory, knowledge, history, image/prompt history, automation settings, and usage displayed. Provider-backed updates and automatic thresholds were not run. |
| Group continuity | Not tested | Synthetic CCM group data survived, but no corresponding three-card SillyTavern group fixture was available for speaker/mention/live-scope actions. |
| Character Creator native save | Partial pass | Creator opened, navigation and validation passed, and a native V3 PNG named `Disposable V3 Native Save.png` was created and reloaded. Automatic CCM extraction/tracking could not complete without a reachable provider. Avatar generation was not configured. |
| Provider-backed request | Not tested | No disposable provider service was reachable. The synthetic endpoint failed safely with a categorized network error and exposed no credential. |
| Image workflow | Not tested | No disposable ComfyUI/Image Generation service was reachable or configured. |

### Console classification

- Upgrade/Health: no CCM errors or warnings.
- Character activation: categorized `OpenAI Compatible: CCM could not reach the AI provider` errors from the deliberately unreachable synthetic endpoint. Classified as provider/environment issues, not CCM defects.
- No API key, secret, or private content appeared in errors.
- No blocking CCM bug was proved and no fix was made.

### Final recommendation after continuation

Remain at rc2. The populated upgrade gate passes, but live solo/group updates, completed automatic tracking after native save, one provider-backed request, and one configured image workflow still fail the decision rule by remaining untested. Final `1.0.0` is not justified.

## Service-assisted continuation — 2026-07-13

- The corrected credential-free CCM endpoint `http://192.168.15.5:5002` advertised `koboldcpp/gemma-4-E4B-it-uncensored-Q4_K_M`.
- ComfyUI `0.22.0` at `http://192.168.15.5:8188` was reachable, but the disposable SillyTavern profile had no workflow JSON/mapping configured. No production image settings were copied.
- A mistaken first endpoint on port 5001 advertised the 12B model and timed out after 60 seconds; timeout cleanup removed the wait layer. It was replaced with the corrected endpoint.
- The corrected 4B automatic card extraction reached the provider and made exactly two attempts. Usage increased from 5 to 7 requests, proving the malformed-output retry remained bounded to one corrective retry. It did not return a usable structured character record, so automatic CCM tracking did not complete.
- No credentials were configured or exposed. The 4B failure is classified as provider/model structured-output behavior, not a proved CCM implementation defect.
- A second automatic extraction began when CCM was reopened; the isolated server was stopped to avoid unnecessary token use.

The provider-backed success and configured-image success gates therefore remain failed/not completed. Final `1.0.0` remains unjustified.

## Final-gate attempt — 2026-07-13 15:15 +10:00

- Provider-backed State: passed with `openai-compatible` and `koboldcpp/gemma-4-E4B-it-uncensored-Q4_K_M`. A five-field disposable State update completed after the existing single corrective retry, merged successfully, and created one history entry. Statistics attributed two State attempts to the correct provider/model; no unbounded or duplicate logical request was observed.
- Character Creator follow-up: passed. The native V3 PNG remained present after reload. Automatic tracking completed once, with one CCM record, one Facts request, one Knowledge request, and one initial knowledge item. The dashboard opened correctly and the character list contained no duplicate V3 record.
- Image workflow: failed. SillyTavern Image Generation connected to ComfyUI `0.22.0` at `192.168.15.5:8188`. CCM NoobAI was matched to `Noobai_locked.json`, model `NoobAI-XL-Vpred-v1.0`, at 512x512; Flux was not tested. The preview contained positive and negative prompts and Prompt History increased to one, but the `/sd` result contained no image URL. Latest Image and Gallery remained empty, and a privacy-safe ComfyUI history search found no request containing the disposable prompt marker. This is an unresolved SillyTavern/CCM image-boundary blocker, not yet a proved CCM implementation defect.
- Live group scope: not run. The active disposable SillyTavern profile exposed only two cards and no live group, despite the preserved synthetic CCM group data. The required three-card SillyTavern group fixture was therefore unavailable.
- Console/data review: no credential or private production content was used or exposed by CCM. The expected SillyTavern warning about no Horde model occurred when inserting the disposable chat sentence; it is unrelated to the direct CCM provider. No source, prompt, schema, manifest, or version change was made.

Final `1.0.0` is not justified. The configured-image success and live three-card group gates remain open.

## Image-gate correction — 2026-07-13 15:47 +10:00

- The earlier image result was invalidated by a tester-procedure error: generation had been attempted without the matching character chat active.
- In a read-only observed demonstration, CCM generated through NoobAI with the existing `Noobai_locked.json` workflow and the Gallery increased from 2 to 3. No settings were changed during the demonstration.
- The configured-image gate therefore passes. No CCM image-backend defect was found.
- CCM now has an unreleased usability preflight that asks to open the matching character chat before it contacts the prompt provider or creates prompt history. The manifest remains `1.0.0-rc2`.

The live three-card group-scope gate is the remaining final-promotion blocker.

## Final three-card group-scope validation — 2026-07-13

### Confirmed rc2 defect and correction

The disposable `RC2 Final Trio` exposed a blocking rc2 defect. A group-scoped NoobAI prompt for Fixture Alpha used the group member's `Disposable Lab` location instead of the saved shared scene `Clocktower Library / Upper Reading Hall`. The group dashboard and image-history routing passed `groupId` correctly, but image continuity assembly read only the scoped member facts and never read `group.scene`; shared `area` had the same defect. Shared scene notes remain outside the existing image-prompt input model, so prompt wording was not expanded.

The correction moves image continuity assembly into a pure helper. For group image prompts only, `location` and `area` now resolve as non-empty shared scene, then group member, then solo/base fallback. Member pose, expression, hands, clothing, accessories, and other state remain group-scoped. The helper constructs new output objects and never writes the effective scene back to solo, member, or group data. Solo prompt behavior and group prompt/history/gallery storage are unchanged.

Changed production files: `scripts/image-context.js` and `scripts/ui/image-prompt.js`. Regression coverage: `tests/image-context.test.mjs`. The working tree also retains the separately documented unreleased active-chat preflight in `scripts/image-chat-context.js`, `scripts/ui/image-prompt.js`, and `tests/image-chat-context.test.mjs`. The manifest remains `1.0.0-rc2`.

### Corrected artifact and validation

- `npm ci`: pass, 3 packages.
- Syntax: pass, 100 production modules.
- JSON: pass, 6 files.
- Whitespace and `git diff --check`: pass.
- Focused image/group suite: 15/15 pass.
- Full unit suite: 246/246 pass.
- Browser suite: 6 pass, 3 optional live-provider checks skipped.
- Release build/verify: 106 files, zero missing/extra/different, digest `65405d962ec0ac50361edee560fbbf1ccf5ba488354acd988b42c9cc10a06b9d`.
- Artifact credential/privacy scan: 106 files scanned, zero findings.
- Corrected artifact to disposable install: 106/106 match, zero missing/different.

### Live rerun matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Initialization | Pass | Group `1783926574835` resolved Fixture Alpha/Beta/Gamma as exactly three enabled members and three member scopes; exactly three matching solo records and no duplicates. |
| Shared scene | Pass | `Clocktower Library / Upper Reading Hall / Rain outside; all three characters are present.` survived artifact replacement, reload, dashboard exit/reopen, and rapid switching. |
| Manual A scope | Pass | Alpha remained group-scoped; its manual update created one expected no-change history record without changing the solo record. |
| Manual B speaker | Pass | Beta's new labelled reply changed only Beta group state/history: sitting to standing, both hands to sides; solo Beta stayed unchanged. |
| Manual explicit mention | Pass | Alpha's labelled reply naming Fixture Gamma targeted Alpha and Gamma through the manual path. Gamma became kneeling beside the hearth with the brass key in the right hand. Beta received no mention-path history entry. |
| Automatic speaker/mention | Not demonstrated | The disposable SillyTavern chat remained intentionally `Not connected to API!`. No provider settings were altered, so no real `GENERATION_ENDED` event was available. |
| Solo/group isolation | Pass | All three solo fact hashes, knowledge, inventory, and history remained unchanged. One deliberate solo Alpha prompt-history entry was added solely to verify the solo location fallback. |
| Rapid switching | Pass | Repeated Group → Solo A/B/C → Group loops always showed the correct heading and scope label; shared scene and three-member dashboard remained intact. |
| Auto State isolation | Not demonstrated | Alpha and Beta group thresholds were set to Every Reply, but the disconnected native SillyTavern generator could not produce the required event. Stored automation hashes did not change. This is a test-setup limitation, not a proved CCM defect. |
| Group knowledge/inventory | Pass | Beta group knowledge remains 2 versus solo 1; Gamma group inventory remains 2 versus solo 1. Values persisted after reload with no duplicate entries. |
| Group image context | Pass | Corrected Alpha prompt contains `clocktower library`, `upper reading hall`, standing/smiling and group pose details; it no longer uses `disposable lab` as the active group scene. Group Prompt History increased only under Alpha's group scope. |
| Solo image context | Pass | A separate solo Alpha prompt contains `disposable lab` and contains neither shared group location nor area. |
| Data safety | Pass | Zero duplicate records/scopes, zero unintended solo fact changes, zero group reset, and zero data loss. |

### Before/after comparison

| Character | Solo scope / group scope | Solo fact hash before/after | Group fact hash before → after | Knowledge solo/group | Inventory solo/group | History solo before → after / group before → after | Prompt history solo before → after / group before → after |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| Alpha | `fixture-a` / `fixture-a::group:1783926574835` | `8997889a48b024c2` unchanged | `86174dbdbc3ae883` unchanged | 1 / 1 | 1 / 1 | 1 → 1 / 2 → 3 | 1 → 2 / 1 → 2 |
| Beta | `fixture-b` / `fixture-b::group:1783926574835` | `df4761b8e57bb3de` unchanged | `dc9ed89b3a01fd32` → `126b59c96fb6cdda` | 1 / 2 | 1 / 1 | 1 → 1 / 1 → 2 | 1 → 1 / 0 → 0 |
| Gamma | `fixture-c` / `fixture-c::group:1783926574835` | `4b66bf16d8ea6250` unchanged | `95f08a292df5f17f` → `b1b9342c402b328a` | 1 / 1 | 1 / 2 | 1 → 1 / 1 → 2 | 1 → 1 / 0 → 0 |

### Console classification and recommendation

- SillyTavern behavior: three transient `Settings not ready, scheduling another save` warnings after reload.
- Browser automation artifact: three `prompt() is not supported` errors caused when automation clicked the native Add Knowledge control. The durable fact was instead validated through the provider-backed/manual path; no application data was lost.
- Provider/model: none during the corrected group/solo prompt checks.
- CCM blocking errors after the correction: none.
- Test setup: automatic speaker/mention and Auto State could not be demonstrated without changing the deliberately disconnected SillyTavern AI settings.

The confirmed rc2 group-image context defect means rc2 must not be promoted unchanged. A `1.0.0-rc3` candidate is justified after this correction and full validation, but the version has not been changed. Final `1.0.0` is not yet justified because automatic speaker/mention targeting and live Auto State scope remain undemonstrated in this disposable profile.

## RC3 continuation — automatic gates and dashboard navigation — 2026-07-13

RC2 history above remains authoritative for the failed candidate. Under RC3, the disposable 12B SillyTavern model generated real labelled replies and the configured CCM provider completed structured State extraction. Alpha-only speaker targeting updated Alpha group scope once. A corrected explicit-name reply updated Alpha and Fixture Gamma group scopes only. Beta and all solo scopes remained unchanged. A subsequent live Solo Alpha → Group Alpha sequence produced independent hashes and histories in both scopes with correct usage attribution and no suppression or duplicate request.

The scope-switch sequence exposed a dashboard navigation defect: Start New Chat used SillyTavern's previously selected card when a different CCM record was displayed. The fix applies Image Prompt's early active-chat warning/open-card flow to Start New Chat, Re-extract Facts, Update State, and Update Knowledge. All four warnings were observed outside the matching chat; cancellation caused no request, and confirmation selected Fixture Alpha before reaching SillyTavern's native new-chat confirmation.

Post-fix validation passes 247/247 unit tests, 15/15 focused tests, 6 browser passes with 3 optional skips, a verified 106-file artifact with digest `3b06030a18e7972544b36a7345ae3cbe1b2c4dd5a99cc1f65b2b11ba94834609`, zero privacy/secret/LF findings, exact 106/106 artifact/install equality, and zero CCM console errors. Final `1.0.0` is technically justified, subject to separate authorization.
