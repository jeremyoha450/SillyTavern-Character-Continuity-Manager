# Release Readiness

**Updated:** 2026-07-13 — manifest `1.0.0-rc3`

Repository hardening and reproducibility blockers are fixed. CCM `1.0.0-rc3` contains the validated group-image context correction and the generalized active-character-chat preflight. All automatic and manual promotion gates now pass in the disposable profile.

Fixed: toast injection, blocked storage, card-import resource limits, unbounded image history, automation scope collisions, missing direct-provider timeout, release inclusion policy, and CI.

Deferred: safe manual cancellation for the SillyTavern active-model path; non-destructive knowledge size monitoring/deduplication. Knowledge is not silently pruned. Rejected/deferred UI features remain excluded.

Remaining administrative gate: explicit authorization to change the manifest to final `1.0.0`. The technical promotion matrix is complete.

## External validation — 2026-07-13

Disposable clean installation passed on SillyTavern 1.18.0: CCM loaded with a clean database/settings store, launcher/dashboard/settings/Health worked, no unexpected runtime files appeared, and no CCM console errors occurred. The populated rc1 upgrade, solo/group flows, Character Creator native save, provider-backed request, and configured image workflow were not tested because no isolated fixtures/configuration were available and production data/settings were excluded. Remain at rc2; final 1.0.0 is not justified.

## External validation continuation — 2026-07-13

A synthetic populated rc1 profile upgraded to rc2 with exact preservation of 3 characters, 1 three-member CCM group, facts/state, 3 knowledge entries, inventory, 6 locks, automation hashes, 3 image/prompt-history records, custom image values, group scene, provider/model/preset selection, and usage totals. Native V3 card creation also saved successfully in SillyTavern. Solo live updates, live group behavior, completed provider-dependent automatic tracking, a provider-backed request, and image generation remain untested because no disposable provider or ComfyUI service was reachable. Remain at rc2; final 1.0.0 is not justified.

The corrected 4B endpoint was subsequently reachable, but its automatic card extraction exhausted the single corrective retry without producing usable structured output. ComfyUI was reachable, but the isolated SillyTavern profile had no disposable workflow mapping. Provider and image success gates remain incomplete; final 1.0.0 is not justified.

## Final-gate attempt — 2026-07-13 15:15 +10:00

Provider-backed validation and Character Creator automatic tracking now pass on the credential-free 4B model. The minimal State update merged five changes and recorded history with correct attribution; the native V3 card produced one CCM record plus initial Facts and Knowledge without duplicates.

Promotion remains blocked. A correctly matched NoobAI preview succeeded, but SillyTavern returned no image URL and no matching disposable request appeared in ComfyUI history. The disposable SillyTavern profile also lacked the required live three-card group. The image-boundary failure is unresolved and is not yet classified as a proved CCM defect. Final 1.0.0 is not justified.

## Image-gate correction — 2026-07-13 15:47 +10:00

The earlier image failure was caused by testing outside the matching character chat, not by CCM or ComfyUI. A read-only observed CCM run generated successfully with NoobAI and `Noobai_locked.json`; Gallery increased from 2 to 3 with no settings changes. The image gate now passes. An unreleased active-chat preflight has also been added without changing the manifest version. Final `1.0.0` remains blocked only by the live three-card group-scope gate.

## Final three-card group-scope validation — 2026-07-13

External testing confirmed a blocking rc2 defect: group image prompts ignored saved shared location/area and used the member record's scene fields. The corrected image-only context now applies non-empty shared scene location/area over group-member values, then uses solo/base values only as the final fallback. It does not mutate records or alter member-specific pose/state, solo prompts, preset wording, or group prompt/gallery storage.

All local/release validation passes at 246 unit tests and 106 deterministic runtime files. The corrected disposable install matches the artifact 106/106. The complete rerun passed all available manual, isolation, rapid-switching, durable-data, duplicate, and group/solo image-context checks. No CCM-attributable blocking console error remained.

Automatic speaker/mention targeting and Auto State remain unproved because the disposable native SillyTavern chat provider is disconnected and its settings were deliberately preserved. Accordingly, the correction justifies a distinct `1.0.0-rc3` candidate, not final `1.0.0`. No version change has been made.

## RC3 automatic gates and dashboard preflight — 2026-07-13

The disposable 12B chat model produced real labelled group replies. Alpha-only speaker targeting created exactly one Alpha group update. A corrected explicit-name reply targeted Alpha plus Fixture Gamma while Beta and all solo scopes remained unchanged. A live solo Alpha update followed by a group Alpha update proved that character-plus-group in-flight keys and hashes do not collide or suppress one another. Usage records were attributed to the correct character, task, provider, and model.

The sequence exposed one CCM defect: dashboard chat actions could act on SillyTavern's previously selected card when the dashboard displayed a different CCM record. The shared active-chat preflight now guards Start New Chat, Re-extract Facts, Update State, and Update Knowledge as well as Image Prompt. Live cancellation showed the action-specific warning before any request; confirmation selected Fixture Alpha and reached SillyTavern's native new-chat confirmation for that card. No provider call occurred during the preflight checks and no CCM console error remained.

The post-fix release rerun passes 247/247 unit tests, 15/15 focused tests, 6 browser passes with 3 optional skips, 106-file build/verify, privacy/secret/LF scans, and exact 106/106 installed equality. Final `1.0.0` is technically justified, subject to separate authorization.
