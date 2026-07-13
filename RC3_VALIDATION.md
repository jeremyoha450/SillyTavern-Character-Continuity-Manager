# RC3 Validation

**Validated:** 2026-07-13 +10:00

**Version:** `1.0.0-rc3`

**Version commit:** `d11028843827fec2650d11eea80e3fb7b73b14c6` (`chore(release): bump CCM to 1.0.0-rc3`)

**Disposable SillyTavern:** `1.18.0`, database 5, AI settings 7

**Release artifact digest:** `3b06030a18e7972544b36a7345ae3cbe1b2c4dd5a99cc1f65b2b11ba94834609`

## Scope and safety

Validation used only the disposable SillyTavern profile on localhost port 8012 and its synthetic Fixture Alpha, Beta, and Gamma data. The configured credential-free CCM 4B endpoint was used for structured extraction, and the disposable SillyTavern 12B endpoint was used for labelled chat replies. No production profile, character, chat, image, provider setting, or user data was accessed or changed. Flux was not tested.

## Automatic promotion gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Automatic speaker targeting | Pass | A generated Fixture Alpha reply produced one Alpha group State update. Beta, Gamma, and all solo records remained unchanged. |
| Explicit Alpha-to-Gamma mention | Pass | After one corrected 12B reply retained the exact name `Fixture Gamma`, CCM updated Alpha and Gamma group scopes only. Beta and every solo scope remained unchanged. The first reply replaced the name with a pronoun and is classified as model output, not a CCM defect. |
| Live Auto State scope isolation | Pass | Group Alpha, Solo Alpha, and Group Alpha/Gamma produced independent history and hash changes with correct usage attribution. No work was duplicated, suppressed, or written across scope boundaries. |
| Character-chat dashboard preflight | Pass | Start New Chat, Re-extract Facts, Update State, and Update Knowledge each warned outside the matching chat. Cancelling performed no provider request; confirming selected Fixture Alpha before the native new-chat confirmation appeared. |
| Configured image workflow | Pass from prior external gate | NoobAI with `Noobai_locked.json` generated successfully in the correct character chat. The RC3 change preserves that workflow and applies the same early chat-context behavior to the other chat-dependent controls. |

## Automated validation

| Command/check | Result |
| --- | --- |
| `npm ci` | Pass; 3 packages installed/audited. |
| `npm run check:syntax` | Pass; 100 production modules. |
| `npm run check:json` | Pass; 6 JSON files. |
| `npm run check:whitespace` | Pass. |
| Focused chat/image tests | Pass; 13/13. |
| Focused image/group tests | Pass; 15/15. |
| `npm test` | Pass; 247/247. |
| `npm run test:browser` | Pass; 6 passed, 3 optional provider-backed checks skipped. |
| `git diff --check` | Pass. |
| `node tools/release.mjs build` | Pass; 106 runtime files. |
| `node tools/release.mjs verify` | Pass; exact inclusion and digest verified. |
| Secret/privacy/line-ending scan | Pass; zero credential patterns, private-data paths, or CRLF runtime files. |
| Disposable artifact synchronization | Pass; artifact-only copy. |
| Artifact/install comparison | Pass; 106/106 hashes identical, zero missing, different, or extra. |
| Browser console review | Pass; zero CCM errors after the rebuilt preflight tests. |

## Defect found and corrected

The live scope sequence exposed a CCM navigation defect: dashboard chat-dependent actions could operate on SillyTavern's previously active card when the CCM dashboard displayed a different character. RC3 routes Start New Chat, Re-extract Facts, Update State, and Update Knowledge through the same active-character-chat warning and open-card preflight used by Image Prompt. The rebuilt artifact was synchronized to the disposable installation and all four actions were rechecked live.

No blocking CCM defect remains from the RC3 promotion matrix.

## Recommendation

All automatic and manual RC3 promotion gates pass. Promotion to final `1.0.0` is technically justified, but the final manifest bump, tag, and publication require separate explicit authorization.
