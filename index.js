// index.js

import { initUI }
from "./scripts/ui.js";

import {
    initializeContinuityManager
} from "./scripts/continuity-manager.js";

import {
    registerDriver,
    getDrivers
} from "./scripts/ai/registry.js";

import openAICompatibleDriver
from "./scripts/drivers/openai-compatible.js";

import openAIDriver
from "./scripts/drivers/openai.js";

import openRouterDriver
from "./scripts/drivers/openrouter.js";

import deepSeekDriver
from "./scripts/drivers/deepseek.js";

import nanoGPTDriver
from "./scripts/drivers/nanogpt.js";

import ollamaDriver
from "./scripts/drivers/ollama.js";

import anthropicDriver
from "./scripts/drivers/anthropic.js";

import geminiDriver
from "./scripts/drivers/gemini.js";

import {
    getCurrentDriver
} from "./scripts/ai/registry.js";

import {
    getDriverSettings
} from "./scripts/ai/settings.js";

import {
    loadHeightDefaults
} from "./scripts/config/height-defaults.js";

registerDriver(
    openAICompatibleDriver
);

registerDriver(
    openAIDriver
);

registerDriver(
    openRouterDriver
);

registerDriver(
    deepSeekDriver
);

registerDriver(
    nanoGPTDriver
);

registerDriver(
    ollamaDriver
);

registerDriver(
    anthropicDriver
);

registerDriver(
    geminiDriver
);

console.log(
    "=== CCM STARTING ==="
);

jQuery(() => {
    console.log(
        "Character Continuity Manager Loaded"
    );

    // Async; getHeightConfig() serves built-in defaults
    // until the file arrives.
    loadHeightDefaults();

    initUI();
    initializeContinuityManager();
});
