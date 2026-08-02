# Character Continuity Manager

Character Continuity Manager (CCM) is a SillyTavern extension for persistent character continuity. It manages stable facts, current state, and durable knowledge across chats while keeping solo continuity separate from group-specific continuity.

**Current release:** `1.0.0`

## Features

### Continuity and character management

- AI-assisted extraction of facts, current state, and durable knowledge.
- Manual and automatic state and knowledge updates.
- Per-field confidence values, editing, and locks.
- Character dashboards with active/archive management and update history.
- A character editor with clipboard JSON export.
- Per-user server persistence with a legacy browser-storage fallback.
- Versioned database and AI-settings migrations.
- Configurable age/gender height defaults with a built-in fallback.

### Character creation

- Guided creation of one character or a connected cast of up to eight separate SillyTavern cards.
- Full editable card review covering identity, appearance, background, personality, behaviour, speech, scenario, greetings, example dialogue, and lorebook.
- Searchable character-tag selection using installed SillyTavern tags, common suggestions, and custom tag creation.
- V2/V3 JSON and PNG imports as editable starting points without overwriting the originals.
- Native SillyTavern character and group storage with V3 card support.

### Groups

- A dedicated dashboard for chats composed of multiple separate SillyTavern character cards.
- Group-specific continuity for each member, isolated from that character's solo continuity.
- Shared scene notes, speaker preservation, avatar-based member resolution, and explicit-name targeting.
- Direct access to each member's group-specific details, editor, knowledge, history, and images.

### Images

- Per-character images with SillyTavern avatar fallback.
- Image-prompt generation from current continuity data.
- Editable Anima, Flux, Pony, Illustrious, NoobAI, and SDXL prompt presets.
- Validated import and export of custom image-prompt presets.
- SillyTavern Image Generation integration with prompt history, gallery, and image reuse.

### AI providers and automation

- OpenAI Compatible, OpenAI, OpenRouter, DeepSeek, NanoGPT, Ollama, Anthropic, and Gemini providers.
- Global selection between CCM's configured provider and SillyTavern's active model.
- One bounded corrective retry for malformed, incomplete, or truncated structured output.
- Global and per-character token/request statistics.

### Reliability, privacy, and diagnostics

- Privacy-safe provider errors covering authentication, billing, rate limits, filtering, context, capacity, timeout, and network failures, with copyable diagnostics.
- Optional local-only, category-filtered diagnostic logging with secret/private-content exclusion, viewing, copying, downloading, retention limits, and clearing.
- Optional Training Data Collection with explicit opt-in, local bounded records, JSON export, and clear controls.
- A safe Health settings tab showing version, provider, image, height, storage, and logging status without secrets.

## Character Creator

The Character Creator begins with cast size and card type:

- Individual Character
- Connected Cast
- Open World
- Narrator/Scenario
- Tool/Assistant

It supports guided manual creation and AI-assisted creation, with questions and generation instructions tailored to the selected card type. AI creation can use either CCM's configured provider or SillyTavern's active model.

### Planning and source material

- Model comparison displays detectable parameter count, quantization, and context size. Unavailable specifications are labelled as unknown, and the larger model is recommended for four or more connected characters when a reliable comparison is possible.
- Existing installed SillyTavern cards and V2/V3 JSON or PNG files can be loaded as editable starting points without overwriting the original.
- Connected casts use a pairwise relationship matrix and can be added to a new SillyTavern group automatically.
- A personal scenario can be supplied directly or delegated to the AI.
- Information fields include coherent clickable examples and a complete-example fill option for one character or a connected cast.

### Editing and review

- Usual clothing is entered as top/dress, bottom, footwear, undergarments, and other recurring style details, then combined into the card's stable clothing description. Leaving every clothing field blank uses the stable random-outfit fallback.
- Compact, standard, and detailed output modes are available.
- Drafts are autosaved, with token estimates, completion checks, and a full card preview.
- Every field includes contextual help, remains editable, and supports per-field AI writing or revision.
- Each card can use an uploaded avatar or one generated through SillyTavern.
- A visual embedded-lorebook editor is included.

Created cards include V3 fields and use SillyTavern's native character and group endpoints for storage and compatibility.

## Character Dashboards

The character dashboard provides active/archive management, update history, per-field confidence and locks, manual updates, automation controls, token/request statistics, editing, JSON export, knowledge, inventory, and image access. Character images fall back to the corresponding SillyTavern avatar when no custom image is assigned.

## Groups

In SillyTavern group chats, CCM resolves enabled members by avatar ID and creates a separate continuity scope for that group. It preserves speaker names and updates members who spoke or were explicitly named in the latest reply. Solo records are not changed by group updates.

The group dashboard contains shared scene notes and links to each member's group-specific details, editor, knowledge, history, and images.

CCM is designed for groups made from separate SillyTavern character cards. A card that contains several characters is intentionally treated as one character record unless those characters are manually separated into individual cards.

