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

Next major feature:
To be decided

Important working style:
- One feature at a time
- No extra features unless asked
- Give exact file/find/replace instructions
- Do not guess function names; inspect files first
