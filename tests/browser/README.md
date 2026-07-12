# CCM Browser Integration Scaffold

These Playwright checks run against a real, already-running SillyTavern installation. They are intentionally separate from `npm test`; the existing unit/module suite does not require Playwright or a SillyTavern server.

## Setup

1. Install Playwright for development:

   ```text
   npm install --save-dev @playwright/test
   npx playwright install chromium
   ```

2. Start SillyTavern with CCM installed and enabled.
3. Load at least one character/chat so the character-dashboard checks have a record.
4. If SillyTavern requires authentication, use a local test instance or configure Playwright storage state before running.

## Run non-AI smoke tests

PowerShell:

```powershell
$env:CCM_SILLYTAVERN_URL = "http://127.0.0.1:8000"
npm run test:browser
```

The default suite checks:

- CCM launcher opens.
- A character dashboard opens when a record exists.
- AI Provider, Image Generation, Debug / Logging, and Health settings tabs open.
- Character creator opens with its wait layer hidden and navigation enabled.
- Wide/floating and narrow/popup viewport transitions retain a visible dashboard.

## Run live AI flows

These tests can consume tokens and modify continuity, so they are skipped unless explicitly enabled:

```powershell
$env:CCM_E2E_LIVE_AI = "true"
npm run test:browser
```

Live checks cover manual State Update, manual Knowledge Update, and Image Prompt preview. Use a disposable test character and provider configuration.

## Remaining manual checks

- Verify editor save and Copy JSON contents.
- Complete single-character and connected-cast creation, including native SillyTavern confirmation dialogs.
- Generate an image, inspect Gallery/Prompt History, reuse it, and set it as the character image.
- Confirm automatic state/knowledge frequency behavior after real generations.
- Confirm group speaker/name targeting with at least two enabled cards.
