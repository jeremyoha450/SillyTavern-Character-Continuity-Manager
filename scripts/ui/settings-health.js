import { getHealthSnapshot } from "../health.js";
import { escapeHtml } from "./escape.js";

export function bindHealthPanel(dialog) {
    const render = async () => {
        const output = dialog.querySelector("#ccm-health-summary");
        if (!output) return;
        output.textContent = "Loading health information…";
        const health = await getHealthSnapshot();
        const rows = [
            ["CCM version", health.ccmVersion],
            ["Database schema", health.databaseVersion],
            ["AI settings schema", health.aiSettingsVersion],
            ["SillyTavern version", health.sillyTavernVersion],
            ["AI source", health.aiSource],
            ["Active provider", health.provider],
            ["Active model", health.model],
            ["Image generation", health.imageGeneration],
            ["Selected image preset", health.imagePreset],
            ["Height configuration", health.heightConfig],
            ["Storage", health.storage],
            ["Debug logging", health.debugLogging]
        ];
        output.innerHTML = rows.map(([label, value]) => `
            <div class="ccm-health-row">
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(value)}</span>
            </div>
        `).join("");
    };

    dialog.querySelector("#ccm-health-refresh")?.addEventListener("click", render);
    render();
    return render;
}