## Images

Image prompts use the selected character's current continuity data. CCM provides editable presets for Anima, Flux, Pony, Illustrious, NoobAI, and SDXL, plus validated custom-preset import and export. SillyTavern Image Generation integration provides prompt history, a gallery, image reuse, and per-character image assignment.

In group chats, shared scene location and area are combined with the selected member's group-specific pose, expression, clothing, hands, and other state. Solo image continuity remains isolated from group continuity.

## AI Providers and Model Selection

CCM supports OpenAI Compatible, OpenAI, OpenRouter, DeepSeek, NanoGPT, Ollama, Anthropic, and Gemini. A global AI-source setting selects either CCM's configured provider or SillyTavern's active model.

Routine State and Knowledge automation can make many requests and depends on reliable structured extraction. Use a capable local model for that workload; a mid-sized model in roughly the current 7B–9B class is a practical starting point, while models below roughly 4B are generally unsuitable for reliable structured output. Smaller models may require CCM's single bounded corrective retry and can still fail when they cannot satisfy the schema.

When the SillyTavern active model is selected, CCM supplies the task's required response length per request. Character planning requests up to 8,192 output tokens, full-card generation requests up to 16,384, and field revisions request up to 4,096. SillyTavern restores the user's normal response-length setting after each request.

## Logging

The **Debug / Logging** settings tab is disabled by default.

### Standard Logging

Standard logging stores only small structured diagnostic events in the current browser. It excludes prompts, AI responses, character names, chat text, endpoints, headers, API keys, and credentials.

Categories can be enabled individually, and logs can be viewed, copied, downloaded, or cleared locally. Logging is not retroactive: CCM cannot recover requests, responses, or events that occurred while logging was disabled.

The tab includes a reporting checklist explaining which category to enable, how to reproduce an issue, when AI input/output capture is useful, and how to download the JSON report for support.

### AI Input/Output Capture

An additional explicit opt-in can capture AI inputs and raw outputs when diagnosing difficult AI problems. The interface warns that these records may contain private character or chat content. Each captured input/output is limited to 20,000 characters, and recognizable credentials are redacted.

Developer Mode is also located under **Debug / Logging** and is off by default. It reveals advanced troubleshooting scope information without cluttering the normal interface. It does not show dead placeholder controls, change AI behaviour, or expose private content by itself. See `DEVELOPER_TOOLS.md`.

## Training Data

Training Data Collection is disabled by default and requires explicit opt-in. When enabled, it stores bounded records locally for CCM AI tasks, including:

- input messages;
- raw AI responses;
- parsed outputs and parse success/failure;
- retry information;
- provider, source, and model metadata;
- safe scope identifiers where available.

These records are intended for later fine-tuning preparation and may contain private character, scenario, roleplay/chat, image-prompt, and generated-card content. Recognizable credentials are redacted, but every export should still be reviewed before sharing.

Records are limited by the configured maximum, can be exported as JSON, and can be cleared locally. CCM-AI and model research remain separate from this extension.

## Health and Diagnostics

The Health tab reports CCM, database, AI-settings, and SillyTavern versions together with provider, model, image-generation, height-configuration, storage, and logging status. It never displays API keys, credentials, prompts, or character/chat content.

Global and per-character statistics show token and request usage. Provider failures are classified into useful authentication, billing, rate-limit, filtering, context, capacity, timeout, and network categories without exposing raw private provider content.

## Data Storage and Compatibility

Runtime character data is stored in SillyTavern's per-user extension settings, with a legacy browser-storage fallback. The current database format is documented in `schema.json`, and database and AI-settings migrations are versioned.

Configurable age/gender height defaults are loaded from the shipped configuration with a built-in fallback when the file is unavailable or invalid.

## Development

Run the automated test suite with:

```text
npm test
```

A documented Playwright scaffold for browser smoke testing is under `tests/browser`. It is optional and does not change the normal test command; see `tests/browser/README.md` for setup and live-AI test requirements.

Build the runtime-only artifact with `npm run release:build` and compare it with a local installation using `npm run release:compare`.

## Release Hardening and Known Limits

- Imported JSON/PNG cards are limited to 5 MB. Decoded card JSON is limited to 2 MB and 24 nesting levels, with at most 200 tags, 100 alternate greetings of each type, and 500 lorebook entries. PNG signatures and chunk bounds are validated.
- Prompt/image history keeps the newest 200 records per character and group scope. The active image reference is separate and is not pruned.
- Durable knowledge is not silently pruned. Knowledge history is intentionally omitted.
- Direct CCM provider HTTP requests time out after 300 seconds. No manual Cancel UI is provided because the SillyTavern active-model route cannot be cancelled safely end to end.
- Training Data Collection is experimental, opt-in, bounded, and off by default. CCM-AI and model research remain separate.

## Status

CCM `1.0.0` is the current release. The v1.0.x line is reserved for bug fixes and SillyTavern/provider compatibility maintenance.
