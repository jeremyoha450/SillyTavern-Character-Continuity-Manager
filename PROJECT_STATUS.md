CCM current status:
- Facts extraction working
- State extraction working
- Knowledge extraction working
- Auto State working
- Auto Knowledge working
- Manual Update State working
- Manual Update Knowledge working
- Character dashboard working
- Custom character image working
- SillyTavern avatar fallback working
- Image Prompt Generator working with Facts and State
- Main dashboard AI provider settings working and saved to SillyTavern per-user storage
- OpenAI-compatible model discovery working through /v1/models
- AI settings can be cleared and saved with no provider selected
- Character data saved to SillyTavern per-user server storage
- Versioned database and AI-settings migrations working
- Existing browser data imports automatically once and is removed after server handoff
- Browser storage retained only as a fallback when server settings are unavailable
- Providers: OpenAI Compatible, OpenAI, OpenRouter, DeepSeek, NanoGPT, Ollama, Anthropic, Gemini
- Token statistics tracked locally from normal AI responses, globally and per character
- Token statistics can be cleared globally or per character
- Character list shows per-character input/output tokens and request count
- CCM dashboard floats beside chat on wide screens and uses SillyTavern's native popup on narrow screens
- CCM launcher and wide-screen floating dashboard are draggable
- Image prompt presets available for Anima, Flux, Pony, Illustrious, NoobAI, and SDXL
- Image prompt preset defaults to None until the user selects one in Settings
- Image prompt preview supports positive and preset-provided negative prompts
- Settings separates AI Provider and Image Generation into tabs
- Every image prompt preset is fully editable in Settings and saved server-side
- Preset editor stays blank until a preset is selected to edit
- Built-in preset files are retained as factory backups for individual or complete restore
- Image prompts can be sent to SillyTavern's configured Image Generation source
- Image Prompt checks that SillyTavern Image Generation has a source and model before using the prompt-writing AI
- Prompt preview closes automatically after successful image generation
- Per-character image prompt history tracks prompt-only, failed, and generated records
- Character dashboard shows Latest Image, Gallery, and Prompt History
- Image details support Copy Prompt, Use Again, Set as Character Image, opening the SillyTavern image, and removal from CCM history

Code review fixes applied 2026-07-03, verified working inside SillyTavern 2026-07-04:
- Knowledge update parser strips markdown code fences and now throws on invalid JSON instead of returning an empty list, so a bad AI response can no longer wipe saved knowledge
- Knowledge change detection compares text/confidence only; item ids and createdAt are preserved across updates
- Auto state/knowledge windows are hashed (SHA-256, cyrb53 fallback on plain http) instead of storing full chat text in settings
- All character-card and AI-derived values rendered via innerHTML are escaped (shared scripts/ui/escape.js); character list no longer crashes on a missing name
- Auto updates have a per-character in-flight guard and re-read settings before saving, so user settings changes during a run are not reverted
- Removed nine unused files (ui - Copy.js, ai/request.js, parser.js, dialogs.js, import-manager.js, constants.js, tasks/facts.js, tasks/state.js, tasks/knowledge/promptw.js)
- New characters no longer default to "White Skin" / "Home" / "Bedroom"; those fields start empty
- Project is now a git repository; branch pre-review-snapshot holds the pre-review backup
- Verified with Node: all files parse, all imports resolve, parser and hash fixes pass runtime checks
- CCM dashboard auto-opens on the new character after creation (fixed after in-app testing)
- In-app test pass covered: creation, manual/auto state and knowledge updates, editor round-trip with quotes, knowledge with special characters, empty defaults, settings/usage/image screens, dashboard refresh

Prompt and preset updates applied and verified in SillyTavern 2026-07-04:
- Knowledge update sends only text/confidence to the model (ids and timestamps stay internal)
- Facts prompt: "White skink" typo fixed; bodyType and skin apply to all genders; single moodIntensity word scale
- State prompt: duplicate moodIntensity rule removed; all "if not described" defaults kept as designed
- Image presets: pose/gaze follows extracted state with facing/looking at viewer as fallback only; NoobAI/Anima/Pony no longer duplicate formatter-supplied quality/score tags; Flux negative emptied; SDXL negative no longer bans realistic styles
- Preset changes require Restore This Preset / Restore All in Settings to reach saved copies

Next major feature:
To be decided

Important working style:
- One feature at a time
- No extra features unless asked
- Give exact file/find/replace instructions
- Do not guess function names; inspect files first
