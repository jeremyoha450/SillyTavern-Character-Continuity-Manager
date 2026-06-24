import { initUI }
from "./scripts/ui.js";

import {
    initializeContinuityManager
} from "./scripts/continuity-manager.js";

console.log(
    "=== CCM STARTING ==="
);

jQuery(() => {
    console.log(
        "Character Continuity Manager Loaded"
    );

    initUI();
    initializeContinuityManager();
});