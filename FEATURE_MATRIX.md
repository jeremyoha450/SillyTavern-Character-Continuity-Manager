# Feature Matrix

**Audit date:** 2026-07-12 +10:00
**Evidence base:** current CCM code at commit `403213d` plus dirty working tree and tests run during this audit.

Classification meanings: “complete” means a coherent code path exists, not that every live integration was reconfirmed. “Tested” refers to current automated tests unless explicitly marked historical.

| Area / feature | Classification | Evidence and limits |
|---|---|---|
| Automatic record creation | Complete but not fully tested | `continuity-manager.js:createCharacterFromCard`, context sync; live unavailable |
| Avatar-first character matching, legacy name fallback | Complete and tested | `database.js:findCharacterForCard`; `group-database.test.mjs` |
| Character search/sort, active/archive lists | Complete but not fully tested | `ui.js:renderCharacterList`; browser unavailable |
| Dashboard/editor/export | Complete and tested | `ui/dashboard.js`, `ui/editor.js`, `ui/editor-fields.js`; editor tests |
| Archive/restore/delete | Complete but not fully tested | `database.js`; confirmations in list/dashboard; no behavior test for deletion cascade event |
| Images/avatar fallback | Complete but not fully tested | dashboard image source and state actions; live image load not current-tested |
| Inventory | Complete but not fully tested | database/scoped member shape and editor collection |
| Per-character/global statistics | Complete but not fully tested | `usage.js`, `ui/usage.js`; recording exercised indirectly |
| Initial facts extraction | Complete and tested | facts task/parser/provider manager; parser/post-process tests |
| Facts re-extraction and merge | Complete and tested | `ui/state-actions.js:reExtractCharacter`, `merge-data.js`, post-process tests |
| Locks/confidence | Complete and tested | merge logic, editor/confidence UI; transition lock tests |
| Fact post-processing | Complete and heavily tested | `extraction/post-process.js`; extensive tests |
| Height defaults | Complete and tested | config module + shipped config; height tests |
| Age/species handling | Complete and tested at logic level | schemas/prompts/post-processing; no age guard remains; prompt/height tests |
| History | Complete and tested | cap 100 in `history/history.js`; history tests |
| State previous baseline | Complete and tested at logic level | `state/update-state.js:buildStateBaseline`; transition/post-process tests |
| Manual state | Complete but not fully tested | `ui/state-actions.js:updateCharacterState`; browser live flow skipped |
| Automatic state | Complete but not fully tested | generation event, counters, hashes, in-flight set in `continuity-manager.js` |
| State windows/frequencies | Complete but not fully tested | per-character settings and message slices; no threshold integration test |
| Duplicate hash prevention | Complete but not fully tested | `generateHash`, `lastStateHash/lastKnowledgeHash` |
| Expanded visual state | Complete and tested | state schema, post-process, reconciliation, image nudity tests |
| Group-scoped state/history/overrides | Complete and tested at storage logic level | scoped database, state update; group-scope/transition tests |
| Initial knowledge extraction | Complete but not fully tested | knowledge task/provider path; parser tests |
| Existing context/incremental update | Complete and tested at parser level | knowledge-update task and `knowledge/update-knowledge.js` |
| Manual/automatic knowledge | Complete but not fully tested | state actions/orchestrator; live flows skipped |
| Knowledge IDs/timestamps | Complete but not fully tested | generated/preserved in `update-knowledge.js` |
| Knowledge group scope | Complete and tested at storage level | scoped update and group tests |
| Knowledge history behavior | Missing | knowledge changes do not call `addHistory` |
| Semantic duplicate handling | Partial | exact text/confidence comparison only; paraphrases can duplicate |
| Group member resolution | Complete and tested | `group-context.js`, avatar ID and legacy name tests |
| Missing group record creation | Complete but not fully tested | context synchronization code |
| Shared scene | Complete but not fully tested | `database.js:updateGroupContext`, `ui/group-dashboard.js` |
| Speaker attribution/mention targeting | Complete and tested | group context tests |
| Solo/group isolation | Complete and tested | scoped database tests |
| Scoped settings/images/history/inventory/knowledge | Complete and tested at data level | group member shape and scoped access; image UI not live-tested |
| Group deletion/member removal | Partial | deleted character removed from groups; members removed/disabled upstream remain stored but leave `memberOrder` |
| Alias/pronoun/embedded-card targeting | Missing / deliberately limited | exact name mention/speaker heuristic; README disclaims embedded-card splitting |
| Creator card types | Complete and tested | `character-creator-tools.js:CARD_TYPES` |
| Guided/AI-assisted creation | Complete but not fully tested | creator UI/tasks; pure plan/card tests; native live flow not current-tested |
| Connected casts/planning/relationships | Complete and tested | relationship matrix/locking/task tests |
| Creator source/model selection | Complete and tested at logic level | source override/model comparison tests |
| Field generation/examples/clothing/tags/lorebook | Complete and tested at helper/source level | creator modules and tests; some maintenance tests are static checks |
| Avatar upload/generation | Complete but not fully tested | creator UI, ST image helpers; live generation not run |
| Draft recovery | Complete but not fully tested | local-storage draft in creator UI |
| V2/V3 JSON/PNG import | Complete and tested for representative V3 PNG/normalization | `character-card-import.js`; no fuzz/size tests |
| V3 output/native save/group creation | Complete and tested at payload level | card builders/tests, ST endpoints; live save unavailable |
| Creator error/completeness checks | Complete and tested | validator/parser error tests, safe error UI |
| Image prompt inputs/structured generation | Complete and tested at parser/formatter level | image tasks and tests |
| Anima/Flux/Pony/Illustrious/NoobAI/SDXL presets | Complete but not fully tested | six registry modules; preview/live generation not current-tested |
| Preset import/export | Complete and tested | `image-preset-transfer.js` tests |
| Positive/negative prompt behavior | Complete and tested | formatter/nudity/preset tests |
| ST image workflow integration | Complete but not fully tested | `sillytavern-image.js`; selected ST source is external |
| Prompt/image history and gallery | Complete but not fully tested | `image-history.js`, gallery UI; unbounded retention |
| Group image scope/set as image/failures | Complete but not fully tested | scoped calls and status/error paths |
| Explicit preset→workflow mapping | Missing / deliberately external | CCM does not switch ComfyUI workflows |
| Eight provider drivers | Complete but not fully tested | registry/index/drivers; only transport/error slices tested |
| Model discovery | Complete but environment-dependent | every driver exposes `listModels` |
| CCM versus ST active model | Complete and tested at adapter level | AI settings and ST adapter tests |
| Output limits/truncation | Complete but not fully tested | OpenAI transport tested; Anthropic/Gemini code-inspected |
| Usage/corrective retry/error normalization | Complete and tested | dedicated tests |
| Timeout/cancellation/backoff | Missing | categories exist, but no AbortController/backoff implementation |
| ST settings persistence/browser fallback | Complete and tested indirectly | `storage.js`; no full ST persistence test |
| DB/AI migrations/schema | Complete and tested | versions 5/7; maintenance schema test |
| Save timing | Partial | debounced ST save, synchronous fallback; no flush/acknowledgment guarantee |
| Data caps | Partial | history/usage/debug/training capped; knowledge/image history uncapped |
| Debug logging/privacy controls | Complete and tested | `debug-logger.js`, tests |
| Health/provider error details | Complete and tested at module level | health/error tests |
| Developer Mode toggle | Complete and tested at settings level | defaults/persistence test; live visibility not current-tested |
| Database Inspector | Documented only | descriptive list item, no control/function |
| AI Context Viewer | Documented only | generic debug viewer exists, not named tool |
| Safe Debug Bundle | Partially implemented | debug report exists; no combined health/usage/schema bundle |
| Advanced Health | Partially implemented | ordinary Health exists; no advanced developer checks |
| Duration statistics | Partially implemented | duration debug events; not aggregated in Statistics UI |
| Stress tests | Missing | no script/files |
| AI Benchmark | Deliberately deferred | documentation and UI text |
| Recovery Tools | Deliberately deferred | documentation and UI text |
| Training collection | Complete and tested as capture mechanism | quality/approval workflow missing; see compatibility report |
