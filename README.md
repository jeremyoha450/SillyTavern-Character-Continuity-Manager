# Character Continuity Manager

Character Continuity Manager (CCM) is a SillyTavern extension that tracks character facts, current state, and durable knowledge across chats.

**Current release:** `1.0.0`

## Features

- AI-assisted facts, state, and knowledge extraction.
- Guided creation of one character or a connected cast of up to eight separate SillyTavern cards.
- Full editable card review covering identity, appearance, background, personality, behaviour, speech, scenario, greetings, example dialogue, and lorebook.
- Searchable character-tag picker using existing SillyTavern tags, common suggestions, and custom tag creation.
- Manual and automatic state and knowledge updates.
- A dedicated group dashboard for chats made from multiple separate character cards.
- Group-specific member continuity kept separate from each member's solo continuity.
- Per-field confidence values, editing, and locks.
- Character dashboard with active/archive management and update history.
- Character editor with clipboard JSON export.
- Per-character images with SillyTavern avatar fallback.
- Image prompt generation from current continuity data.
- Editable Anima, Flux, Pony, Illustrious, NoobAI, and SDXL prompt presets.
- Validated import and export of custom image-prompt presets.
- SillyTavern Image Generation integration, prompt history, gallery, and image reuse.
- OpenAI Compatible, OpenAI, OpenRouter, DeepSeek, NanoGPT, Ollama, Anthropic, and Gemini providers.
- Global AI source selection between CCM's configured provider and SillyTavern's active model.
- Global and per-character token/request statistics.
- Optional local-only, category-filtered diagnostic logging with secret/private-content exclusion, viewing, copying, downloading, retention limits, and clearing.
- Optional Training Data Collection for future CCM model work, disabled by default, with local bounded records, JSON export, and clear controls.
- Per-user server persistence with legacy browser-storage fallback.
- Versioned database and AI-settings migrations.
- Configurable age/gender height defaults with built-in fallback.
- One bounded corrective retry for malformed, incomplete, or truncated structured AI output.
- Privacy-safe provider error reporting with useful authentication, billing, rate-limit, filtering, context, capacity, timeout, and network categories plus copyable diagnostics.
- A safe Health settings tab showing version, provider, image, height, storage, and logging status without secrets.

Facts, state, knowledge, and image prompts use the same workflow regardless of character age.

The character creator begins with the cast size and card type: Individual Character, Connected Cast, Open World, Narrator/Scenario, or Tool/Assistant. It then offers guided manual creation or AI-assisted creation with questions and generation instructions tailored to the selected type. AI creation can use either CCM's configured provider or SillyTavern's active model. The comparison displays detectable parameter count, quantization, and context size, labels unavailable specifications as unknown, and recommends the larger model for four or more connected characters when a reliable comparison is possible. Existing installed SillyTavern cards and V2/V3 JSON or PNG files can be loaded as editable starting points without overwriting the original. Connected casts use a pairwise relationship matrix. A personal scenario can be supplied or delegated to the AI. Creator information fields include coherent clickable examples and a complete-example fill option for either one character or a connected cast. Usual clothing is entered as top/dress, bottom, footwear, undergarments, and other recurring style details, then combined into the card's stable clothing description; leaving every clothing field blank uses the stable random-outfit fallback. The creator also includes compact/standard/detailed output modes, autosaved drafts, token estimates, completion checks, card preview, uploaded or SillyTavern-generated per-card avatars, per-field AI writing/revision, and a visual embedded-lorebook editor. Every field includes contextual help and remains editable. Connected cards can be added to a new SillyTavern group automatically. Created cards include V3 fields while using SillyTavern's native character and group endpoints for storage and compatibility.

Routine State and Knowledge automation can make many requests. A separate 7B–9B CCM model is recommended for that workload; 4B is the practical minimum, and models below 4B are not recommended for reliable structured output.

The Debug / Logging settings tab is disabled by default. Standard logging stores only small structured diagnostic events in the current browser and excludes prompts, AI responses, character names, chat text, endpoints, headers, API keys, and credentials. An additional explicit opt-in can capture AI inputs and raw outputs for difficult AI problems; the UI warns that this may contain private character/chat content, limits each captured input/output to 20,000 characters, and redacts recognizable credentials. Categories can be enabled individually, and logs can be viewed, copied, downloaded, or cleared locally.

Logging is not retroactive: CCM cannot recover requests, responses, or events that occurred while logging was disabled. The Debug / Logging tab includes a reporting checklist explaining which category to enable, when AI input/output capture is useful, how to reproduce the issue, and how to download the JSON report for support.

Developer Mode is also located in Debug / Logging and is off by default. It reveals advanced troubleshooting scope information for developers without cluttering the normal interface. It does not show dead placeholder buttons, change AI behavior, or expose private content by itself. See `DEVELOPER_TOOLS.md`.

The Training Data settings tab is also disabled by default and requires explicit opt-in. When enabled, it stores local examples for CCM AI tasks, including input messages, raw AI responses, parsed outputs, parse success/failure, retries, provider/source/model metadata, and safe scope identifiers where available. These records are meant for later fine-tuning preparation and may contain private character, scenario, roleplay/chat, image-prompt, and generated-card content. Recognizable credentials are redacted, but exports should be reviewed before sharing. Records are bounded by the configured maximum and can be exported as JSON or cleared locally.

When the SillyTavern active model is selected, CCM supplies each task's output-token requirement as a per-request response length. Character planning and full-card generation request up to 8,192 output tokens, while field revisions request up to 4,096. SillyTavern restores the user's normal response-length setting after each request.

In SillyTavern group chats, CCM resolves enabled members by avatar ID, creates a separate continuity scope for the group, preserves speaker names, and updates members who spoke or were explicitly named in the latest reply. The group dashboard contains shared scene notes and links to each member's group-specific details, editor, knowledge, history, and images. Solo records are not changed by group updates. Several characters embedded inside one card are not split automatically.

## Development

Run the automated test suite with:

```text
npm test
```

A documented Playwright scaffold for browser smoke testing is under `tests/browser`. It is optional and does not change the normal test command; see `tests/browser/README.md` for setup and live-AI test requirements.

The current database format is documented by `schema.json`. Runtime character data is stored in SillyTavern's per-user extension settings.

### Release hardening and limits

- Imported JSON/PNG cards are limited to 5 MB. Decoded card JSON is limited to 2 MB and 24 nesting levels, with at most 200 tags, 100 alternate greetings of each type, and 500 lorebook entries. PNG signatures and chunk bounds are validated.
- Prompt/image history keeps the newest 200 records per character and group scope. The active image reference is separate and is not pruned.
- Durable knowledge is not silently pruned. Knowledge history is intentionally omitted.
- Direct CCM provider HTTP requests time out after 60 seconds. No manual Cancel UI is provided because the SillyTavern active-model route cannot be cancelled safely end to end.
- Training Data Collection is experimental, opt-in, and default-off. CCM-AI and model research remain separate.

Build the runtime-only artifact with `npm run release:build` and compare it with the local installation using `npm run release:compare`.

## Status

CCM is undergoing maintenance and compatibility cleanup in preparation for a v1.0 release. See `PROJECT_STATUS.md` for the current verification state.
